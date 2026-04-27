import type { Argv, Button, Channel, Emoji, Friend, Guild, GuildMember, GuildRole, Login, Message, User } from '@satorijs/protocol'

export interface AppUser extends User {
  uid?: bigint
  updatedAt?: number
}

export interface AppFriend extends Friend {
  uid?: bigint
}

export interface AppGuild extends Guild {
  uid?: bigint
  updatedAt?: number
}

export interface AppChannel extends Channel {
  uid?: bigint
  guildId?: string
  updatedAt?: number
}

export interface AppGuildMember extends GuildMember {
  uid?: bigint
  guildId?: string
  userId?: string
  updatedAt?: number
}

export interface AppGuildRole extends GuildRole {
  uid?: bigint
  guildId?: string
  updatedAt?: number
}

export interface AppLogin extends Login {
  uid?: bigint
  updatedAt?: number
}

export interface AppArgv extends Argv {
  uid?: bigint
}

export interface AppButton extends Button {
  uid?: bigint
}

export interface AppEmoji extends Emoji {
  uid?: bigint
}

export interface AppStatePatch {
  p: string
  o: 'set' | 'delete'
  v?: unknown
}

export interface AppState {
  uid?: bigint
  userId: string
  namespace: string
  state?: Record<string, unknown>
  patches?: AppStatePatch[]
  updatedAt?: number
}

export interface AppMessage extends Message {
  uid?: bigint
  seq: bigint
  platform: string
  channelId: string
  syncFlag: 0 | 1 | 2 | 3
  dead: boolean
  localOnly: boolean
  isEvent: boolean
  eventType?: string
  eventId?: string
  timestamp?: number
  updatedAt?: number
}

export interface Span {
  uid: string
  type: 'remote' | 'sync' | 'local'
  platform: string
  channelId: string
  front: bigint
  back: bigint
  data: AppMessage[]
  prev?: string
  next?: string
}

export interface AppEvents {
  uid: bigint
  id: string
  platform: string
  channelId: string
  type: 'system' | 'custom'
  createdAt: number
  updatedAt: number
  meta: Record<string, unknown>
}

export interface CreateMessageInput {
  id?: string
  platform: string
  channelId: string
  selfId?: string
  timestamp?: number
  content?: string
  syncFlag?: 0 | 1 | 2 | 3
  localOnly?: boolean
  isEvent?: boolean
  eventType?: string
  eventId?: string
  dead?: boolean
  conversationType?: 'channel' | 'group' | 'private'
  payload?: Record<string, unknown>
}
