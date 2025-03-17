import { Context, Schema, Service } from 'cordis'
import { BrowserWindow, BrowserWindowConstructorOptions, nativeTheme } from 'electron'
import path from 'node:path'

declare module 'cordis' {
  interface Context {
    window: WindowService
  }
}

export class WindowService extends Service {
  static readonly inject = ['app']
  static readonly name = 'window'
  static Config: Schema<WindowService.Config> = Schema.object({
    title: Schema.string().default('Satori App for Desktop'),
    theme: Schema.union(['dark', 'light', 'system']).default('system'),
    width: Schema.number().step(1).default(1076),
    height: Schema.number().step(1).default(653),
  })

  private createdWindows: Map<string, BrowserWindow> = new Map()

  mainWindow: BrowserWindow | null = null

  constructor(ctx: Context, public config: WindowService.Config) {
    super(ctx, 'window')
    ctx.app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.start()
      }
    })
  }

  get isDarkTheme() {
    return this.config.theme === 'dark' || (this.config.theme === 'system' && nativeTheme.shouldUseDarkColors)
  }

  get getAllWindows() {
    return this.createdWindows.entries().map(([, window]) => window).toArray()
  }

  async start() {
    await this.ctx.app.whenReady()
    this.mainWindow ??= this.createWindow('$main', {
      minWidth: 1076,
      minHeight: 653,
      title: 'Satori App for Desktop',
      icon: path.join(__dirname, '../../public/assets/icons/icon.png'),
      // titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    })
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    }
    else {
      this.mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
    }

    if (process.env.NODE_ENV === 'development') {
      this.ctx.logger.info('devloper mode enabled')
      this.mainWindow.webContents.openDevTools()
    }
  }

  async stop() {
    this.createdWindows.forEach((window) => window.destroy())
    this.mainWindow?.destroy()
  }

  createWindow(name: string, option?: BrowserWindowConstructorOptions): BrowserWindow {
    option = Object.assign({
      width: this.config.width,
      height: this.config.height,
      titleBarOverlay: {
        symbolColor: this.isDarkTheme ? '#ffffff' : '#000000',
        color: '#00000000',
        height: 44,
      },
      backgroundMaterial: 'mica',
      vibrancy: 'titlebar',
      backgroundColor: '#00000000',
    }, option ?? {})
    if (name === '$main') {
      return new BrowserWindow(option)
    }
    this.ctx.logger.info('created window %c', name)
    if (this.createdWindows.has(name)) {
      return this.createdWindows.get(name) as BrowserWindow
    }
    const window = new BrowserWindow(option)
    this.createdWindows.set(name, window)
    return window
  }
}

export namespace WindowService {
  export interface Config {
    title: string
    theme: 'dark' | 'light' | 'system'
    width: number
    height: number
  }
}

export default WindowService
