import type { Channel, Message } from '@satorijs/protocol'

export interface AppMessage {
  id: string
  platfrom: string
  channel: Channel
  message_id: string
  timestamp: string
  prev: 0 | 1 | string
  next: 0 | 1 | string
  content: Message | Message[]
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