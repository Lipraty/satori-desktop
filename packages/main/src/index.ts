import * as electron from 'electron'
import * as cordis from 'cordis'
import * as Package from '../package.json'

export interface Events<C extends Context = Context> extends cordis.Events<C> {
  'main/window-created': (name: string, window: electron.BrowserWindow) => void
  'main/window-closed': (name: string) => void
}

export interface Context extends cordis.Context {
  [Context.events]: Events<Context>
}

export class Context extends cordis.Context {
  app: electron.App

  private windows: Map<string, electron.BrowserWindow> = new Map()

  constructor() {
    super()
    this.app = electron.app
  }

  createWindow(name: string, options: electron.BrowserWindowConstructorOptions) {
    if (this.windows.has(name)) {
      return this.windows.get(name)
    }
    const window = new electron.BrowserWindow(options)
    // this.emit('main/window-created', name, window)
    this.windows.set(name, window)
    window.on('close', () => {
      this.windows.delete(name)
    })
    return window
  }
}

export namespace Context { }

export abstract class Service<C extends Context = Context> extends cordis.Service<C> { }

export function emptyObject(obj: any) {
  for (const key in obj) {
    if (obj[key] !== undefined) {
      return false
    }
  }
  return true
}

export type EffectScope = cordis.EffectScope<Context>
export type ForkScope = cordis.ForkScope<Context>
export type MainScope = cordis.MainScope<Context>
export const APP_NAME = 'Satori App for Desktop'
export const APP_VERSION = Package.version
export const APP_ID = 'com.satoriapp.desktop'
export { Logger, Schema, Inject, ScopeStatus } from 'cordis'
export type { Disposable, Plugin } from 'cordis'
export * from 'cosmokit'
export * from '@satorijs/protocol'
