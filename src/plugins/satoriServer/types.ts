import { Event, Message, Channel } from '@satorijs/protocol'

export type SessionFunction = (event: Event) => void

export interface AppMessage {
  id: string
  system: boolean
  platform: string
  channel?: Channel
  messageId: string
  timestamp: number
  prev: 0 | 1 | string
  next: 0 | 1 | string
  content: Message[]
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
