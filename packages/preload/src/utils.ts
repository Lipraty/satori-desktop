import { } from 'electron'
import { contextBridge } from 'electron/renderer'

declare global {
  interface Window extends Exposed { }
}

export function createBridge<K extends keyof ExposedApi>(
  key: K,
  api: ExposedApi[K]
) {
  contextBridge.exposeInMainWorld(key, api)
}

export interface ExposedApi { }

export type Exposed = {
  [key in keyof ExposedApi]: ExposedApi[key]
}
