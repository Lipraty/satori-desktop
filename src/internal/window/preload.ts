// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron'
import { ExposedApi } from '@shared/exposed'
import { IpcEventKeys, IpcListener } from '@shared/ipc'
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
  Conversation,
  ConversationFlags,
} from '@shared/protocol'

declare module '@shared/exposed' {
  export interface ExposedApi {
    satori: ExposedSatori
  }
  export interface ExposedNative {
    platform: NodeJS.Platform
  }
}

export function createBridge<K extends keyof ExposedApi>(
  key: K,
  api: ExposedApi[K]
) {
  contextBridge.exposeInMainWorld(key, api)
}

export interface ExposedNative {
  platform: NodeJS.Platform
}

export interface ExposedSatori {
  addListener<C extends IpcEventKeys>(channel: C, listener: IpcListener<C>): void
  methods(platform: string, selfId: string): SatoriMethods
}

export interface SatoriMethods {
  createMessage(channelId: string, content: Element.Fragment, referrer?: any, options?: SendOptions): Promise<Message[]>
  sendMessage(channelId: string, content: Element.Fragment, referrer?: any, options?: SendOptions): Promise<string[]>
  sendPrivateMessage(userId: string, content: Element.Fragment, guildId?: string, options?: SendOptions): Promise<string[]>
  getMessage(channelId: string, messageId: string): Promise<Message>
  getMessageList(channelId: string, next?: string, direction?: Direction, limit?: number, order?: Order): Promise<BidiList<Message>>
  editMessage(channelId: string, messageId: string, content: Element.Fragment): Promise<void>
  deleteMessage(channelId: string, messageId: string): Promise<void>
  createReaction(channelId: string, messageId: string, emoji: string): Promise<void>
  deleteReaction(channelId: string, messageId: string, emoji: string, userId?: string): Promise<void>
  clearReaction(channelId: string, messageId: string, emoji?: string): Promise<void>
  getLogin(): Promise<Login>
  getUser(userId: string, guildId?: string): Promise<User>
  getFriendList(next?: string): Promise<List<User>>
  deleteFriend(userId: string): Promise<void>
  getGuild(guildId: string): Promise<Guild>
  getGuildList(next?: string): Promise<List<Guild>>
  getGuildMember(guildId: string, userId: string): Promise<GuildMember>
  getGuildMemberList(guildId: string, next?: string): Promise<List<GuildMember>>
  kickGuildMember(guildId: string, userId: string, permanent?: boolean): Promise<void>
  muteGuildMember(guildId: string, userId: string, duration: number, reason?: string): Promise<void>
  setGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void>
  unsetGuildMemberRole(guildId: string, userId: string, roleId: string): Promise<void>
  getGuildMemberRoleList(guildId: string, userId: string, next?: string): Promise<List<PartialWithPick<GuildRole, 'id'>>>
  getGuildRoleList(guildId: string, next?: string): Promise<List<GuildRole>>
  createGuildRole(guildId: string, data: Partial<GuildRole>): Promise<GuildRole>
  updateGuildRole(guildId: string, roleId: string, data: Partial<GuildRole>): Promise<void>
  deleteGuildRole(guildId: string, roleId: string): Promise<void>
  getChannel(channelId: string, guildId?: string): Promise<Channel>
  getChannelList(guildId: string, next?: string): Promise<List<Channel>>
  createDirectChannel(userId: string, guildId?: string): Promise<Channel>
  createChannel(guildId: string, data: Partial<Channel>): Promise<Channel>
  updateChannel(channelId: string, data: Partial<Channel>): Promise<void>
  deleteChannel(channelId: string): Promise<void>
  muteChannel(channelId: string, guildId?: string, enable?: boolean): Promise<void>
  handleFriendRequest(messageId: string, approve: boolean, comment?: string): Promise<void>
  handleGuildRequest(messageId: string, approve: boolean, comment?: string): Promise<void>
  handleGuildMemberRequest(messageId: string, approve: boolean, comment?: string): Promise<void>
  // extended from satori app for desktop.
  getConversationList(next?: string): Promise<List<Conversation>>
  setConversationFlag(conversationId: string, flag: ConversationFlags): Promise<void>
  setConversationDraft(conversationId: string, draft: string): Promise<void>
  readingConversation(conversationId: string): Promise<void>
}

createBridge('native', {
  platform: process.platform,
})

const satoriMethodHandlers = new WeakMap<object, SatoriMethods>()

createBridge('satori', {
  addListener(channel, listener) {
    ipcRenderer.on(channel, listener)
  },
  methods(platform, selfId) {
    const handler: ProxyHandler<SatoriMethods> = {
      get: (_, methodName: keyof SatoriMethods) => {
        const command = methodName.replace(/([A-Z])/g, '.$1').toLowerCase()
        return (...args: Parameters<SatoriMethods[typeof methodName]>) =>
          ipcRenderer.invoke(`satori:${command}`, { platform, selfId }, ...args)
      },
    }
    const key = { platform, selfId }
    if (!satoriMethodHandlers.has(key)) {
      satoriMethodHandlers.set(key, new Proxy<SatoriMethods>({} as SatoriMethods, handler))
    }
    return satoriMethodHandlers.get(key)!
  },
})
