import { IpcMainEvent, WebContents } from 'electron'

import { Event, EventName, Methods, Method } from '@satorijs/protocol'

import { Context } from '../context'
import { } from './windowManager'
import { } from './ipcManager'

export class SatoriBridge {
  static inject = ['window', 'satori', 'ipc'] as const
  #ipcContent: WebContents

  constructor(ctx: Context) {
    this.#ipcContent = ctx.window.mainWindow.webContents
  }

  sendEvent(event: EventName, data: Event) {
    this.#ipcContent.send(event, data)
  }

  onMethod<M extends keyof Methods>(event: M, listener: (event: IpcMainEvent, data) => void) {
    this.#ipcContent.ipc.on(event, listener)
  }
}
