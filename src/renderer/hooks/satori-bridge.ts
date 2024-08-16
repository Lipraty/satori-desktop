import { useSyncExternalStore } from "react"
import { Event, Channel } from "@satorijs/protocol"
import type { Element } from "@satorijs/core"

import { IpcEvents } from "@shared/types"

export type Contact = {
  platform: string,
  id: string,
  name: string,
  lastContent: string,
  avatar?: string
  type?: Channel.Type
}

export interface MessageEvent {
  data: {
    messages: Event[]
    contact: Contact[]
  }
  getData: () => typeof messageEvent.data
  subscribe: (callback: () => void) => () => void
}

const messageFilter = (elements: Element[]) => {
  let lastContent = ''
  elements.forEach((element) => {
    switch (element.type) {
      // text
      case 'text':
        lastContent += element.attrs.content
        break
      // media synopisis(only show type)
      case 'image':
      case 'img':
      case 'video':
      case 'audio':
      case 'file':
        lastContent = `[${element.type}]`
        break
      // modifing element
      case 'b':
      case 'strong':
      case 'i':
      case 'em':
      case 'u':
      case 'ins':
      case 's':
      case 'del':
      case 'code':
      case 'sup':
      case 'sub':
        lastContent += messageFilter(element.children)
        break
      case 'message':
        lastContent += messageFilter(element.children)
        break
      // other element will be ignored
      default:
        lastContent += ''
        break
    }
  })
  return lastContent
}

const contentTransducer = (channelType: Channel.Type, message: Event) => {
  switch (channelType) {
    case Channel.Type.DIRECT:
      return messageFilter(message.message?.elements || [])
    case Channel.Type.TEXT:
      return `${message.member?.nick || message.user?.name || message.channel?.id}: ${messageFilter(message.message?.elements || [])}`
    case Channel.Type.CATEGORY:
      return `${message.channel?.name}: ${message.message?.content}` // TODO
    case Channel.Type.VOICE:
      return `${message.channel?.name}: ${message.message?.content}` // TODO
    default:
      return ''
  }
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

function messageContactFormatter(id: string, message: Event, prevContact?: Contact): Contact {
  const contact: Contact = prevContact ?? {
    platform: message.platform!,
    id,
    name: '',
    lastContent: '',
    avatar: message.guild?.avatar,
    type: message.channel!.type!
  }

  console.log(id)

  if (prevContact) {
    if (message.channel!.type === Channel.Type.DIRECT) {
      if (!contact.avatar && id.replace(/^private:/, '') !== message.selfId)
        contact.avatar = message.user!.avatar
      if (!contact.name)
        contact.name = message.user!.name ?? message.channel!.name ?? id
    }
  } else {
    if (message.channel!.type === Channel.Type.DIRECT) {
      contact.name = message.channel!.name ?? message.user!.name ?? id
      if (id.replace(/^private:/, '') !== message.selfId)
        contact.avatar = message.user!.avatar
    }
    else
      contact.name = message.channel!.name ?? id
  }

  // reset new content
  contact.lastContent = contentTransducer(message.channel!.type!, message)

  return contact
}

export const messageEvent: MessageEvent = {
  data: { messages: [], contact: [] },
  getData: () => messageEvent.data,
  subscribe: eventSubscriber('chat/message', (message: Event) => {
    // NOTE: in `message-create` event, the `channel` and `message` and `user` will required
    // so, we can use non-null assertion.
    console.log('trigger subscribe')

    const messages = messageEvent.data.messages
    let contacts = messageEvent.data.contact
    // update message
    messages.push(message)
    // restore via message
    if (messageEvent.data.messages.length > 0 && messageEvent.data.contact.length === 0) {
      const uniqueContacts = new Map<string, Contact>()
      messageEvent.data.messages.forEach(msg => {
        const id = msg.guild?.id ?? msg.channel!.id
        if (!uniqueContacts.has(id)) {
          uniqueContacts.set(id, messageContactFormatter(id, msg))
        }
      })
      contacts = [...uniqueContacts.values()]
    }
    // update contact
    const prevContacts = contacts
    const id = message.guild?.id ?? message.channel!.id
    const index = prevContacts.findIndex((contact) => contact.id === id)
    if (id) {
      const prevContact = index < 0 ? undefined : prevContacts[index]
      const newContact = messageContactFormatter(id, message, prevContact)
      if (index === -1) {
        // insert new contact
        contacts = [newContact, ...prevContacts]
      } else {
        // update lastContent and frist of updated contact
        contacts = [newContact, ...prevContacts.slice(0, index), ...prevContacts.slice(index + 1)]
      }
    }
    messageEvent.data = { messages: [...messages], contact: contacts }
  })
}

export const useLoginEvent = () => { }

export const useInteractionEvent = () => { }

export const useStatusEvent = () => { }

export function useMessageEvent() {
  const store = useSyncExternalStore(messageEvent.subscribe, messageEvent.getData)
  return store
}
