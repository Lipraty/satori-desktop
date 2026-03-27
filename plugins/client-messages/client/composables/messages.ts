import { onUnmounted, shallowReactive } from 'vue'
import type { Context } from '@satoriapp/webui'
import type { AppMessage } from '@satoriapp/plugin-message'

interface ClientChannel { messages: ClientMessage[], loading: boolean }
interface ClientMessage extends Omit<AppMessage, 'seq'> { seq: bigint }
type SerializedMsg = Omit<AppMessage, 'seq'> & { seq: string }

export function useMessages(ctx: Context) {
  const channels = shallowReactive(new Map<string, ClientChannel>())

  async function loadChannel(id: string) {
    const colonIdx = id.indexOf(':')
    const platform = id.slice(0, colonIdx)
    const channelId = id.slice(colonIdx + 1)
    channels.set(id, { messages: channels.get(id)?.messages ?? [], loading: true })
    try {
      const res = await ctx.link.action<{ list: SerializedMsg[] }>('message.list', { platform, channelId, limit: 50 })
      const msgs = (res.list ?? []).map(deserialize)
      channels.set(id, { messages: msgs, loading: false })
      console.debug('[useMessages] loadChannel %s: loaded %d messages', id, msgs.length)
    }
    catch (err) {
      console.warn('[useMessages] loadChannel %s failed:', id, err)
      channels.set(id, { messages: channels.get(id)?.messages ?? [], loading: false })
    }
  }

  const unsub = ctx.link.on<SerializedMsg>('message.created', (msg) => {
    console.debug('[useMessages] message.created received: platform=%s channelId=%s seq=%s', msg.platform, msg.channelId, msg.seq)
    const id = `${msg.platform}:${msg.channelId}`
    const ch = channels.get(id)
    if (!ch) {
      console.debug('[useMessages] channel not in cache, skipping: %s', id)
      return
    }
    channels.set(id, { messages: [...ch.messages, deserialize(msg)], loading: false })
    console.debug('[useMessages] appended to channel %s, total=%d', id, channels.get(id)!.messages.length)
  })

  onUnmounted(unsub)
  return { channels, loadChannel }
}

function deserialize(raw: SerializedMsg): ClientMessage {
  return { ...raw, seq: BigInt(raw.seq) }
}
