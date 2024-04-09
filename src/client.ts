import * as Cordis from 'cordis';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { App } from './app';

declare module '.' {
  interface Context {
    client: ClientService
  }
  interface Events {
    'client/before-created': () => void
  }
}

declare module 'cordis' {
  interface Events {
    'client/ready': (app: Electron.App) => void
    'client/window-created': (window: Electron.BrowserWindow) => void
  }
}

export class ClientService extends Cordis.Service {
  constructor(ctx: App) {
    super(ctx, 'client')
    if (require('electron-squirrel-startup')) {
      app.quit();
    }
    app.on('ready', () => {
      this.ctx.emit('client/ready', app)
      this.createWindow()
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    ctx.on('dispose', () => {
      app.quit()
    })
  }

  protected createWindow() {
    const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      titleBarStyle: 'hidden',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }
    this.ctx.emit('client/window-created', mainWindow)
    mainWindow.webContents.openDevTools();
  }
}
