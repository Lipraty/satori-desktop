import type { WebSocketLayer } from '@cordisjs/plugin-server'
import type Router from '@koa/router'
import type { Context } from 'cordis'
import type { IncomingMessage } from 'node:http'
import { WebSocket } from 'ws'
import { Link } from '@satoriapp/link'
import '@cordisjs/plugin-server'

export class LinkWeb<C extends Context = Context> extends Link<C> {
  static inject = ['server']

  private readonly handlers = new Map<string, Link.ActionHandler>()
  private ws?: WebSocketLayer

  async start() {
    this.ctx.server.post(`/${Link.PREFIX}/:path+`, async (ktx: Router.RouterContext) => {
      const path: string = ktx.params.path
      const handler = this.handlers.get(path)
      if (!handler) {
        ktx.status = 404
        ktx.body = { error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
        return
      }
      try {
        ktx.body = await handler(ktx.request.body ?? null)
      }
      catch (err) {
        ktx.status = 500
        ktx.body = { error: { code: Link.ErrorCode.EINTERNAL, message: err instanceof Error ? err.message : String(err) } }
      }
    })

    this.ws = this.ctx.server.ws(`/${Link.PREFIX}`, (socket: WebSocket, _req: IncomingMessage) => {
      this.log.info('WebSocket client connected (total: %d)', this.ws.clients.size)
      socket.on('close', () => this.log.info('WebSocket client disconnected'))
      socket.on('error', (err: Error) => this.log.warn('WebSocket client error: %s', err.message))
    })

    this.ctx.on('link/send', (event, data) => {
      for (const l of this.eventListeners.get(event) ?? []) l(data)
      if (!this.ws?.clients.size)
        return
      const message = JSON.stringify({ event, data })
      for (const client of this.ws.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message, (err?: Error) => {
            if (err)
              this.log.warn('WebSocket send failed: %s', err.message)
          })
        }
      }
    })

    this.log.info('web adapter started')
  }

  async stop() {
    this.ws?.close()
    this.ws = undefined
    this.handlers.clear()
    this.eventListeners.clear()
  }

  protected handle<T, R>(path: string, handler: Link.ActionHandler<T, R>) {
    this.handlers.set(path, handler)
    return () => this.handlers.delete(path)
  }

  protected async call<T, R>(path: string, payload?: T): Promise<Link.Response<R>> {
    const handler = this.handlers.get(path)
    if (!handler)
      return { id: path, error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
    try {
      return { id: path, data: await handler(payload) as R }
    }
    catch (err) {
      return { id: path, error: { code: Link.ErrorCode.EINTERNAL, message: err instanceof Error ? err.message : String(err) } }
    }
  }
}

export default LinkWeb
