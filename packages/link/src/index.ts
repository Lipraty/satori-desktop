import { Context, Service } from 'cordis'
import type {} from '@cordisjs/plugin-logger'

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
    'link/send': (event: string, data: any) => void
  }
}

export abstract class Link<C extends Context = Context, O extends Link.Config = Link.Config> extends Service<O> {
  static PREFIX = 'sapp'
  static readonly inject = { logger: { required: false } }

  protected eventListeners = new Map<string, Link.Listener<any>[]>()

  constructor(protected ctx: C, public config: O = {} as O) {
    super(ctx, 'link')
  }

  action<T, R>(path: string, handler: Link.ActionHandler<T, R>): () => void
  action<T, R>(path: string, payload?: T): Promise<R>
  action<T, R>(path: string, arg: Link.ActionHandler<T, R> | T) {
    if (typeof arg === 'function') {
      return this.handle<T, R>(path, arg as Link.ActionHandler<T, R>)
    }
    return this.invoke<T, R>(path, arg as T)
  }

  protected get log() {
    return this.ctx.logger('link')
  }

  on<K extends string & keyof Link.Events>(event: K, listener: Link.Events[K]): () => void
  on<T>(event: string, listener: Link.Listener<T>): () => void
  on(event: string, listener: Link.Listener<any>): () => void {
    const list = this.eventListeners.get(event) ?? []
    list.push(listener as Link.Listener<any>)
    this.eventListeners.set(event, list)
    return () => {
      const current = this.eventListeners.get(event) ?? []
      const next = current.filter(l => l !== (listener as Link.Listener<any>))
      if (next.length) {
        this.eventListeners.set(event, next)
      }
      else {
        this.eventListeners.delete(event)
      }
    }
  }

  protected handle<T, R>(_path: string, _handler: Link.ActionHandler<T, R>): () => void {
    return () => {}
  }

  protected async invoke<T, R>(path: string, payload?: T): Promise<R> {
    const res = await this.call<T, R>(path, payload)
    if (res.error) {
      throw new LinkError(res.error.code, res.error.message)
    }
    return res.data as R
  }

  protected abstract call<T, R>(path: string, payload?: T): Promise<Link.Response<R>>
}

export namespace Link {
  export interface Events {}
  export interface Config {}

  export type ActionHandler<T = any, R = any> = (
    payload: T,
  ) => R | Promise<R>

  export type Listener<T> = (data: T) => void

  export type Status = 'connecting' | 'connected' | 'disconnected' | 'error'

  export enum ErrorCode {
    ENOSYS = 'ENOSYS',
    ENOTCONN = 'ENOTCONN',
    ETIMEOUT = 'ETIMEOUT',
    ENOENT = 'ENOENT',
    EIPC = 'EIPC',
    EDISPOSED = 'EDISPOSED',
    EINTERNAL = 'EINTERNAL',
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

  export const ACTION_TIMEOUT_MS = 15_000

  export async function withTimeout<T>(promise: Promise<T>, ms = ACTION_TIMEOUT_MS): Promise<T> {
    let id: ReturnType<typeof setTimeout>
    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          id = setTimeout(
            () => reject(new LinkError(ErrorCode.ETIMEOUT, `request timed out after ${ms}ms`)),
            ms,
          )
        }),
      ])
    }
    finally {
      clearTimeout(id!)
    }
  }
}

export default Link
