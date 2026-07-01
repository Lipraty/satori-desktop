import type { Context } from 'cordis'
import { Link, LinkError } from '@satoriapp/link'
import { Service } from 'cordis'

interface IpcRendererBridge {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
  on: (channel: string, listener: (...args: unknown[]) => void) => void
  removeListener: (channel: string, listener: (...args: unknown[]) => void) => void
}

export class LinkIpcClient<C extends Context = Context> extends Link<C> {
  private readonly boundListeners = new Map<string, (...args: unknown[]) => void>()

  private toChannel(path: string) {
    const normalized = (path ?? '').trim().replace(/^\/+/, '').replace(new RegExp(`^${Link.PREFIX}:`), '')
    return `${Link.PREFIX}:${normalized || 'ping'}`
  }

  private get bridge(): IpcRendererBridge | undefined {
    const g = globalThis as Record<string, unknown>
    const electron = g.electron as Record<string, unknown> | undefined
    if (!electron)
      return undefined
    return (electron.ipcRenderer ?? electron) as IpcRendererBridge
  }

  on<T = any>(event: string, listener: Link.Listener<T>) {
    const bridge = this.bridge
    const channel = this.toChannel(event)

    if (!this.boundListeners.has(event)) {
      const wrapped = (_ev: unknown, data: unknown) => {
        this.log.debug('← event %s', channel)
        for (const l of this.eventListeners.get(event) ?? []) l(data)
      }
      this.boundListeners.set(event, wrapped)
      bridge?.on(channel, wrapped)
      this.log.debug('subscribe %s', channel)
    }

    const dispose = super.on(event, listener)

    return () => {
      dispose()
      if (!this.eventListeners.has(event)) {
        const bound = this.boundListeners.get(event)
        if (bound) {
          this.bridge?.removeListener(channel, bound)
          this.boundListeners.delete(event)
        }
      }
    }
  }

  async* [Service.init]() {
    yield () => {
      const bridge = this.bridge
      for (const [event, wrapped] of this.boundListeners.entries()) {
        bridge?.removeListener(this.toChannel(event), wrapped)
      }
      this.boundListeners.clear()
      this.eventListeners.clear()
    }
  }

  protected async call<T, R>(path: string, payload?: T): Promise<Link.Response<R>> {
    const bridge = this.bridge
    if (!bridge?.invoke) {
      this.log.warn('invoke %s: ipcRenderer not available', path)
      return {
        id: path,
        error: { code: Link.ErrorCode.ENOSYS, message: 'ipcRenderer.invoke not available' },
      }
    }

    const channel = this.toChannel(path)
    const raw = payload !== undefined ? JSON.parse(JSON.stringify(payload)) : undefined
    this.log.debug('→ %s', channel)
    try {
      const result = await Link.withTimeout(bridge.invoke(channel, raw)) as Link.Response<R>
      this.log.debug('← %s success', channel)
      return { ...result, id: path }
    }
    catch (err) {
      this.log.warn('← %s error: %s', channel, err instanceof Error ? err.message : String(err))
      if (err instanceof LinkError)
        return { id: path, error: { code: err.code, message: err.message } }
      const code = (err as Record<string, unknown>)?.code ?? Link.ErrorCode.EIPC
      const message = err instanceof Error ? err.message : String(err)
      return { id: path, error: { code: code as string, message } }
    }
  }
}
