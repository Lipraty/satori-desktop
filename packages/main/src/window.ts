import * as electron from 'electron'
import type { Context } from '.'
import { Service, Schema } from 'cordis'

declare module '.' {
  interface Context {
    window: WindowService
  }
  interface Events {
    'internal/window': (type: 'create' | 'close', name: string, ...args: any[]) => void
  }
}

class WindowService extends Service {
  static readonly name = 'window'
  static Config: Schema<WindowService.Config> = Schema.object({
    theme: Schema.union(['dark', 'light', 'system']).default('system'),
    width: Schema.number().step(1).default(1076),
    height: Schema.number().step(1).default(653),
  })

  private mainWindow: electron.BrowserWindow | null = null
  private subWindow: Map<string, electron.BrowserWindow> = new Map()

  get isDarkTheme() {
    return this.config.theme === 'dark' || (this.config.theme === 'system' && electron.nativeTheme.shouldUseDarkColors)
  }

  constructor(public ctx: Context, public config: WindowService.Config) {
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
      titleBarStyle: 'hidden',
      ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
      backgroundMaterial: 'mica',
      vibrancy: 'titlebar',
      backgroundColor: '#00000000',
      title: this.ctx.$env.APP_NAME,
      webPreferences: {
        preload: this.ctx.$env.PRELOAD_PATH,
        sandbox: false,
      },
    })

    if (this.ctx.$env.MAIN_DEV_SERVER_URL) {
      this.mainWindow.loadURL(this.ctx.$env.MAIN_DEV_SERVER_URL)
    } else {
      this.mainWindow.loadFile(this.ctx.$env.MAIN_PROD_FILE)
    }

    if (process.env.NODE_ENV === 'development') {
      this.ctx.logger.info('development mode, open dev tools')
      this.mainWindow.webContents.openDevTools()
    }
  }

  createWindow(name: string, options: electron.BrowserWindowConstructorOptions) {
    if (this.subWindow.has(name)) {
      return this.subWindow.get(name)
    }
    const window = new electron.BrowserWindow(options)
    this.subWindow.set(name, window)
    this.ctx.emit('internal/window', 'create', name, window)
    this.ctx.logger.info('created %c window', name)
    window.on('close', () => {
      this.ctx.emit('internal/window', 'close', name)
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

export default WindowService
