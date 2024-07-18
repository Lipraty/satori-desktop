import { ipcMain, IpcMain, IpcMainEvent, IpcRendererEvent, webContents } from 'electron'

import { Context, Service } from '@main'
import { IpcEvents } from '@shared/types'

declare module '@main' {
  export interface Context {
    ipc: IPCManager
  }
}

export namespace IPCManager {
  export interface Config { }

  export interface Events extends IpcEvents { }

  export type EventsKeys = keyof Events

  export type Handler<K extends keyof Events> = (e: IpcMainEvent | IpcRendererEvent, ...args: Parameters<Events[K]>[]) => void
}

export class IPCManager extends Service {
  ipcMain: IpcMain
  private handlers: { [K in IPCManager.EventsKeys]?: IPCManager.Handler<K>[] } = {}

  constructor(ctx: Context, public config: IPCManager.Config) {
    super(ctx, 'ipc')
    this.ipcMain = ipcMain

    ctx.on('dispose', () => {
      // remove all listeners
      for (const event in this.handlers) {
        ipcMain.removeAllListeners(event)
      }
      this.handlers = {}
    })
  }

  on<K extends IPCManager.EventsKeys>(event: K, handler: IPCManager.Handler<K>): void {
    if (!this.handlers[event]) {
      Object.assign(this.handlers, { [event]: [] })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ipcMain.on(event, (e: IpcMainEvent, ...args: any[]) => {
        this.handlers[event]?.forEach(h => h(e, ...args))
        this.ctx.logger.debug(`IPC event: ${event}`)
      })
    }
    this.handlers[event]?.push(handler)
  }

  send<K extends IPCManager.EventsKeys>(event: K, ...args: Parameters<IPCManager.Events[K]>) {
    webContents.getAllWebContents().forEach((webContent) => {
      webContent.send(event, ...args)
      this.ctx.logger.debug('IPC send: ', event)
    })
  }
}
