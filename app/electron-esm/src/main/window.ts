import type { Context } from 'cordis'
import type { Mutation } from '@cordisjs/muon'
import process from 'node:process'
import { Service } from 'cordis'

import * as electron from 'electron'

import { WindowConfigSchema, WindowServiceConfig } from './config'

const APP_NAME = 'Satori App for Desktop'

declare module 'cordis' {
  interface Events {
    'internal/window': (type: 'create' | 'close', name: string, window?: electron.BrowserWindow) => void
  }
  interface Context {
    window: WindowService
    app: electron.App
    env: { [key: string]: string }
  }
}

class WindowService extends Service {
  static readonly inject = {
    app: { required: true },
    logger: { required: true },
    env: { required: true },
    stater: { required: false },
  }

  static readonly name = 'window'
  static Config = WindowConfigSchema

  private mainWindow: electron.BrowserWindow | null = null
  private subWindow: Map<string, electron.BrowserWindow> = new Map()

  get themeMode(): 'dark' | 'light' {
    const stateTheme = this.ctx.stater?.data?.app?.theme
    if (stateTheme === 'dark' || stateTheme === 'light')
      return stateTheme
    if (this.config.theme === 'dark')
      return 'dark'
    if (this.config.theme === 'light')
      return 'light'
    return electron.nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }

  get isDarkTheme() {
    return this.themeMode === 'dark'
  }

  constructor(public ctx: Context, public config: WindowService.Config) {
    super(ctx, 'window')
  }

  async* [Service.init]() {
    await this.ctx.app.whenReady()
    this.applyNativeTheme()
    this.createMainWindow()

    const onActivate = () => {
      if (electron.BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow()
      }
    }
    this.ctx.app.on('activate', onActivate)

    const offStateChanged = this.ctx.on('state/changed', (mutation: Mutation) => {
      const path = mutation.path.map(s => String(s))
      if (path[0] === 'app' && (path[1] === 'theme' || path.length === 1)) {
        this.applyNativeTheme()
        this.applyWindowChrome()
      }
    })

    yield () => {
      offStateChanged()
      this.ctx.app.off('activate', onActivate)
      for (const win of [this.mainWindow, ...this.subWindow.values()]) {
        if (win && !win.isDestroyed())
          win.destroy()
      }
      this.mainWindow = null
      this.subWindow.clear()
    }
  }

  private applyNativeTheme() {
    electron.nativeTheme.themeSource = this.themeMode
  }

  private applyWindowChrome() {
    const symbolColor = this.isDarkTheme ? '#ffffff' : '#000000'
    for (const win of [this.mainWindow, ...this.subWindow.values()]) {
      if (!win || win.isDestroyed())
        continue
      try {
        win.setTitleBarOverlay({ symbolColor, color: '#00000000', height: 44 })
      }
      catch {}
    }
  }

  private createMainWindow() {
    if (this.mainWindow?.isDestroyed())
      this.mainWindow = null
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
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 15, y: 14 },
      ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
      backgroundMaterial: 'mica',
      vibrancy: 'titlebar',
      backgroundColor: '#00000000',
      icon: this.ctx.env.MAIN_WINDOW_ICON,
      title: APP_NAME,
      webPreferences: {
        preload: this.ctx.env.PRELOAD_PATH,
        sandbox: false,
      },
    })

    if (this.ctx.env.MAIN_DEV_SERVER_URL) {
      this.mainWindow.loadURL(this.ctx.env.MAIN_DEV_SERVER_URL)
      this.ctx.logger('window').info('development mode, open dev tools')
      this.mainWindow.webContents.once('did-finish-load', () => {
        this.mainWindow?.webContents.openDevTools({ mode: 'detach' })
      })
    }
    else {
      this.mainWindow.loadFile(this.ctx.env.MAIN_PROD_FILE)
    }

    const log = this.ctx.logger('renderer')
    this.mainWindow.webContents.on('console-message', (_e, level, message, line, source) => {
      const fn = level >= 3 ? log.error : level === 2 ? log.warn : log.info
      fn.call(log, '[%s:%s] %s', source, line, message)
    })
    this.mainWindow.webContents.on('render-process-gone', (_e, details) => {
      log?.error('renderer gone: %s', details.reason)
    })
    this.mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
      log?.error('did-fail-load %s %s %s', code, desc, url)
    })
  }

  createWindow(name: string, options: electron.BrowserWindowConstructorOptions) {
    if (this.subWindow.has(name)) {
      return this.subWindow.get(name)!
    }
    const window = new electron.BrowserWindow(options)
    this.subWindow.set(name, window)
    this.ctx.emit('internal/window', 'create', name, window)
    this.ctx.logger('window').info('created %c window', name)
    window.on('closed', () => {
      this.ctx.emit('internal/window', 'close', name)
      this.subWindow.delete(name)
      if (name === 'main')
        this.mainWindow = null
    })
    return window
  }
}

namespace WindowService {
  export type Config = WindowServiceConfig
}

export default WindowService
