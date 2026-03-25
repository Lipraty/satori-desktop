import type { Context } from 'cordis'
import { Link, LinkError } from '@satoriapp/link'

interface IpcRendererBridge {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, listener: (...args: unknown[]) => void) => void
  removeListener: (channel: string, listener: (...args: unknown[]) => void) => void
}

const PREFIX = 'satori'

function toChannel(path: string): string {
  const normalized = (path ?? '').trim().replace(/^\/+/, '').replace(new RegExp(`^${PREFIX}:`), '')
  return `${PREFIX}:${normalized || 'ping'}`
}

export class IpcClientAdapter extends Link.Adapter {
  // Single ipcRenderer.on per channel; fan-out to multiple user listeners.
  private readonly boundListeners = new Map<string, (...args: unknown[]) => void>()
  private readonly eventListeners = new Map<string, ((data: unknown) => void)[]>()

  constructor(ctx: Context) {
    super(ctx)
  }

  private get bridge(): IpcRendererBridge | undefined {
    const g = globalThis as Record<string, unknown>
    const electron = g.electron as Record<string, unknown> | undefined
    if (!electron)
      return undefined
    return (electron.ipcRenderer ?? electron) as IpcRendererBridge
  }

  handle(_path: string, _handler: Link.ActionHandler): () => void {
    this.ctx.logger('link').warn('IpcClientAdapter.handle(): server-side only — ignored')
    return () => {}
  }

  async invoke<T>(path: string, payload?: unknown): Promise<Link.Response<T>> {
    const bridge = this.bridge
    if (!bridge?.invoke) {
      this.ctx.logger('link').warn('invoke %s: ipcRenderer not available', path)
      return {
        id: path,
        error: { code: Link.ErrorCode.ENOSYS, message: 'ipcRenderer.invoke not available' },
      }
    }

    const ch = toChannel(path)
    // Strip Vue/Proxy wrappers — ipcRenderer uses structured clone which rejects Proxy objects
    const raw = payload !== undefined ? JSON.parse(JSON.stringify(payload)) : undefined
    this.ctx.logger('link').debug('→ %s', ch)
    try {
      const result = await Link.withTimeout(bridge.invoke(ch, raw))
      this.ctx.logger('link').debug('← %s ok', ch)
      return { id: path, data: result as T }
    }
    catch (err) {
      this.ctx.logger('link').warn('← %s error: %s', ch, err instanceof Error ? err.message : String(err))
      if (err instanceof LinkError)
        return { id: path, error: { code: err.code, message: err.message } }
      const code = (err as Record<string, unknown>)?.code ?? Link.ErrorCode.EIPC
      const message = err instanceof Error ? err.message : String(err)
      return { id: path, error: { code: code as string, message } }
    }
  }

  subscribe<T>(event: string, listener: (data: T) => void): () => void {
    const bridge = this.bridge
    const ch = toChannel(event)

    if (!this.boundListeners.has(event)) {
      const wrapped = (_ev: unknown, data: unknown) => {
        this.ctx.logger('link').debug('← event %s', ch)
        for (const l of this.eventListeners.get(event) ?? []) l(data)
      }
      this.boundListeners.set(event, wrapped)
      bridge?.on(ch, wrapped)
      this.ctx.logger('link').debug('subscribe %s', ch)
    }

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
        const bound = this.boundListeners.get(event)
        if (bound) {
          bridge?.removeListener(ch, bound)
          this.boundListeners.delete(event)
        }
      }
    }
  }

  broadcast(_event: string, _data: unknown): void {
    this.ctx.logger('link').warn('IpcClientAdapter.broadcast(): server-side only — ignored')
  }

  dispose(): void {
    const bridge = this.bridge
    for (const [event, wrapped] of this.boundListeners.entries()) {
      bridge?.removeListener(toChannel(event), wrapped)
    }
    this.boundListeners.clear()
    this.eventListeners.clear()
  }
}
