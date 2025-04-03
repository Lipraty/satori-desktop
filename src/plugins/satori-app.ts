import { Context } from 'cordis'
import { } from 'minato'
import { Message, Channel, User } from '@satorijs/protocol'

declare module 'minato' {
  interface Tables {
    conversation: SatoriApp.Conversation
  }
}

declare module '@satorijs/protocol' {
  interface Event {
    conversation?: SatoriApp.Conversation
    percense?: SatoriApp.Precense
  }
  interface Message {
    status?: SatoriApp.MessageStatus
  }
}

export class SatoriApp {
  static readonly name = 'satori-conversation'
  static readonly inject = ['database', 'satori']

  constructor(ctx: Context) {
    ctx.model.extend('conversation', {
      id: 'string',
      type: 'integer',
      unread: 'integer',
      flags: 'integer',
      draft: 'text',
    })
  }
}

export namespace SatoriApp {
  export interface Precense {
    status: 'online' | 'offline'
    activity: string
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
}

export default SatoriApp
