import * as electron from 'electron'
import * as cordis from 'cordis'
import * as Package from '../package.json'

export interface Events<C extends Context = Context> extends cordis.Events<C> { }

export interface Context extends cordis.Context {
  [Context.events]: Events<Context>
}

export class Context extends cordis.Context { 
  app: electron.App

  constructor(config = {}) {
    super(config)
    this.app = electron.app
    this.plugin(WindowService)
  }
}

export namespace Context { }

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
export const APP_NAME = 'Satori App for Desktop'
export const APP_VERSION = Package.version
export const APP_ID = 'com.satoriapp.desktop'
export { Logger, Schema, Inject, ScopeStatus } from 'cordis'
export type { Disposable, Plugin } from 'cordis'
export * from 'cosmokit'
export * from '@satorijs/protocol'
