import { onUnmounted, shallowReactive } from 'vue'
import type { Context } from '@satoriapp/webui'
import type { AppMessage } from '@satoriapp/plugin-message'

interface ClientChannel { messages: ClientMessage[], loading: boolean }
interface ClientMessage extends Omit<AppMessage, 'seq'> { seq: bigint }
type SerializedMsg = Omit<AppMessage, 'seq'> & { seq: string }

export function useMessages(ctx: Context) {
  const logger = ctx.logger('messages')
  const channels = shallowReactive(new Map<string, ClientChannel>())

  async function loadChannel(id: string) {
    const { platform, channelId } = parseChannelId(id)
    channels.set(id, { messages: channels.get(id)?.messages ?? [], loading: true })
    try {
      const res = await ctx.link.action<{ list: SerializedMsg[] }>('message.list', { platform, channelId, limit: 50 })
      const msgs = (res.list ?? []).map(deserialize)
      channels.set(id, { messages: msgs, loading: false })
      logger.debug('loadChannel %s: loaded %d messages', id, msgs.length)
    }
    catch (err) {
      logger.warn('loadChannel %s failed: %s', id, err instanceof Error ? err.message : String(err))
      channels.set(id, { messages: channels.get(id)?.messages ?? [], loading: false })
    }
  }

  const unsub = ctx.link.on<SerializedMsg>('message.created', (msg) => {
    logger.debug('message.created received: platform=%s channelId=%s seq=%s', msg.platform, msg.channelId, msg.seq)
    const id = `${msg.platform}:${msg.channelId}`
    const ch = channels.get(id)
    if (!ch) {
      logger.debug('channel not in cache, skipping: %s', id)
      return
    }
    const deserialized = deserialize(msg)
    const messages = [...ch.messages]
    let lo = 0
    let hi = messages.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if (messages[mid].seq < deserialized.seq)
        lo = mid + 1
      else
        hi = mid
    }
    messages.splice(lo, 0, deserialized)
    channels.set(id, { messages, loading: false })
    logger.debug('appended to channel %s, total=%d', id, channels.get(id)!.messages.length)
  })

  onUnmounted(unsub)
  return { channels, loadChannel }
}

function deserialize(raw: SerializedMsg): ClientMessage {
  return { ...raw, seq: BigInt(raw.seq) }
}

export function parseChannelId(id: string): { platform: string, channelId: string } {
  const colonIdx = id.indexOf(':')
  return { platform: id.slice(0, colonIdx), channelId: id.slice(colonIdx + 1) }
}
