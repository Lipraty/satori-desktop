import { ipcMain, IpcMain } from 'electron'

import { Context, Service } from './context'

export namespace IPCManager {
  export interface Config { }
  export interface EventListeners {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [k: string]: (IpcMainEvent, ...args: any[]) => void
  }

  export type EventName = keyof EventListeners
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type EventListener = EventListeners[EventName]
}

export class IPCManager extends Service {
  ipcMain: IpcMain
  #listeners: IPCManager.EventListeners = {}

  constructor(ctx: Context, public config: IPCManager.Config) {
    super(ctx, 'ipcManager')
    this.ipcMain = ipcMain
  }

  on(events: IPCManager.EventName, listener: IPCManager.EventListener) {
    if (this.#listeners[events]) {
      throw new Error(`Event ${events} already registered`)
    }
    this.#listeners[events] = listener
    this.ipcMain.on(`${events}`, listener)
  }

  remove(events: IPCManager.EventName, listener: IPCManager.EventListener) {
    if (!this.#listeners[events]) {
      throw new Error(`Event ${events} not registered`)
    }
    this.ipcMain.removeListener(`${events}`, listener)
    delete this.#listeners[events]
  }

  removeAll(events?: IPCManager.EventName) {
    if (events) {
      if (!this.#listeners[events]) {
        throw new Error(`Event ${events} not registered`)
      }
      this.ipcMain.removeListener(`${events}`, this.#listeners[events])
      delete this.#listeners[events]
      return
    }
  }
}
