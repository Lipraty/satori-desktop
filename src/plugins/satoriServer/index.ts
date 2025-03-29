import { Context } from "cordis"
import { } from '@satorijs/adapter-satori'
import { } from '@internal/ipc'
import { } from '@internal/database'
import { IpcEventKeys, IpcHandlerKeys } from "@shared/ipc"
import { SatoriAppContact } from "./conversation"
import { Conversation, ConversationFlags, SessionFunction } from "./types"
import {
  SendOptions,
  Message,
  Direction,
  Order,
  Login,
  User,
  Guild,
  GuildMember,
  GuildRole,
  Channel,
  BidiList,
  PartialWithPick,
  List,
  Element,
  Methods,
} from '@shared/protocol'

declare module '@shared/ipc' {
  interface IpcEvents {
    // satori native events. see: https://satori.js.org/zh-CN/protocol/events.html
    'satori:login-added': SessionFunction
    'satori:login-removed': SessionFunction
    'satori:login-updated': SessionFunction
    'satori:message-created': SessionFunction
    'satori:message-deleted': SessionFunction
    'satori:message-updated': SessionFunction
    'satori:message-pinned': SessionFunction
    'satori:message-unpinned': SessionFunction
    'satori:guild-added': SessionFunction
    'satori:guild-removed': SessionFunction
    'satori:guild-updated': SessionFunction
    'satori:guild-member-added': SessionFunction
    'satori:guild-member-removed': SessionFunction
    'satori:guild-member-updated': SessionFunction
    'satori:guild-role-created': SessionFunction
    'satori:guild-role-deleted': SessionFunction
    'satori:guild-role-updated': SessionFunction
    'satori:reaction-added': SessionFunction
    'satori:reaction-removed': SessionFunction
    'satori:friend-request': SessionFunction
    'satori:guild-request': SessionFunction
    'satori:guild-member-request': SessionFunction
    'satori:before-send': SessionFunction
    'satori:send': SessionFunction
    // extended from satori app for desktop.
    'satori:conversation-updated': SessionFunction
  }
  interface IpcHandlers {
    // satori native handlers. see: https://satori.js.org/zh-CN/protocol/
    'satori:create.message'(channelId: string, content: Element.Fragment, referrer?: any, options?: SendOptions): Promise<Message[]>
    'satori:send.message'(channelId: string, content: Element.Fragment, referrer?: any, options?: SendOptions): Promise<string[]>
    'satori:send.private.message'(userId: string, content: Element.Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
    'satori:get.message'(channelId: string, messageId: string): Promise<Message>
    'satori:get.message.list'(channelId: string, next?: string, direction?: Direction, limit?: number, order?: Order): Promise<BidiList<Message>>
    'satori:edit.message'(channelId: string, messageId: string, content: Element.Fragment): Promise<void>
    'satori:delete.message'(channelId: string, messageId: string): Promise<void>
    'satori:create.reaction'(channelId: string, messageId: string, emoji: string): Promise<void>
    'satori:delete.reaction'(channelId: string, messageId: string, emoji: string, userId?: string): Promise<void>
    'satori:clear.reaction'(channelId: string, messageId: string, emoji?: string): Promise<void>
    'satori:get.login'(): Promise<Login>
    'satori:get.user'(userId: string, guildId?: string): Promise<User>
    'satori:get.friend.list'(next?: string): Promise<List<User>>
    'satori:delete.friend'(userId: string): Promise<void>
    'satori:get.guild'(guildId: string): Promise<Guild>
    'satori:get.guild.list'(next?: string): Promise<List<Guild>>
    'satori:get.guild.member'(guildId: string, userId: string): Promise<GuildMember>
    'satori:get.guild.member.list'(guildId: string, next?: string): Promise<List<GuildMember>>
    'satori:kick.guild.member'(guildId: string, userId: string, permanent?: boolean): Promise<void>
    'satori:mute.guild.member'(guildId: string, userId: string, duration: number, reason?: string): Promise<void>
    'satori:set.guild.member.role'(guildId: string, userId: string, roleId: string): Promise<void>
    'satori:unset.guild.member.role'(guildId: string, userId: string, roleId: string): Promise<void>
    'satori:get.guild.member.role.list'(guildId: string, userId: string, next?: string): Promise<List<PartialWithPick<GuildRole, 'id'>>>
    'satori:get.guild.role.list'(guildId: string, next?: string): Promise<List<GuildRole>>
    'satori:get.guild.role.iter'(guildId: string): AsyncIterable<GuildRole>
    'satori:create.guild.role'(guildId: string, data: Partial<GuildRole>): Promise<GuildRole>
    'satori:update.guild.role'(guildId: string, roleId: string, data: Partial<GuildRole>): Promise<void>
    'satori:delete.guild.role'(guildId: string, roleId: string): Promise<void>
    'satori:get.channel'(channelId: string, guildId?: string): Promise<Channel>
    'satori:get.channel.list'(guildId: string, next?: string): Promise<List<Channel>>
    'satori:create.direct.channel'(userId: string, guildId?: string): Promise<Channel>
    'satori:create.channel'(guildId: string, data: Partial<Channel>): Promise<Channel>
    'satori:update.channel'(channelId: string, data: Partial<Channel>): Promise<void>
    'satori:delete.channel'(channelId: string): Promise<void>
    'satori:mute.channel'(channelId: string, guildId?: string, enable?: boolean): Promise<void>
    'satori:handle.friend.request'(messageId: string, approve: boolean, comment?: string): Promise<void>
    'satori:handle.guild.request'(messageId: string, approve: boolean, comment?: string): Promise<void>
    'satori:handle.guild.member.request'(messageId: string, approve: boolean, comment?: string): Promise<void>
    // extended from satori app for desktop.
    /**
     * get conversation list
     * @param next next cursor
     */
    'satori:get.conversation.list'(next?: string): Promise<List<Conversation>>
    /**
     * set the conversation flag
     * @param conversationId conversation id
     * @param flag mute or pinned
     */
    'satori:set.conversation.flag'(conversationId: string, flag: ConversationFlags): Promise<void>
    /**
     * set the conversation draft content
     * @param conversationId conversation id
     * @param draft draft content
     */
    'satori:set.conversation.draft'(conversationId: string, draft: string): Promise<void>
    /**
     * empty the unread count while read the conversation
     * @param conversationId conversation id
     */
    'satori:set.conversation.reading'(conversationId: string): Promise<void>
  }
}

type HandleMappingKeys<T = IpcHandlerKeys> = T extends `${infer _K}:${infer R}` ? R : never
const satoriHandlerMapping: HandleMappingKeys[] = [
  'create.message',
  'send.message',
  'send.private.message',
  'get.message',
  'get.message.list',
  'edit.message',
  'delete.message',
  'create.reaction',
  'delete.reaction',
  'clear.reaction',
  'get.login',
  'get.user',
  'get.friend.list',
  'delete.friend',
  'get.guild',
  'get.guild.list',
  'get.guild.member',
  'get.guild.member.list',
  'kick.guild.member',
  'mute.guild.member',
  'set.guild.member.role',
  'unset.guild.member.role',
  'get.guild.member.role.list',
  'get.guild.role.list',
  'get.guild.role.iter',
  'create.guild.role',
  'update.guild.role',
  'delete.guild.role',
  'get.channel',
  'get.channel.list',
  'create.direct.channel',
  'create.channel',
  'update.channel',
  'delete.channel',
  'mute.channel',
  'handle.friend.request',
  'handle.guild.request',
  'handle.guild.member.request',
] as const

export const name = 'satori-server'

export const inject = ['satori', 'ipc', 'database']

export function apply(ctx: Context) {
  // ctx.plugin(SatoriAppContact)
  console.log('satori server plugin loaded')

  ctx.on('internal/session', ({ type, event, timestamp }) => {
    ctx.logger.info('session:', type)
    if (type === 'internal') return
    ctx.ipc.sendAll(`satori:${type}` as IpcEventKeys, event)
  })

  satoriHandlerMapping.forEach(key => {
    ctx.ipc.handler(`satori:${key}` as IpcHandlerKeys, async (_event, ...args) => {
      const { platform, selfId } = args[0]! as unknown as { platform: string, selfId: string }
      const bot = ctx.bots.filter(bot => bot.platform === platform && bot.selfId === selfId)[0]
      if (!bot) return Promise.reject(new Error('bot not found'))
      // foo.bar -> fooBar
      const method = key.split('.').map((v, i) => i === 0 ? v : v[0].toUpperCase() + v.slice(1)).join('')
      return (bot[method as keyof Methods] as Function).apply(bot, args.slice(1))
    })
  })
}
