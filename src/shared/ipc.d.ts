import { IpcMainEvent, IpcMainInvokeEvent, IpcRendererEvent } from 'electron'

export type IpcListener<K extends IpcEventKeys> = (event: IpcMainEvent | IpcRendererEvent, ...args: Parameters<IpcEvents[K]>) => void
export type IpcInvokable<K extends IpcHandlerKeys> = (event: IpcMainInvokeEvent, ...args: Parameters<IpcHandlers[K]>) => Promise<ReturnType<IpcHandlers[K]>>
export type IpcEventKeys = keyof IpcEvents
export type IpcHandlerKeys = keyof IpcHandlers
export interface IpcEvents { }
export interface IpcHandlers { }
