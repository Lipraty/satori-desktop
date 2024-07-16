import { useEffect } from "react";

import { IpcEvents } from "@shared/types";

declare global {
  interface Window {
    ipcManager: {
      send: <K extends keyof IpcEvents>(channel: K, ...args: Parameters<IpcEvents[K]>) => void
      on: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => void
      off: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => void
    }
  }
}

/**
 * send event to ipcMain
 * @param event Event name
 */
export function useIpcManager<K extends keyof IpcEvents>(event: K): (...args: Parameters<IpcEvents[K]>) => void
/**
 * listen event from ipcMain
 * @param event Event name
 * @param handler Event handler
 */
export function useIpcManager<K extends keyof IpcEvents>(event: K, handler: IpcEvents[K]): void
export function useIpcManager<K extends keyof IpcEvents>(event: K, handler?: IpcEvents[K]): void | ((...args: Parameters<IpcEvents[K]>) => void) {
  if (!handler) {
    return (...args: Parameters<IpcEvents[K]>) => {
      window.ipcManager.send(event, ...args)
    }
  } else {
    useEffect(() => {
      window.ipcManager.on(event, handler)
      return () => {
        window.ipcManager.off(event, handler)
      };
    }, [event, handler])
  }
}
