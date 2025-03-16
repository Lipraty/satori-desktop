import type { Channel, Message } from '@satorijs/protocol'

import { Context } from './context'

export interface AppMessage {
  id: string // slowflake id
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

export default class SatoriAppDatabase {
  constructor(public ctx: Context) {
    ctx.model.extend('message', {
      id: 'string',
      system: 'boolean',
      platform: 'string',
      channel: 'object',
      messageId: 'string',
      timestamp: 'integer(11)',
      prev: 'string',
      next: 'string',
      content: 'object',
    })

    ctx.model.extend('contact', {
      id: 'string',
      structType: 'integer(1)',
      channelType: 'integer(1)',
      parent: 'string',
      cover: 'object',
    })
  }
}
