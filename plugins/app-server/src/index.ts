import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import { Service } from 'cordis'
import type {} from '@satoriapp/link' // module augmentation

interface SpanSummary {
  uid: string
  type: 'remote' | 'sync' | 'local'
  front: bigint
  back: bigint
  data: AppMessage[]
  prev?: string
  next?: string
}

interface AppMessageContract {
  create: (input: {
    id?: string
    platform: string
    channelId: string
    timestamp?: number
    content?: string
    localOnly?: boolean
    isEvent?: boolean
    eventType?: string
    eventId?: string
    dead?: boolean
    conversationType?: 'channel' | 'group' | 'private'
    payload?: Record<string, unknown>
  }) => Promise<AppMessage>
  getMessage: (channelId: string, messageId: string) => AppMessage | undefined
  listByChannel: (platform: string, channelId: string, limit?: number) => AppMessage[]
  listSpans: (platform: string, channelId: string) => SpanSummary[]
  deleteMessage: (seq: bigint, dead?: boolean) => boolean
  getMetrics: () => Record<string, number>
  recoverChannel: (platform: string, channelId: string, limit?: number) => Promise<number>
}

declare module 'cordis' {
  interface Context {
    appServer: AppServerService
  }
}

export class AppServerService extends Service {
  static readonly inject = ['link', 'message', 'logger']

  constructor(ctx: Context) {
    super(ctx, 'appServer')
  }

  private serializeMsg(msg: AppMessage): Record<string, unknown> {
    return { ...msg, seq: msg.seq.toString() }
  }

  private errorResponse(code: string, message: string) {
    return { error: { code, message } }
  }

  private get appMessage(): AppMessageContract {
    return this.ctx.message as unknown as AppMessageContract
  }

  async* [Service.init]() {
    const link = this.ctx.link

    yield link.action('login.list', () => {
      return []
    })

    yield link.action('message.create', async (payload: {
      id?: string
      platform?: string
      channelId?: string
      timestamp?: number
      content?: string
      localOnly?: boolean
      isEvent?: boolean
      eventType?: string
      eventId?: string
      dead?: boolean
      conversationType?: 'channel' | 'group' | 'private'
      payload?: Record<string, unknown>
    } = {}) => {
      if (!payload.platform || !payload.channelId) {
        return this.errorResponse('EBADREQ', 'message.create requires platform and channelId')
      }
      return {
        message: this.serializeMsg(await this.appMessage.create({
          ...payload,
          localOnly: payload.localOnly ?? false,
          platform: payload.platform,
          channelId: payload.channelId,
        })),
        updatedAt: Date.now(),
      }
    })

    yield link.action('message.get', (payload: {
      channelId?: string
      messageId?: string
    } = {}) => {
      if (!payload.channelId || !payload.messageId) {
        return this.errorResponse('EBADREQ', 'message.get requires channelId and messageId')
      }
      const message = this.appMessage.getMessage(payload.channelId, payload.messageId)
      if (!message) {
        return this.errorResponse('ENOENT', 'message not found')
      }
      return { message: this.serializeMsg(message), updatedAt: Date.now() }
    })

    yield link.action('message.list', (payload: {
      platform?: string
      channelId?: string
      limit?: number
    } = {}) => {
      if (!payload.platform || !payload.channelId) {
        return this.errorResponse('EBADREQ', 'message.list requires platform and channelId')
      }
      const limit = Math.max(1, Math.min(500, Number(payload.limit || 50)))
      return {
        list: this.appMessage.listByChannel(payload.platform, payload.channelId, limit).map(m => this.serializeMsg(m)),
        updatedAt: Date.now(),
      }
    })

    yield link.action('message.delete', (payload: {
      seq?: string | number | bigint
      dead?: boolean
    } = {}) => {
      if (payload.seq == null) {
        return this.errorResponse('EBADREQ', 'message.delete requires seq')
      }
      let seq: bigint
      try {
        seq = typeof payload.seq === 'bigint' ? payload.seq : BigInt(payload.seq)
      }
      catch {
        return this.errorResponse('EBADREQ', 'message.delete seq must be bigint-compatible')
      }
      return { ok: this.appMessage.deleteMessage(seq, payload.dead ?? true), updatedAt: Date.now() }
    })

    this.ctx.logger('app-server').info('app server routes registered')
  }
}

export const name = 'app-server'
export default AppServerService
