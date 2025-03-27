import { Event, Message, Channel, User } from '@satorijs/protocol'

declare module '@satorijs/protocol' {
  interface Event {
    conversation?: Conversation
    percense?: Precense
  }
  interface Message {
    status?: MessageStatus
  }
}

export enum MessageStatus {
  SENDING = 0,
  SENT = 1,
  DELIVERED = 2,
  READ = 3,
}

export enum ConversationFlags {
  MUTE = 0,
  PINNED = 1
}

export interface Conversation {
  id: string
  type: Channel.Type
  unread: number
  flags: ConversationFlags
  draft?: string
}

export interface Precense {
  status: 'online' | 'offline'
  activity: string
}

export type SessionFunction = (event: Event) => void

export interface MessageDatabase {
  id: string
  system: boolean
  platform: string
  sender: User
  channel?: Channel
  messageId: string
  timestamp: number
  prev: string | null
  next: string | null
  content: Message
  deleted: boolean
  reactions: Record<string, number>
  pinned?: boolean
  createdAt: number
  updatedAt: number
  version: number
}


