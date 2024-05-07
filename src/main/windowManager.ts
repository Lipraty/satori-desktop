import { BrowserWindow, BrowserWindowConstructorOptions, nativeTheme } from "electron";
import * as path from 'node:path'

import { Context, Service } from "./context";

declare module '.' {
  interface Context {
    window: WindowService
  }

  interface Events {
    'window/ready': (window: BrowserWindow) => void
    'window/all-closed': () => void
  }
}

export const isDarkTheme = () => nativeTheme.shouldUseDarkColors

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace WindowService {
  export interface Config extends BrowserWindowConstructorOptions { }
}

export class WindowService extends Service {
  mainWindow: BrowserWindow

  constructor(ctx: Context, config: WindowService.Config) {
    super(ctx, 'window')

    ctx.app.on('ready', () => {

      this.mainWindow = new BrowserWindow(config)

      if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        this.mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
      } else {
        this.mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
      }

      if (process.env.NODE_ENV === 'development')
        this.mainWindow.webContents.openDevTools()

      this.ctx.emit('window/ready', this.mainWindow)
    })

    ctx.app.on('window-all-closed', () => {
      this.ctx.emit('window/all-closed')
      if (process.platform !== 'darwin') {
        this.ctx.scope.dispose()
        ctx.app.quit()
      }
    })

    ctx.app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.mainWindow = new BrowserWindow(config)
      }
    })

    nativeTheme.on('updated', () => {
      this.mainWindow.setTitleBarOverlay({
        symbolColor: isDarkTheme() ? '#ffffff' : '#000000',
        color: '#00000000',
        height: 44,
      })
    })
  }

  setWindowMaterial(material: "auto" | "none" | "mica" | "acrylic" | "tabbed") {
    this.mainWindow.setBackgroundMaterial(material)
  }
}
