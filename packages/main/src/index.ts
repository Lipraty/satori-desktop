import * as electron from 'electron'
import * as cordis from 'cordis'
import * as Package from '../package.json'

export interface Events<C extends Context = Context> extends cordis.Events<C> { }

export interface Context extends cordis.Context {
  [Context.events]: Events<Context>
  window: WindowService
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

class WindowService extends Service {
  static readonly inject = ['app']
  static readonly name = 'window'
  static Config: cordis.Schema<WindowService.Config> = cordis.Schema.object({
    theme: cordis.Schema.union(['dark', 'light', 'system']).default('system'),
    width: cordis.Schema.number().step(1).default(1076),
    height: cordis.Schema.number().step(1).default(653),
  })

  private mainWindow: electron.BrowserWindow | null = null
  private subWindow: Map<string, electron.BrowserWindow> = new Map()

  get isDarkTheme() {
    return this.config.theme === 'dark' || (this.config.theme === 'system' && electron.nativeTheme.shouldUseDarkColors)
  }

  constructor(ctx: Context, public config: WindowService.Config) {
    super(ctx, 'window')
    ctx.app.on('activate', () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        this.start()
      }
    })
  }

  async start() {
    await this.ctx.app.whenReady()
    this.mainWindow ??= this.createWindow('main', {
      width: this.config.width,
      height: this.config.height,
      minWidth: 1076,
      minHeight: 653,
      titleBarOverlay: {
        symbolColor: this.isDarkTheme ? '#ffffff' : '#000000',
        color: '#00000000',
        height: 44,
      },
      backgroundMaterial: 'mica',
      vibrancy: 'titlebar',
      backgroundColor: '#00000000',
      title: APP_NAME,
      webPreferences: {
        preload: './preload.js',
      },
    })
  }

  createWindow(name: string, options: electron.BrowserWindowConstructorOptions) {
    if (this.subWindow.has(name)) {
      return this.subWindow.get(name)
    }
    const window = new electron.BrowserWindow(options)
    this.subWindow.set(name, window)
    window.on('close', () => {
      this.subWindow.delete(name)
    })
    return window
  }
}

namespace WindowService {
  export interface Config {
    theme: 'dark' | 'light' | 'system'
    width: number
    height: number
  }
}

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
