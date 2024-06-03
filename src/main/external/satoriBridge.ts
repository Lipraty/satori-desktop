import { IpcMainEvent, WebContents } from 'electron'

import { Event, EventName, Methods, Method } from '@satorijs/protocol'

import { Context } from '../context'
import { } from './windowManager'

export class SatoriBridge {
  static inject = ['window'] as const
  #ipcContent: WebContents

  constructor(ctx: Context) {
    this.#ipcContent = ctx.window.mainWindow.webContents
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendEvent(event: EventName, data: Event) {
    this.#ipcContent.send(event, data)
  }

  onMethod<M extends keyof Methods>(event: M, listener: (event: IpcMainEvent, data) => void) {
    this.#ipcContent.ipc.on(event, listener)
  }
}
