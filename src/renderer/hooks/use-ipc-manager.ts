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

export const useIpcManager = <K extends keyof IpcEvents>(event: K, handler: IpcEvents[K]) => {
  useEffect(() => {
    window.ipcManager.on(event, handler)
    return () => {
      window.ipcManager.off(event, handler)
    };
  }, [event, handler])

  const send = (...args: Parameters<IpcEvents[K]>) => {
    window.ipcManager.send(event, ...args)
  }

  return send
}
