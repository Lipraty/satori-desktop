import * as electron from 'electron'
import * as cordis from 'cordis'

export interface Events<C extends Context = Context> extends cordis.Events<C> { }

export interface Context extends cordis.Context {
  [Context.events]: Events<Context>
  $env: Record<string, any>
}

export class Context extends cordis.Context { 
  app: electron.App

  constructor(config?: Context.Config) {
    super(config)
    this.app = electron.app
    this.provide('$env', config?.env ?? {}, true)
    this.plugin(WindowService)
  }
}

export namespace Context {
  export interface Config {
    env?: Record<string, any>
  }
}

export abstract class Service<T = any, C extends Context = Context> extends cordis.Service<T, C> { }

export function emptyObject(obj: any) {
  for (const key in obj) {
    if (obj[key] !== undefined) {
      return false
    }
  }
  return true
}

import WindowService from './window' // fix loading before definition

export type EffectScope<C extends Context = Context> = cordis.EffectScope<C>
export type ForkScope<C extends Context = Context> = cordis.ForkScope<C>
export type MainScope<C extends Context = Context> = cordis.MainScope<C>

export { Logger, Schema, Inject, ScopeStatus } from 'cordis'
export type { Disposable, Plugin } from 'cordis'
export * from './common'
export * from 'cosmokit'
export * from '@satorijs/protocol'
