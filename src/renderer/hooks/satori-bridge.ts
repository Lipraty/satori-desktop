import { useSyncExternalStore } from "react"
import { Event } from "@satorijs/protocol"

import { IpcEvents } from "@shared/types"

export type Contact = {
  platform: string,
  id: string,
  name: string,
  lastContent: string,
  avatar?: string
}

export interface MessageEvent {
  data: {
    messages: Event[]
    contact: Contact[]
  }
  getData: () => typeof messageEvent.data
  subscribe: (callback: () => void) => () => void
}
function eventSubscriber<T extends keyof IpcEvents>(event: T, listener: IpcEvents[T]) {
  return (callback: () => void) => {
    const call = (...args: any[]) => {
      callback()
      // TODO: There are still some problems with the type, but it runs normally.
      // eslint-disable-next-line prefer-spread
      return (listener as any).apply(null, args) as ReturnType<IpcEvents[T]>
    }
    window.ipcManager.on<T>(event, call)
    return () => {
      window.ipcManager.off(event, callback)
    }
  }
}

export const messageEvent: MessageEvent = {
  data: { messages: [], contact: [] },
  getData: () => messageEvent.data,
  subscribe: eventSubscriber('chat/message', (message: Event) => {
    messageEvent.data.messages.push(message)
    // update contact
    const prevContact = messageEvent.data.contact
    const id = message.guild?.id || message.channel?.id
    if (id) {
      const index = prevContact.findIndex((contact) => contact.id === id)
      const newContact = {
        platform: message.platform,
        id,
        name: message.guild?.name || message.user?.name || 'Unknown',
        lastContent: `${message.member?.nick ?? message.user?.name ?? 'UnknowName'}: ${message.message?.content}`,
        avatar: message.guild?.avatar,
      }
      if (index === -1) {
        // insert new contact
        messageEvent.data.contact = [newContact, ...prevContact]
      } else {
        // update lastContent and frist of updated contact
        messageEvent.data.contact = [newContact, ...prevContact.slice(0, index), ...prevContact.slice(index + 1)]
      }
    }
  })
}

export const useLoginEvent = () => { }

export const useInteractionEvent = () => { }

export const useStatusEvent = () => { }

export function useMessageEvent() {
  const store = useSyncExternalStore(messageEvent.subscribe, messageEvent.getData)
  return store
}
