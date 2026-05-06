import { computed, onUnmounted, ref, shallowReactive, watch } from 'vue'
import type { ComputedRef, Ref, WritableComputedRef } from 'vue'
import type { Context } from '@satoriapp/webui'
import type { AppMessage } from '@satoriapp/plugin-message'
import type { ConversationItem } from '@satoriapp/state'

export interface ClientMessage extends Omit<AppMessage, 'seq'> { seq: bigint }
export type SerializedMsg = Omit<AppMessage, 'seq'> & { seq: string }

export function parseChannelId(id: string): { platform: string, channelId: string } {
  const colonIdx = id.indexOf(':')
  if (colonIdx < 0) return { platform: '', channelId: id }
  return { platform: id.slice(0, colonIdx), channelId: id.slice(colonIdx + 1) }
}

export function toChannelId(item: { platform: string, channelId: string }): string {
  return `${item.platform}:${item.channelId}`
}

function deserialize(raw: SerializedMsg): ClientMessage {
  return { ...raw, seq: BigInt(raw.seq) }
}

export interface ConversationApi {
  conversations: ComputedRef<ConversationItem[]>
  currentId: ComputedRef<string>
  select: (item: ConversationItem) => void
  unreadOf: (id: string) => number
}

export function useConversation(ctx: Context): ConversationApi {
  const data = ctx.stater.data
  const conversations = computed<ConversationItem[]>(() => data.conversation?.list ?? [])
  const currentId = computed(() => data.conversation?.currentId ?? '')
  return {
    conversations,
    currentId,
    select(item) {
      const id = toChannelId(item)
      ctx.stater.mutate((d) => {
        d.conversation.currentId = id
      })
    },
    unreadOf(id: string) {
      return conversations.value.find(c => toChannelId(c) === id)?.unreadCount ?? 0
    },
  }
}

export interface MessageStreamApi {
  messages: ComputedRef<ClientMessage[]>
  loading: Ref<boolean>
  reload: () => Promise<void>
}

export function useMessageStream(ctx: Context, channelId: ComputedRef<string>): MessageStreamApi {
  const channels = shallowReactive(new Map<string, { messages: ClientMessage[], loading: boolean }>())

  async function load(id: string) {
    if (!id) return
    const { platform, channelId: cid } = parseChannelId(id)
    channels.set(id, { messages: channels.get(id)?.messages ?? [], loading: true })
    try {
      const res = await ctx.link.action<{ platform: string, channelId: string, limit: number }, { list: SerializedMsg[] }>('message.list', { platform, channelId: cid, limit: 50 })
      channels.set(id, { messages: (res.list ?? []).map(deserialize), loading: false })
    }
    catch (err) {
      console.warn('[messages] loadChannel %s failed:', id, err instanceof Error ? err.message : String(err))
      channels.set(id, { messages: channels.get(id)?.messages ?? [], loading: false })
    }
  }

  const unsub = ctx.link.on<SerializedMsg>('message.created', (raw) => {
    const id = toChannelId(raw)
    const ch = channels.get(id)
    if (!ch) return
    const msg = deserialize(raw)
    const messages = [...ch.messages]
    let lo = 0
    let hi = messages.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (messages[mid].seq < msg.seq) lo = mid + 1
      else hi = mid
    }
    messages.splice(lo, 0, msg)
    channels.set(id, { messages, loading: false })
  })

  watch(channelId, (id) => {
    if (id && !channels.has(id)) void load(id)
  }, { immediate: true })

  onUnmounted(unsub)

  return {
    messages: computed(() => channels.get(channelId.value)?.messages ?? []),
    loading: computed(() => channels.get(channelId.value)?.loading ?? false) as Ref<boolean>,
    reload: () => load(channelId.value),
  }
}

export interface DraftApi {
  draft: WritableComputedRef<string>
}

export function useDraft(ctx: Context, channelId: ComputedRef<string>): DraftApi {
  const local = ref('')
  watch(channelId, (id) => {
    local.value = ctx.stater.data.conversation?.drafts?.[id] ?? ''
  }, { immediate: true })

  const draft = computed<string>({
    get: () => local.value,
    set: (val) => {
      local.value = val
      const id = channelId.value
      if (!id) return
      ctx.stater.mutate((d) => {
        if (val) d.conversation.drafts[id] = val
        else delete d.conversation.drafts[id]
      })
    },
  })
  return { draft }
}

export async function sendMessage(ctx: Context, channelId: string, content: string): Promise<void> {
  const { platform, channelId: cid } = parseChannelId(channelId)
  await ctx.link.action('message.create', { platform, channelId: cid, content })
}
