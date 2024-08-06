import { useSyncExternalStore } from "react"
import { Event } from "@satorijs/protocol"

import { IpcEvents } from "@shared/types"

export interface MessageEvent {
  messages: Event[]
  getMessages: () => Event[]
  subscribe: (callback: () => void) => () => void
}
const eventSubscriber = <T extends keyof IpcEvents>(event: T, listener: IpcEvents[T]) => (callback: () => void) => {
  const call: IpcEvents[T] = (...args: Parameters<IpcEvents[T]>) => {
    callback()
    return listener(...args) as ReturnType<IpcEvents[T]>
  }

  window.ipcManager.on(event, call)
  return () => {
    window.ipcManager.off(event, call)
  }
}

export const messageEvent: MessageEvent = {
  messages: [],
  getMessages: () => messageEvent.messages,
  subscribe: eventSubscriber('chat/message', (message: Event) => {
    messageEvent.messages.push(message)
  })
}

export const useLoginEvent = () => { }

export const useInteractionEvent = () => { }

export const useStatusEvent = () => { }

export const useMessageEvent = () => useSyncExternalStore(messageEvent.subscribe, messageEvent.getMessages)
