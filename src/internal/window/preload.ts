// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'
import { ExposedApi } from '@shared/exposed'

declare module '@shared/exposed' {
  export interface ExposedApi {
    satori: ExposedSatori
  }
  export interface ExposedNative {
    platform: NodeJS.Platform
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

export interface ExposedSatori {
  onMessage: (callback: (message: any) => void) => void
}

createBridge('native', {
  platform: process.platform,
})

createBridge('satori', {
  onMessage: (callback: (message: any) => void) => {
    ipcRenderer.on('satori:message', (_, message) => callback(message))
  }
})
