import { Context, Service } from 'cordis'
import { BrowserWindow, ipcMain, webContents } from 'electron'
import { IpcListener, IpcEventKeys } from '@shared/ipc'

declare module 'cordis' {
  interface Context {
    ipc: IpcService
  }
}

export class IpcService extends Service {
  private listeners = new Map<IpcEventKeys, IpcListener<IpcEventKeys>[]>()

  constructor(ctx: Context) {
    super(ctx, 'ipc')
  }

  async stop() {
    this.listeners.forEach((listeners, channel) => {
      ipcMain.removeAllListeners(channel as string)
      listeners.forEach(listener => ipcMain.off(channel as string, listener as any))
    })
  }

  /**
   * Listen to a one-way IPC message from the renderer process.
   * @param channel message namespace
   * @param listener callback
   */
  addListener<K extends IpcEventKeys>(channel: K, listener: IpcListener<K>) {
    ipcMain.on(channel as string, listener as any)
    this.listeners.set(channel, [...(this.listeners.get(channel) ?? []), listener])
  }

  /**
   * @todo
   */
  //handler<K extends IpcEventKeys>(channel: K, handler: IpcListener) { }

  /**
   * Send a IPC message to the renderer process.
   * @param window target window
   * @param channel message namespace
   * @param args message payload
   */
  send<K extends IpcEventKeys>(window: BrowserWindow, channel: K, ...args: Parameters<IpcListener<K>>) {
    window.webContents.send(channel as string, ...args)
  }

  /**
   * Send a IPC message to all renderer processes.
   * @param channel message namespace
   * @param args message payload
   */
  sendAll<K extends IpcEventKeys>(channel: K, ...args: Parameters<IpcListener<K>>) {
    webContents.getAllWebContents().forEach(content => {
      content.send(channel as string, ...args)
    })
  }
}

export default IpcService
