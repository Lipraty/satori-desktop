import { IpcEvents } from "@shared/types"

declare global {
  interface Window {
    ipcManager: {
      send: <K extends keyof IpcEvents>(channel: K, ...args: Parameters<IpcEvents[K]>) => void
      on: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => void
      off: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => void
    }
  }
}

export const useIpcManager = {
  send: <K extends keyof IpcEvents>(channel: K, ...args: Parameters<IpcEvents[K]>) => {
    window.ipcManager.send(channel, ...args)
  },
  on: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => {
    window.ipcManager.on(channel, listener)
  },
  off: <K extends keyof IpcEvents>(channel: K, listener: IpcEvents[K]) => {
    window.ipcManager.off(channel, listener)
  }
}
