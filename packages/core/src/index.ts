import * as cordis from 'cordis'

export type Keys<T> = T extends Record<string, any> ? keyof T : never
export type Values<T> = T extends Record<string, any> ? T[keyof T] : never

export interface Events<C extends Context = Context> extends cordis.Events<C> { }

export interface Context extends cordis.Context {
  [Context.events]: Events<this>
}

export namespace Context {
  export interface Config { }
}

export class Context extends cordis.Context {
  constructor() {
    super()
  }
}

export abstract class Service<T = any, C extends Context = Context> extends cordis.Service<T, C> { }

export * from 'cordis'
export * from 'cosmokit'
export * from '@satorijs/protocol'
