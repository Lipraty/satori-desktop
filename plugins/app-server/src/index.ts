import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import { Service } from 'cordis'
import type {} from '@satoriapp/link' // module augmentation
import type {} from '@satoriapp/state' // module augmentation

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
  static readonly inject = ['link', 'message', 'stater']

  private readonly routeDisposers: Array<() => void> = []

  constructor(ctx: Context) {
    super(ctx, 'appServer', true)
  }

  private serializeMsg(msg: AppMessage): Record<string, unknown> {
    return { ...msg, seq: msg.seq.toString() }
  }

  private errorResponse(code: string, message: string) {
    return { error: { code, message } }
  }

  private get appMessage(): AppMessageContract {
    return this.ctx.message as AppMessageContract
  }

  async start() {
    const link = this.ctx.link

    this.routeDisposers.push(link.action('ping', () => ({
      ok: true,
      timestamp: Date.now(),
    })))

    this.routeDisposers.push(link.action('message.create', async (payload: {
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
    }))

    this.routeDisposers.push(link.action('message.get', (payload: {
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
    }))

    this.routeDisposers.push(link.action('message.list', (payload: {
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
    }))

    this.routeDisposers.push(link.action('message.delete', (payload: {
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
    }))

    this.routeDisposers.push(link.action('message.metrics', () => ({
      metrics: this.appMessage.getMetrics(),
      updatedAt: Date.now(),
    })))

    this.routeDisposers.push(link.action('message.recover', async (payload: {
      platform?: string
      channelId?: string
      limit?: number
    } = {}) => {
      if (!payload.platform || !payload.channelId) {
        return this.errorResponse('EBADREQ', 'message.recover requires platform and channelId')
      }
      const limit = Math.max(1, Math.min(2000, Number(payload.limit || 200)))
      return {
        recovered: await this.appMessage.recoverChannel(payload.platform, payload.channelId, limit),
        updatedAt: Date.now(),
      }
    }))

    this.routeDisposers.push(link.action('message.spans', (payload: {
      platform?: string
      channelId?: string
    } = {}) => {
      if (!payload.platform || !payload.channelId) {
        return this.errorResponse('EBADREQ', 'platform and channelId required')
      }
      const spans = this.appMessage.listSpans(payload.platform, payload.channelId)
      return {
        spans: spans.map(s => ({
          uid: s.uid,
          type: s.type,
          front: s.front.toString(),
          back: s.back.toString(),
          count: s.data.length,
          prev: s.prev,
          next: s.next,
        })),
        updatedAt: Date.now(),
      }
    }))

    this.ctx.on('message/created', (message: AppMessage, payload?: Record<string, unknown>) => {
      this.syncConversationState(message, payload?.conversationType as any)
    })

    this.logger.info('app server routes registered (%d routes)', this.routeDisposers.length)
  }

  private syncConversationState(message: AppMessage, conversationType: 'channel' | 'group' | 'private' = 'channel') {
    const state = this.ctx.stater
    if (!state)
      return
    const snap = state.snapshot().conversation as {
      list: Array<{
        type: 'channel' | 'group' | 'private'
        opened: boolean
        pinned: boolean
        platform: string
        channelId: string
        unreadCount: number
        mute: boolean
      }>
    }

    const list = [...(snap?.list || [])]
    const index = list.findIndex(item => item.platform === message.platform && item.channelId === message.channelId)
    const unreadCount = (message.localOnly || message.isEvent) ? 0 : 1

    if (index >= 0) {
      const current = list[index]
      list[index] = { ...current, opened: true, unreadCount: current.unreadCount + unreadCount }
    }
    else {
      list.push({
        type: conversationType,
        opened: true,
        pinned: false,
        platform: message.platform,
        channelId: message.channelId,
        unreadCount,
        mute: false,
      })
    }

    state.conversation.list = list
  }

  async stop() {
    while (this.routeDisposers.length) {
      this.routeDisposers.pop()?.()
    }
    this.logger.info('app server routes removed')
  }
}

export const name = 'app-server'
export default AppServerService
