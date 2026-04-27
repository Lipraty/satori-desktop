import type { Context } from 'cordis'
import type { IpcMainInvokeEvent, WebContents } from 'electron'
import { Link } from '@satoriapp/link'
import { ipcMain, webContents } from 'electron'

export class LinkIpc<C extends Context = Context> extends Link<C> {
  private readonly handlers = new Map<string, Link.ActionHandler>()
  private bound = false

  private toChannel(path: string) {
    const normalized = (path ?? '').trim().replace(/^\/+/, '').replace(new RegExp(`^${Link.PREFIX}:`), '')
    return `${Link.PREFIX}:${normalized || 'ping'}`
  }

  async start() {
    if (this.bound)
      return
    for (const path of this.handlers.keys()) this.bindIpc(path)

    this.ctx.on('link/send', (event, data) => {
      for (const l of this.eventListeners.get(event) ?? []) l(data)
      const channel = this.toChannel(event)
      for (const content of webContents.getAllWebContents()) this.trySend(content, channel, data)
    })

    this.bound = true
    this.log.info('IPC link started (%d handlers)', this.handlers.size)
  }

  async stop() {
    if (this.bound) {
      for (const path of this.handlers.keys()) ipcMain.removeHandler(this.toChannel(path))
      this.bound = false
    }
    this.handlers.clear()
    this.eventListeners.clear()
  }

  protected handle<T, R>(path: string, handler: Link.ActionHandler<T, R>) {
    this.handlers.set(path, handler)
    if (this.bound)
      this.bindIpc(path)
    return () => {
      this.handlers.delete(path)
      if (this.bound)
        ipcMain.removeHandler(this.toChannel(path))
    }
  }

  protected async call<T, R>(path: string, payload?: T): Promise<Link.Response<R>> {
    const handler = this.handlers.get(path)
    if (!handler)
      return { id: path, error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
    try {
      return { id: path, data: await handler(payload) }
    }
    catch (err) {
      return { id: path, error: { code: Link.ErrorCode.EINTERNAL, message: err instanceof Error ? err.message : String(err) } }
    }
  }

  private bindIpc(path: string) {
    const channel = this.toChannel(path)
    ipcMain.removeHandler(channel)
    ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, payload: any) => {
      this.log.info('← %s (frame %d)', path, _event.frameId)
      const handler = this.handlers.get(path)
      if (!handler)
        return { error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
      try {
        const result = await handler(payload)
        this.log.info('→ %s success', path)
        return { data: result }
      }
      catch (err) {
        this.log.warn('→ %s error: %s', path, err instanceof Error ? err.message : String(err))
        return { error: { code: Link.ErrorCode.EINTERNAL, message: err instanceof Error ? err.message : String(err) } }
      }
    })
  }

  private trySend(wc: WebContents, ch: string, data: any) {
    try {
      if (!wc.isDestroyed())
        wc.send(ch, data)
    }
    catch (err) {
      this.log.warn('broadcast %s failed: %s', ch, err instanceof Error ? err.message : String(err))
    }
  }
}

export default LinkIpc
