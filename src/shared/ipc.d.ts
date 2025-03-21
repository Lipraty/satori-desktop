import { IpcMainEvent } from 'electron'

export type IpcListener<K extends IpcEventKeys> = IpcEvents[K]
export type IpcEventKeys = keyof IpcEvents
export interface IpcEvents { }
