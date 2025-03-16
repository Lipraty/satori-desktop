import { Context } from '@main'
import { Channel, Message } from '@satorijs/protocol'

export interface AppMessage {
  id: string
  system: boolean
  platform: string
  channel: Channel
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

export class ServerDatabase {
  static name = 'serverDatabase'
  static inject = ['database']

  constructor(private ctx: Context) { }

  async start() {

  }
}
