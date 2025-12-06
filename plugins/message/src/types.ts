import { Message } from '@satorijs/protocol'

export interface AppMessage extends Message {
  uid: string
  seq: bigint
  platform: string
  channelId: string
  syncFlag: 0 | 1 | 2 | 3
  dead: boolean
  localOnly: boolean
  isEvent: boolean
  eventType?: string
  eventId?: string
}

export interface Span {
  uid: string
  type: 'remote' | 'sync' | 'local'
  platform: string
  channelId: string
  front: bigint
  back: bigint
  data: Message[]
  prev?: Promise<void>
  next?: Promise<void>
}

export interface AppEvents {
  uid: string
  id: string
  platform: string
  channelId: string
  type: 'system' | 'custom'
  craetedAt: number
  updatedAt: number
  meta: Record<string, any>
}
