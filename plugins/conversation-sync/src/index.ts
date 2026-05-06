import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import { Service } from 'cordis'
import type {} from '@satoriapp/state'

declare module 'cordis' {
  interface Context {
    conversationSync: ConversationSyncService
  }
}

type ConversationType = 'channel' | 'group' | 'private'

function asConversationType(value: unknown): ConversationType {
  if (value === 'channel' || value === 'group' || value === 'private')
    return value
  return 'channel'
}

export class ConversationSyncService extends Service {
  static readonly inject = ['stater', 'logger']

  constructor(ctx: Context) {
    super(ctx, 'conversationSync')
  }

  async* [Service.init]() {
    const ctx = this.ctx

    ctx.on('message/created', (message: AppMessage, payload?: Record<string, unknown>) => {
      this.onMessageCreated(message, asConversationType(payload?.conversationType))
    })

    ctx.on('state/changed', () => {
      this.clearUnreadOfCurrent()
    })

    this.clearUnreadOfCurrent()

    ctx.logger('conversation-sync').info('conversation sync started')

    yield () => {
      ctx.logger('conversation-sync').info('conversation sync stopped')
    }
  }

  private onMessageCreated(message: AppMessage, conversationType: ConversationType = 'channel') {
    const stater = this.ctx.stater
    const isCurrent = stater.data.conversation.currentId === message.channelId
    const unreadDelta = (message.localOnly || message.isEvent || isCurrent) ? 0 : 1

    stater.mutate((d) => {
      const list = d.conversation.list
      const index = list.findIndex(item => item.platform === message.platform && item.channelId === message.channelId)

      if (index >= 0) {
        list[index] = {
          ...list[index],
          opened: true,
          unreadCount: list[index].unreadCount + unreadDelta,
        }
      }
      else {
        list.push({
          type: conversationType,
          opened: true,
          pinned: false,
          platform: message.platform,
          channelId: message.channelId,
          unreadCount: unreadDelta,
          mute: false,
        })
      }
    })
  }

  private lastCurrentId = ''

  private clearUnreadOfCurrent() {
    const stater = this.ctx.stater
    const currentId = stater.data.conversation.currentId
    if (currentId === this.lastCurrentId)
      return
    this.lastCurrentId = currentId
    if (!currentId)
      return
    stater.mutate((d) => {
      const list = d.conversation.list
      const index = list.findIndex(item => item.channelId === currentId)
      if (index >= 0 && list[index].unreadCount !== 0) {
        list[index] = { ...list[index], unreadCount: 0 }
      }
    })
  }
}

export const name = 'conversation-sync'
export default ConversationSyncService
