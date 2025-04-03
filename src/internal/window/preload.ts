// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'
import type { Events, Context, GetEvents } from 'cordis'
import { ExposedApi } from '@shared/exposed'

declare module '@shared/exposed' {
  export interface ExposedNative {
    platform: NodeJS.Platform
    eventBridge: (callback: <K extends keyof Events<Context>>(name: K, args: Parameters<GetEvents<Context>[K]>) => void) => void
  }
}

export function createBridge<K extends keyof ExposedApi>(
  key: K,
  api: ExposedApi[K]
) {
  contextBridge.exposeInMainWorld(key, api)
}

export interface ExposedNative {
  platform: NodeJS.Platform
}

createBridge('native', {
  platform: process.platform,
  eventBridge(callback) {
    ipcRenderer.on('internal:event', (_event, name, args) => {
      if (typeof callback === 'function') {
        callback(name, args)
      }
    })
  },
})
