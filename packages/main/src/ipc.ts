import type { Context } from '.'
import type { IpcListener, IpcEventKeys, IpcHandlerKeys, IpcEvents, IpcInvokable } from '@satoriapp/common'
import { Service } from 'cordis'
import { BrowserWindow, ipcMain, webContents } from 'electron'

declare module 'cordis' {
  interface Context {
    ipc: IpcService
  }
}

export class IpcService extends Service {
  private listeners = new Map<IpcEventKeys, IpcListener<IpcEventKeys>[]>()
  private handlers: IpcHandlerKeys[] = []

  constructor(ctx: Context) {
    super(ctx, 'ipc')
  }

  async stop() {
    this.listeners.forEach((listeners, channel) => {
      ipcMain.removeAllListeners(channel)
      listeners.forEach(listener => ipcMain.off(channel, listener as any))
    })
    this.handlers.forEach(handler => ipcMain.removeHandler(handler))
  }

  /**
   * listenalbe a one-way IPC message from a renderer process
   * @param channel message namespace
   * @param listener callback
   */
  addListener<K extends IpcEventKeys>(channel: K, listener: IpcListener<K>) {
    ipcMain.on(channel, listener)
    this.listeners.set(channel, [...(this.listeners.get(channel) ?? []), listener])
  }

  /**
   * handle the IPC calling function message from the renderer process
   * @param channel 
   * @param listener 
   */
  handler<K extends IpcHandlerKeys>(channel: K, listener: IpcInvokable<K>) {
    ipcMain.handle(channel, listener)
  }

  /**
   * Send a IPC message to the renderer process. in specific window
   * @param window target window
   * @param channel message namespace
   * @param args message payload
   */
  send<K extends IpcEventKeys>(window: BrowserWindow, channel: K, ...args: Parameters<IpcEvents[K]>) {
    window.webContents.send(channel, ...args)
  }

  /**
   * Send a IPC message to all renderer processes
   * @param channel message namespace
   * @param args message payload
   */
  sendAll<K extends IpcEventKeys>(channel: K, ...args: Parameters<IpcEvents[K]>) {
    webContents.getAllWebContents().forEach(content => {
      content.send(channel, ...args)
    })
  }
}

export default IpcService
