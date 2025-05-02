import type { IpcMainEvent, IpcMainInvokeEvent, IpcRendererEvent } from 'electron'

import type * as cordis from 'cordis'

// IPC Types
export type IpcListener<K extends IpcEventKeys> = (event: IpcMainEvent | IpcRendererEvent, ...args: Parameters<IpcEvents[K]>) => void
export type IpcInvokable<K extends IpcHandlerKeys> = (event: IpcMainInvokeEvent, ...args: Parameters<IpcHandlers[K]>) => Promise<ReturnType<IpcHandlers[K]>>
export type IpcEventKeys = keyof IpcEvents
export type IpcHandlerKeys = keyof IpcHandlers
export interface IpcEvents { }
export interface IpcHandlers { }

// Shared Cordis Events
export interface Events<C extends cordis.Context> extends cordis.Events<C> { }

export function emptyObject(obj: any) {
  for (const key in obj) {
    if (obj[key] !== undefined) {
      return false
    }
  }
  return true
}

export * from 'cosmokit'
