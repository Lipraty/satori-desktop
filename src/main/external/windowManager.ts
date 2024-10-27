import { BrowserWindow, BrowserWindowConstructorOptions, nativeTheme } from 'electron'
import * as path from 'node:path'

import { Context, Service } from '@main'

declare module '@main' {
  interface Context {
    window: WindowService
  }

  interface Events {
    'window/ready': (window: BrowserWindow) => void
    'window/created': (window: BrowserWindow) => void
    'window/all-closed': () => void
  }
}

export const isDarkTheme = () => nativeTheme.shouldUseDarkColors

export namespace WindowService {
  export interface Config extends BrowserWindowConstructorOptions { }
}

export class WindowService extends Service {
  static inject = ['settings']

  mainWindow!: BrowserWindow

  constructor(ctx: Context, config: WindowService.Config) {
    super(ctx, 'window')

    switch (this.ctx.settings.settings.theme) {
      case 'light':
        nativeTheme.themeSource = 'light'
        break
      case 'dark':
        nativeTheme.themeSource = 'dark'
        break
      case 'system':
      default:
        nativeTheme.themeSource = 'system'
        break
    }

    nativeTheme.on('updated', () => {
      BrowserWindow.getAllWindows().forEach(window => {
        window.setTitleBarOverlay && window.setTitleBarOverlay({
          symbolColor: isDarkTheme() ? '#ffffff' : '#000000',
          color: '#00000000',
          height: 44,
        })
      })
    })

    ctx.app.on('ready', () => {
      this.mainWindow = this.createWindow(config)

      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
      } else {
        this.mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
      }

      if (process.env.NODE_ENV === 'development') this.mainWindow.webContents.openDevTools()

      this.ctx.emit('window/ready', this.mainWindow)
    })

    ctx.app.on('window-all-closed', () => {
      // mabye the app can running in the background.
      this.ctx.scope.dispose()
    })

    ctx.app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow = new BrowserWindow(config)
      }
    })

    ctx.on('dispose', () => {
      if (BrowserWindow.getAllWindows().length !== 0)
        BrowserWindow.getAllWindows().forEach(window => window.close())
    })
  }

  createWindow(config: BrowserWindowConstructorOptions) {
    config = { ...this.config, ...config }
    const window = new BrowserWindow(config)
    this.ctx.emit('window/created', window)
    return window
  }

  setWindowMaterial(material: 'auto' | 'none' | 'mica' | 'acrylic' | 'tabbed') {
    this.mainWindow.setBackgroundMaterial(material)
  }
}
