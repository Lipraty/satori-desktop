import { Context, Service } from 'cordis'
import { BrowserWindow, ipcMain, IpcMainEvent, webContents } from 'electron'

declare module 'cordis' {
  interface Context {
    ipc: IpcService
  }
}

export class IpcService extends Service {
  private listeners = new Map<keyof IpcService.Channels, IpcService.Listener[]>()

  constructor(ctx: Context) {
    super(ctx, 'ipc')
  }

  async stop() {
    this.listeners.forEach((listeners, channel) => {
      ipcMain.removeAllListeners(channel as string)
      listeners.forEach(listener => ipcMain.off(channel as string, listener))
    })
  }

  /**
   * Listen to a one-way IPC message from the renderer process.
   * @param channel message namespace
   * @param listener callback
   */
  addListener<K extends keyof IpcService.Channels>(channel: K, listener: IpcService.Listener) {
    ipcMain.on(channel as string, listener)
    this.listeners.set(channel, [...(this.listeners.get(channel) ?? []), listener])
  }

  /**
   * @todo
   */
  //handler<K extends keyof IpcService.Channels>(channel: K, handler: IpcService.Listener) { }

  /**
   * Send a IPC message to the renderer process.
   * @param window target window
   * @param channel message namespace
   * @param args message payload
   */
  send(window: BrowserWindow, channel: keyof IpcService.Channels, ...args: any[]) {
    window.webContents.send(channel as string, ...args)
  }

  /**
   * Send a IPC message to all renderer processes.
   * @param channel message namespace
   * @param args message payload
   */
  sendAll(channel: keyof IpcService.Channels, ...args: any[]) {
    webContents.getAllWebContents().forEach(content => {
      content.send(channel as string, ...args)
    })
  }
}

export namespace IpcService {
  export interface Channels extends Record<string, Listener> { }
  export type Listener = (event: IpcMainEvent, ...args: any[]) => void
}

export default IpcService
