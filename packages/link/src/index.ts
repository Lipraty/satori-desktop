import { Context, Service } from 'cordis'

export class LinkError extends Error {
  constructor(
    public readonly code: Link.ErrorCode | string | undefined,
    message: string,
  ) {
    super(message)
    this.name = 'LinkError'
  }
}

declare module 'cordis' {
  interface Context {
    link: Link
  }
  interface Events {
    'link/status': (status: Link.Status) => void
  }
}

export class Link<C extends Context = Context, O extends Link.Config = Link.Config> extends Service<O, C> {
  static inject: string[] = []

  private _adapter: Link.Adapter | undefined

  constructor(protected ctx: C, public config: O = {} as O) {
    super(ctx, 'link', true)
  }

  get adapter(): Link.Adapter | undefined {
    return this._adapter
  }

  setAdapter(adapter: Link.Adapter): void {
    this._adapter?.dispose()
    this._adapter = adapter
  }

  action<TPayload, TResult>(path: string, handler: (payload: TPayload) => TResult | Promise<TResult>): () => void
  action<TResult = unknown>(path: string, payload?: unknown): Promise<TResult>
  action(path: string, second?: unknown): unknown {
    if (typeof second === 'function') {
      if (!this._adapter) {
        this.ctx.logger('link').warn('action(%s): no adapter — handler dropped', path)
        return () => {}
      }
      return this._adapter.handle(path, second as Link.ActionHandler)
    }
    return this._invoke(path, second)
  }

  on<T = unknown>(event: string, listener: (data: T) => void): () => void {
    if (!this._adapter) {
      throw new LinkError(Link.ErrorCode.ENOSYS, 'ctx.link: no adapter configured')
    }
    return this._adapter.subscribe(event, listener)
  }

  send(event: string, data: unknown): void {
    if (!this._adapter) {
      throw new LinkError(Link.ErrorCode.ENOSYS, 'ctx.link: no adapter configured')
    }
    this._adapter.broadcast(event, data)
  }

  async stop(): Promise<void> {
    this._adapter?.dispose()
    this._adapter = undefined
  }

  private async _invoke<T>(path: string, payload?: unknown): Promise<T> {
    if (!this._adapter) {
      throw new LinkError(Link.ErrorCode.ENOSYS, 'ctx.link: no adapter configured')
    }
    const res = await this._adapter.invoke<T>(path, payload)
    if (res.error) {
      throw new LinkError(res.error.code, res.error.message)
    }
    return res.data as T
  }
}

export namespace Link {
  export interface Config {}

  export type ActionHandler<TPayload = unknown, TResult = unknown> = (
    payload: TPayload,
  ) => TResult | Promise<TResult>

  export type Status = 'connecting' | 'connected' | 'disconnected' | 'error'

  export enum ErrorCode {
    ENOSYS = 'ENOSYS',
    ENOTCONN = 'ENOTCONN',
    ETIMEOUT = 'ETIMEOUT',
    ENOENT = 'ENOENT',
    EIPC = 'EIPC',
    EDISPOSED = 'EDISPOSED',
  }

  export interface Error {
    code?: ErrorCode | string
    message: string
  }

  export interface Response<T> {
    id: string
    data?: T
    error?: Error
  }

  export abstract class Adapter {
    constructor(protected readonly ctx: Context) {}

    abstract handle(path: string, handler: ActionHandler): () => void
    abstract invoke<T>(path: string, payload?: unknown): Promise<Response<T>>
    abstract subscribe<T>(event: string, listener: (data: T) => void): () => void
    abstract broadcast(event: string, data: unknown): void
    dispose(): void {}
  }

  export const ACTION_TIMEOUT_MS = 15_000

  export function withTimeout<T>(promise: Promise<T>, ms = ACTION_TIMEOUT_MS): Promise<T> {
    let id: ReturnType<typeof setTimeout>
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        id = setTimeout(
          () => reject(new LinkError(ErrorCode.ETIMEOUT, `request timed out after ${ms}ms`)),
          ms,
        )
      }),
    ]).finally(() => clearTimeout(id))
  }
}

export default Link
