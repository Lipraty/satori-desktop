// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

import type { IPCManager } from "./external/ipcManager";

contextBridge.exposeInMainWorld('satori', {})

contextBridge.exposeInMainWorld('ipcManager', {
  send: <K extends IPCManager.EventsKeys>(channel: K, ...args: Parameters<IPCManager.Events[K]>) => ipcRenderer.send(channel, ...args),
  on: <K extends IPCManager.EventsKeys>(channel: K, listener: IPCManager.Handler<K>) => {
    ipcRenderer.on(channel, (_event: IpcRendererEvent, ...args: Parameters<IPCManager.Events[K]>[]) => {
      // json string to object
      args = args.map(arg => {
        if (typeof arg === 'string') {
          try {
            return JSON.parse(arg);
          } catch {
            return arg;
          }
        }
      })
      listener(...args as Parameters<IPCManager.Handler<K>>);
    });
  },
  off: <K extends IPCManager.EventsKeys>(channel: K, listener: IPCManager.Handler<K>) => {
    ipcRenderer.off(channel, listener);
  }
})
