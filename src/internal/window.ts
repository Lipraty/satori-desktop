import { Context, Service } from 'cordis'
import { BrowserWindow, nativeTheme } from 'electron'
import path from 'node:path'

declare module 'cordis' {
  interface Context {
    window: WindowService
  }
}

export class WindowService extends Service {
  static readonly inject = ['app']
  static readonly name = 'window'
  root: BrowserWindow | null = null

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

  async start() {
    await this.ctx.app.whenReady()
    this.root = new BrowserWindow({
      width: this.config.width,
      minWidth: 1076,
      height: this.config.height,
      minHeight: 653,
      titleBarStyle: 'hidden',
      maximizable: false, // https://github.com/electron/electron/issues/42393
      titleBarOverlay: {
        symbolColor: this.isDarkTheme ? '#ffffff' : '#000000',
        color: '#00000000',
        height: 44,
      },
      backgroundMaterial: 'mica',
      backgroundColor: '#00000000',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    })
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      this.root.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    }
    else {
      this.root.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
    }

    if (process.env.NODE_ENV === 'development') {
      this.ctx.logger.info('devloper mode enabled')
      this.root.webContents.openDevTools()
    }
  }
}

export namespace WindowService {
  export interface Config {
    theme: 'dark' | 'light' | 'system'
    width: number
    height: number
  }
}

export default WindowService
