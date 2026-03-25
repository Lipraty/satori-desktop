import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import { Service } from 'cordis'

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
  listByChannel: (platform: string, channelId: string, limit?: number) => AppMessage[]
  listSpans: (platform: string, channelId: string) => SpanSummary[]
  markDead: (seq: bigint, dead?: boolean) => boolean
  getMetrics: () => Record<string, number>
  recoverChannel: (platform: string, channelId: string, limit?: number) => Promise<number>
}

declare module 'cordis' {
  interface Context {
    appServer: AppServerService
  }
}

export class AppServerService extends Service {
  static readonly inject = ['link', 'appMessage']

  private readonly routeDisposers: Array<() => void> = []

  constructor(ctx: Context) {
    super(ctx, 'appServer', true)
  }

  private serializeMsg(msg: AppMessage): Record<string, unknown> {
    return { ...msg, seq: msg.seq.toString() }
  }

  private get appMessage(): AppMessageContract {
    return (this.ctx as any).appMessage as AppMessageContract
  }

  async start() {
    const link = (this.ctx as any).link

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
        return { error: { code: 'EBADREQ', message: 'message.create requires platform and channelId' } }
      }
      return {
        message: this.serializeMsg(await this.appMessage.create({
          ...payload,
          platform: payload.platform,
          channelId: payload.channelId,
        })),
        updatedAt: Date.now(),
      }
    }))

    this.routeDisposers.push(link.action('message.list', (payload: {
      platform?: string
      channelId?: string
      limit?: number
    } = {}) => {
      if (!payload.platform || !payload.channelId) {
        return { error: { code: 'EBADREQ', message: 'message.list requires platform and channelId' } }
      }
      const limit = Math.max(1, Math.min(500, Number(payload.limit || 50)))
      return {
        list: this.appMessage.listByChannel(payload.platform, payload.channelId, limit).map(m => this.serializeMsg(m)),
        updatedAt: Date.now(),
      }
    }))

    this.routeDisposers.push(link.action('message.dead', (payload: {
      seq?: string | number | bigint
      dead?: boolean
    } = {}) => {
      if (payload.seq == null) {
        return { error: { code: 'EBADREQ', message: 'message.dead requires seq' } }
      }
      let seq: bigint
      try {
        seq = typeof payload.seq === 'bigint' ? payload.seq : BigInt(payload.seq)
      }
      catch {
        return { error: { code: 'EBADREQ', message: 'message.dead seq must be bigint-compatible' } }
      }
      return { ok: this.appMessage.markDead(seq, payload.dead ?? true), updatedAt: Date.now() }
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
        return { error: { code: 'EBADREQ', message: 'message.recover requires platform and channelId' } }
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
        return { error: { code: 'EBADREQ', message: 'platform and channelId required' } }
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

    this.logger.info('app server routes registered (%d routes)', this.routeDisposers.length)
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
