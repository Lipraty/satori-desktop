import * as electron from 'electron'
import * as cordis from 'cordis'
import * as Package from '../package.json'
import { Events as SharedEvents } from '@satoriapp/common'

import WindowService from './window'
import IpcService from './ipc'
import * as EventBridge from './eventBridge'

export const APP_NAME = 'Satori App for Desktop'
export const APP_VERSION = Package.version
export const APP_ID = 'com.satoriapp.desktop'

export interface Events<C extends Context = Context> extends SharedEvents<C> { }

export interface Context extends cordis.Context {
  [Context.events]: Events<Context>
  $env: Record<string, any>
}

export class Context extends cordis.Context { 
  app: electron.App

  constructor(config?: Context.Config) {
    super(config)
    this.app = electron.app
    this.provide('$env', Object.assign({
      APP_NAME,
      APP_VERSION,
      APP_ID
    }, config.env || {}), true)
    this.plugin(WindowService)
    this.plugin(IpcService)
    this.plugin(EventBridge)
  }
}

export namespace Context {
  export interface Config {
    env?: Record<string, any>
  }
}

export abstract class Service<T = any, C extends Context = Context> extends cordis.Service<T, C> { }
export type EffectScope<C extends Context = Context> = cordis.EffectScope<C>
export type ForkScope<C extends Context = Context> = cordis.ForkScope<C>
export type MainScope<C extends Context = Context> = cordis.MainScope<C>

export { Logger, Schema, Inject, ScopeStatus } from 'cordis'
export type { Disposable, Plugin } from 'cordis'
export * from '@satorijs/protocol'
export * from '@satoriapp/common'
