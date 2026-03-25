import type { WebSocketLayer } from '@cordisjs/plugin-server'
import type Router from '@koa/router'
import type { Context } from 'cordis'
import type { IncomingMessage } from 'node:http'
import type { WebSocket } from 'ws'
import { Link } from '@satoriapp/link'
import '@cordisjs/plugin-server'

const PREFIX = 'satori'
const WS_OPEN = 1

class WebAdapter extends Link.Adapter {
  private readonly handlers = new Map<string, Link.ActionHandler>()
  private readonly subscribers = new Map<string, Set<(data: unknown) => void>>()
  private wsLayer: WebSocketLayer | undefined

  start(): void {
    this.ctx.server.post(`/${PREFIX}/:path+`, async (koaCtx: Router.RouterContext) => {
      const path: string = koaCtx.params.path
      const handler = this.handlers.get(path)
      if (!handler) {
        koaCtx.status = 404
        koaCtx.body = { error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
        return
      }
      try {
        koaCtx.body = await handler(koaCtx.request.body ?? null)
      }
      catch (err) {
        koaCtx.status = 500
        koaCtx.body = { error: { code: 'EINTERNAL', message: err instanceof Error ? err.message : String(err) } }
      }
    })

    this.wsLayer = this.ctx.server.ws(`/${PREFIX}`, (socket: WebSocket, _req: IncomingMessage) => {
      this.ctx.logger('link').info('WebSocket client connected (total: %d)', this.wsLayer?.clients.size)
      socket.on('close', () => this.ctx.logger('link').info('WebSocket client disconnected'))
      socket.on('error', (err: Error) => this.ctx.logger('link').warn('WebSocket client error: %s', err.message))
    })

    this.ctx.logger('link').info('web adapter started')
  }

  handle(path: string, handler: Link.ActionHandler): () => void {
    this.handlers.set(path, handler)
    return () => this.handlers.delete(path)
  }

  async invoke<T>(path: string, payload?: unknown): Promise<Link.Response<T>> {
    const handler = this.handlers.get(path)
    if (!handler)
      return { id: path, error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
    try {
      return { id: path, data: await handler(payload) as T }
    }
    catch (err) {
      return { id: path, error: { code: 'EINTERNAL', message: err instanceof Error ? err.message : String(err) } }
    }
  }

  subscribe<T>(event: string, listener: (data: T) => void): () => void {
    const set = this.subscribers.get(event) ?? new Set()
    set.add(listener as (data: unknown) => void)
    this.subscribers.set(event, set)
    return () => {
      const s = this.subscribers.get(event)
      if (!s)
        return
      s.delete(listener as (data: unknown) => void)
      if (!s.size)
        this.subscribers.delete(event)
    }
  }

  broadcast(event: string, data: unknown): void {
    const set = this.subscribers.get(event)
    if (set?.size) {
      for (const l of set) l(data)
    }
    if (!this.wsLayer?.clients.size)
      return
    const message = JSON.stringify({ event, data })
    for (const client of this.wsLayer.clients) {
      if (client.readyState === WS_OPEN) {
        client.send(message, (err?: Error) => {
          if (err)
            this.ctx.logger('link').warn('WebSocket send failed: %s', err.message)
        })
      }
    }
  }

  dispose(): void {
    this.wsLayer?.close()
    this.wsLayer = undefined
    this.handlers.clear()
    this.subscribers.clear()
  }
}

export class LinkWeb<C extends Context = Context> extends Link<C> {
  static inject: string[] = ['server']

  private readonly web: WebAdapter

  constructor(ctx: C) {
    super(ctx)
    this.web = new WebAdapter(ctx)
    this.setAdapter(this.web)
  }

  async start(): Promise<void> {
    this.web.start()
  }

  async stop(): Promise<void> {
    this.web.dispose()
    await super.stop()
  }
}

export default LinkWeb
