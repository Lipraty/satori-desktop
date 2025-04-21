// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer } from 'electron'
import { contextBridge } from 'electron'

declare global {
  interface Window extends Exposed { }
}

export function createBridge<K extends keyof ExposedApi>(
  key: K,
  api: ExposedApi[K]
) {
  contextBridge.exposeInMainWorld(key, api)
}

export interface ExposedApi {
  native: ExposedNative
}

export type Exposed = {
  [key in keyof ExposedApi]: ExposedApi[key]
}

export interface ExposedNative {
  platform: NodeJS.Platform
  cordisEventBridge: (callback: (name: string, args: any[]) => void) => void
}

createBridge('native', {
  platform: process.platform,
  cordisEventBridge(callback) {
    ipcRenderer.on('internal:event', (_event, name, args) => callback(name, args))
  },
})
