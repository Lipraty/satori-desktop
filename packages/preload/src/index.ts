// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { ipcRenderer } from 'electron/renderer'
import { createBridge } from './utils'
import type { Context, Events, GetEvents } from 'cordis'
export * from './utils'

// Step 1: Expland the api type.
declare module './utils' {
  interface ExposedApi {
    native: ExposedNative
  }
}

interface ExposedNative {
  platform: NodeJS.Platform
  cordisEventBridge: (callback: <K extends keyof Events<Context>>(name: K, args: Parameters<GetEvents<Context>[K]>) => void) => void
}

// Step 2: Expose the api to the renderer process.
createBridge('native', {
  platform: process.platform,
  cordisEventBridge(callback) {
    ipcRenderer.on('internal:event', (_event, name, args) => callback(name, args))
  },
})
