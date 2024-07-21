import { Element, Session } from "@satorijs/core"
import { Channel, Command, Direction, Guild, GuildMember, GuildRole, List, Login, Message, Order, SendOptions, TwoWayList, User, Upload, MessageLike } from "@satorijs/protocol"

export enum OS {
  WINDOWS = 'windows',
  MAC = 'mac',
  LINUX = 'linux',
}

export namespace Contact {
  export enum Type {
    TEXT,
    DIRECT,
    CATEGORY,
    VOICE,
    GUILD
  }
}

export interface SatoriIpcApiFuncs {
  // message
  createMessage: (channelId: string, content: Element.Fragment, guildId?: string, options?: SendOptions) => Promise<Message[]>
  sendMessage: (channelId: string, content: Element.Fragment, guildId?: string, options?: SendOptions) => Promise<string[]>
  sendPrivateMessage: (userId: string, content: Element.Fragment, guildId?: string, options?: SendOptions) => Promise<string[]>
  getMessage: (channelId: string, messageId: string) => Promise<Message>
  getMessageList: (channelId: string, next?: string, direction?: Direction, limit?: number, order?: Order) => Promise<TwoWayList<Message>>
  getMessageIter: (channelId: string) => AsyncIterable<Message>
  editMessage: (channelId: string, messageId: string, content: Element.Fragment) => Promise<void>
  deleteMessage: (channelId: string, messageId: string) => Promise<void>

  // reaction
  createReaction: (channelId: string, messageId: string, emoji: string) => Promise<void>
  deleteReaction: (channelId: string, messageId: string, emoji: string, userId?: string) => Promise<void>
  clearReaction: (channelId: string, messageId: string, emoji?: string) => Promise<void>
  getReactionList: (channelId: string, messageId: string, emoji: string, next?: string) => Promise<List<User>>
  getReactionIter: (channelId: string, messageId: string, emoji: string) => AsyncIterable<User>

  // upload
  createUpload: (...uploads: Upload[]) => Promise<string[]>

  // user
  getLogin: () => Promise<Login>
  getUser: (userId: string, guildId?: string) => Promise<User>
  getFriendList: (next?: string) => Promise<List<User>>
  getFriendIter(): AsyncIterable<User>
  deleteFriend: (userId: string) => Promise<void>

  // guild
  getGuild: (guildId: string) => Promise<Guild>
  getGuildList: (next?: string) => Promise<List<Guild>>
  getGuildIter: () => AsyncIterable<Guild>

  // guild member
  getGuildMember: (guildId: string, userId: string) => Promise<GuildMember>
  getGuildMemberList: (guildId: string, next?: string) => Promise<List<GuildMember>>
  getGuildMemberIter: (guildId: string) => AsyncIterable<GuildMember>
  kickGuildMember: (guildId: string, userId: string, permanent?: boolean) => Promise<void>
  muteGuildMember: (guildId: string, userId: string, duration: number, reason?: string) => Promise<void>

  // role
  setGuildMemberRole: (guildId: string, userId: string, roleId: string) => Promise<void>
  unsetGuildMemberRole: (guildId: string, userId: string, roleId: string) => Promise<void>
  getGuildRoleList: (guildId: string, next?: string) => Promise<List<GuildRole>>
  getGuildRoleIter: (guildId: string) => AsyncIterable<GuildRole>
  createGuildRole: (guildId: string, data: Partial<GuildRole>) => Promise<GuildRole>
  updateGuildRole: (guildId: string, roleId: string, data: Partial<GuildRole>) => Promise<void>
  deleteGuildRole: (guildId: string, roleId: string) => Promise<void>

  // channel
  getChannel: (channelId: string, guildId?: string) => Promise<Channel>
  getChannelList: (guildId: string, next?: string) => Promise<List<Channel>>
  getChannelIter: (guildId: string) => AsyncIterable<Channel>
  createDirectChannel: (userId: string, guildId?: string) => Promise<Channel>
  createChannel: (guildId: string, data: Partial<Channel>) => Promise<Channel>
  updateChannel: (channelId: string, data: Partial<Channel>) => Promise<void>
  deleteChannel: (channelId: string) => Promise<void>
  muteChannel: (channelId: string, guildId?: string, enable?: boolean) => Promise<void>

  // request
  handleFriendRequest: (messageId: string, approve: boolean, comment?: string) => Promise<void>
  handleGuildRequest: (messageId: string, approve: boolean, comment?: string) => Promise<void>
  handleGuildMemberRequest: (messageId: string, approve: boolean, comment?: string) => Promise<void>

  // commands
  updateCommands: (commands: Command[]) => Promise<void>
}

export interface IpcEvents extends SatoriIpcApiFuncs {
  'chat/session': (session: Session) => void
  'chat/message': (message: MessageLike) => void
}
