import { useSyncExternalStore } from "react"
import { Event } from "@satorijs/protocol"

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

const messages: Event[] = []

const eventSubscribe = (callback: () => void) => {
  const listener = (session: Event) => {
    if (messages.some((message) => message.id === session.id)) return
    messages.push(session)
    callback()
  }

  window.ipcManager.on('chat/message', (_e, session) => listener(session))

  return () => {
    window.ipcManager.off('chat/message', (_e, session) => listener(session))
  }
}

export const useMessageEventListener = () => {
  console.log('useMessageEventListener')
  return useSyncExternalStore(eventSubscribe, () => messages)
}
