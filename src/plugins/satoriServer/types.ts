import { Event, Message, Channel, User } from '@satorijs/protocol'

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

export enum AppContactStructType {
  CATEGORY = 1,
  GUILD = 2,
  CHANNEL_CATEGORY = 3,
  CHANNEL = 4,
}

export interface AppContact {
  id: string
  structType: AppContactStructType
  channelType: Channel.Type
  parent: string
  cover: Message
}
