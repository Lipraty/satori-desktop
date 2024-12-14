// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron"

import type { IPCManager } from "./external/ipcManager";

const parameterFormatter = <T>(args: any[]) => {
  if (!args) return [] as T;
  return args.map(arg => {
    if (typeof arg === 'function') {
      return arg.toString();
    }
    if (typeof arg === 'object' && arg !== null) {
      return JSON.stringify(arg);
    }
    if (typeof arg === 'string') {
      try {
        return JSON.parse(arg);
      } catch {
        return arg;
      }
    }
    return arg;
  }) as T;
}

contextBridge.exposeInMainWorld('satori', {});

const ipcManager = {
  send: <K extends IPCManager.EventsKeys>(channel: K, ...args: Parameters<IPCManager.Events[K]>) => ipcRenderer.send(channel, ...args),
  on: <K extends IPCManager.EventsKeys>(channel: K, listener: IPCManager.Handler<K>) => {
    const listenerWrapper = (_event: IpcRendererEvent, ...args: Parameters<IPCManager.Handler<K>>) =>
      listener(...parameterFormatter<Parameters<IPCManager.Handler<K>>>(args));
    ipcRenderer.on(channel, listenerWrapper);
    return () => ipcRenderer.removeListener(channel, listenerWrapper);
  }
}

contextBridge.exposeInMainWorld('ipcManager', ipcManager);
