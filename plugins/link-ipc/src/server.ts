import type { Context } from 'cordis'
import type { IpcMainInvokeEvent, WebContents } from 'electron'
import { Link } from '@satoriapp/link'
import { ipcMain, webContents } from 'electron'

const PREFIX = 'satori'

function toChannel(path: string): string {
  const normalized = (path ?? '').trim().replace(/^\/+/, '').replace(new RegExp(`^${PREFIX}:`), '')
  return `${PREFIX}:${normalized || 'ping'}`
}

class IpcAdapter extends Link.Adapter {
  private readonly handlers = new Map<string, Link.ActionHandler>()
  private readonly subscribers = new Map<string, Set<(data: unknown) => void>>()
  private bound = false

  start(): void {
    if (this.bound)
      return
    for (const path of this.handlers.keys()) this._bindHandler(path)
    this.bound = true
    this.ctx.logger('link').info('IPC adapter started (%d handlers)', this.handlers.size)
  }

  stop(): void {
    if (!this.bound)
      return
    for (const path of this.handlers.keys()) ipcMain.removeHandler(toChannel(path))
    this.bound = false
  }

  handle(path: string, handler: Link.ActionHandler): () => void {
    this.handlers.set(path, handler)
    if (this.bound)
      this._bindHandler(path)
    return () => {
      this.handlers.delete(path)
      if (this.bound)
        ipcMain.removeHandler(toChannel(path))
    }
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
    const ch = toChannel(event)
    for (const wc of webContents.getAllWebContents()) this._trySend(wc, ch, data)
  }

  dispose(): void {
    this.stop()
    this.handlers.clear()
    this.subscribers.clear()
  }

  private _bindHandler(path: string): void {
    const ch = toChannel(path)
    ipcMain.removeHandler(ch)
    ipcMain.handle(ch, async (_event: IpcMainInvokeEvent, payload: unknown) => {
      this.ctx.logger('link').info('← %s (frame %d)', path, _event.frameId)
      const handler = this.handlers.get(path)
      if (!handler)
        return { error: { code: Link.ErrorCode.ENOENT, message: `action not registered: ${path}` } }
      try {
        const result = await handler(payload)
        this.ctx.logger('link').info('→ %s ok', path)
        return result
      }
      catch (err) {
        this.ctx.logger('link').warn('→ %s error: %s', path, err instanceof Error ? err.message : String(err))
        return { error: { code: 'EINTERNAL', message: err instanceof Error ? err.message : String(err) } }
      }
    })
  }

  private _trySend(wc: WebContents, ch: string, data: unknown): void {
    try {
      if (!wc.isDestroyed())
        wc.send(ch, data)
    }
    catch (err) {
      this.ctx.logger('link').warn('broadcast %s failed: %s', ch, err instanceof Error ? err.message : String(err))
    }
  }
}

export class LinkIpc<C extends Context = Context> extends Link<C> {
  static inject: string[] = []

  private readonly ipc: IpcAdapter

  constructor(ctx: C) {
    super(ctx)
    this.ipc = new IpcAdapter(ctx)
    this.setAdapter(this.ipc)
  }

  async start(): Promise<void> {
    this.ipc.start()
  }

  async stop(): Promise<void> {
    this.ipc.dispose()
    await super.stop()
  }
}

export default LinkIpc
