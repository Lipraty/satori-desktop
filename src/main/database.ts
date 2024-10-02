import type { Channel, Message } from '@satorijs/protocol'
import {} from 'minato'
import *  as Minato from 'minato'

import { Context } from './context'

declare module './context' {
  interface Context {
    [Minato.Types]: Types,
    [Minato.Tables]: Tables
  }

  namespace Context {
    interface Database {}
  }
}

export interface Types extends Minato.Types {}
export interface Tables extends Minato.Tables {
  message: AppMessage
  contact: AppContact
}

export interface AppMessage {
  id: string
  platform: string
  channel: Channel
  messageId: string
  timestamp: number
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

export default class SatoriAppDatabase {
  constructor(public ctx: Context) {
    ctx.model.extend('message', {
      id: 'string',
      platform: 'string',
      channel: 'object',
      messageId: 'string',
      timestamp: 'integer(11)',
      prev: 'string',
      next: 'string',
      content: 'object',
    })
  }
}
