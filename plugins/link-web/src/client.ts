import type { Context } from 'cordis'
import { Link, LinkError } from '@satoriapp/link'

const MAX_RETRIES = 5
const BASE_RETRY_DELAY_MS = 1_000

interface PushEnvelope {
  event: string
  data: unknown
}

export interface LinkWsClientConfig extends Link.Config {
  baseUrl: string
}

export class LinkWsClient<C extends Context = Context> extends Link<C, LinkWsClientConfig> {
  private ws: WebSocket | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private retryCount = 0

  async start() {
    this.connect()
  }

  async stop() {
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = undefined
    this.eventListeners.clear()
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  protected async call<T, R>(path: string, payload?: T): Promise<Link.Response<R>> {
    const url = `${this.config.baseUrl.replace(/\/$/, '')}/${Link.PREFIX}/${path.replace(/^\//, '')}`
    try {
      const res = await Link.withTimeout(fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload ?? null),
      }))
      if (!res.ok)
        return { id: path, error: { code: String(res.status), message: res.statusText } }
      const data = await res.json() as R
      return { id: path, data }
    }
    catch (err) {
      if (err instanceof LinkError)
        return { id: path, error: { code: err.code, message: err.message } }
      const code = (err as Record<string, unknown>)?.code ?? Link.ErrorCode.ENOTCONN
      return { id: path, error: { code: code as string, message: err instanceof Error ? err.message : String(err) } }
    }
  }

  private connect() {
    if (this.ws)
      return

    this.ctx.emit('link/status', 'connecting')
    const wsUrl = this.config.baseUrl.replace(/^https?:\/\//, m => m.startsWith('https') ? 'wss://' : 'ws://')
    const ws = new WebSocket(wsUrl)
    this.ws = ws

    ws.onopen = () => {
      this.retryCount = 0
      this.ctx.emit('link/status', 'connected')
    }

    ws.onclose = () => {
      this.ws = null
      this.ctx.emit('link/status', 'disconnected')
      this.scheduleReconnect()
    }

    ws.onerror = () => {
      this.log.warn('WebSocket error')
    }

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as PushEnvelope
        for (const l of this.eventListeners.get(msg.event) ?? []) l(msg.data)
      }
      catch {
        this.log.warn('WebSocket: failed to parse message')
      }
    }
  }

  private scheduleReconnect() {
    this.retryCount++
    if (this.retryCount > MAX_RETRIES) {
      this.ctx.emit('link/status', 'error')
      this.log.error('WebSocket: max retries (%d) reached', MAX_RETRIES)
      return
    }
    const delay = BASE_RETRY_DELAY_MS * 2 ** (this.retryCount - 1)
    this.log.warn('WebSocket: reconnecting in %dms (attempt %d/%d)', delay, this.retryCount, MAX_RETRIES)
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }
}
