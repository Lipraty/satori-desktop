import type { Context } from 'cordis'
import { Link, LinkError } from '@satoriapp/link'

const MAX_RETRIES = 5
const BASE_RETRY_DELAY_MS = 1_000

interface PushEnvelope {
  event: string
  data: unknown
}

export class WsClientAdapter extends Link.Adapter {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private disposed = false
  private retryCount = 0
  private readonly eventListeners = new Map<string, ((data: unknown) => void)[]>()

  constructor(ctx: Context, private readonly baseUrl: string) {
    super(ctx)
    this.connect()
  }

  handle(_path: string, _handler: Link.ActionHandler): () => void {
    this.ctx.logger('link').warn('WsClientAdapter.handle(): server-side only — ignored')
    return () => {}
  }

  async invoke<T>(path: string, payload?: unknown): Promise<Link.Response<T>> {
    const url = `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    try {
      const res = await Link.withTimeout(fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? null),
      }))
      const data = await res.json() as T
      if (!res.ok)
        return { id: path, error: { code: String(res.status), message: res.statusText } }
      return { id: path, data }
    }
    catch (err) {
      if (err instanceof LinkError)
        return { id: path, error: { code: err.code, message: err.message } }
      const code = (err as Record<string, unknown>)?.code ?? Link.ErrorCode.ENOTCONN
      return { id: path, error: { code: code as string, message: err instanceof Error ? err.message : String(err) } }
    }
  }

  subscribe<T>(event: string, listener: (data: T) => void): () => void {
    const list = this.eventListeners.get(event) ?? []
    list.push(listener as (data: unknown) => void)
    this.eventListeners.set(event, list)

    return () => {
      const current = this.eventListeners.get(event) ?? []
      const next = current.filter(l => l !== (listener as (data: unknown) => void))
      if (next.length) {
        this.eventListeners.set(event, next)
      }
      else {
        this.eventListeners.delete(event)
      }
    }
  }

  broadcast(_event: string, _data: unknown): void {
    this.ctx.logger('link').warn('WsClientAdapter.broadcast(): server-side only — ignored')
  }

  dispose(): void {
    this.disposed = true
    clearTimeout(this.reconnectTimer)
    this.eventListeners.clear()
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  private connect(): void {
    if (this.disposed)
      return

    this.ctx.emit('link/status', 'connecting')
    const wsUrl = this.baseUrl.replace(/^https?:\/\//, m => m.startsWith('https') ? 'wss://' : 'ws://')
    const ws = new WebSocket(wsUrl)
    this.ws = ws

    ws.onopen = () => {
      this.retryCount = 0
      this.ctx.emit('link/status', 'connected')
    }

    ws.onclose = () => {
      this.ctx.emit('link/status', 'disconnected')
      if (!this.disposed)
        this.scheduleReconnect()
    }

    ws.onerror = () => {
      this.ctx.logger('link').warn('WebSocket error')
    }

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as PushEnvelope
        for (const l of this.eventListeners.get(msg.event) ?? []) l(msg.data)
      }
      catch {
        this.ctx.logger('link').warn('WebSocket: failed to parse message')
      }
    }
  }

  private scheduleReconnect(): void {
    this.retryCount++
    if (this.retryCount > MAX_RETRIES) {
      this.ctx.emit('link/status', 'error')
      this.ctx.logger('link').error('WebSocket: max retries (%d) reached', MAX_RETRIES)
      return
    }
    const delay = BASE_RETRY_DELAY_MS * 2 ** (this.retryCount - 1)
    this.ctx.logger('link').warn('WebSocket: reconnecting in %dms (attempt %d/%d)', delay, this.retryCount, MAX_RETRIES)
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }
}
