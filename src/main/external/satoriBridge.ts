import { } from '@satorijs/adapter-satori'
import { Session } from '@satorijs/core'
import { SendOptions } from '@satorijs/protocol'

import { Context, Events } from '@main'
import { IpcEvents, SatoriIpcApiFuncs } from '@shared/types'

import { } from './windowManager'
import { } from './ipcManager'

const satoriApi: (keyof SatoriIpcApiFuncs)[] = [
  // message
  'createMessage',
  'sendMessage',
  'sendPrivateMessage',
  'getMessage',
  'getMessageList',
  'getMessageIter',
  'editMessage',
  'deleteMessage',
  // reaction
  'createReaction',
  'deleteReaction',
  'clearReaction',
  'getReactionList',
  'getReactionIter',
  // upload
  'createUpload',
  // user
  'getLogin',
  'getUser',
  'handleFriendRequest',
  'handleGuildMemberRequest',
  // guild
  'getGuild',
  'getGuildList',
  'getGuildIter',
  // guild member
  'getGuildMember',
  'getGuildMemberList',
  'getGuildMemberIter',
  // role
  'setGuildMemberRole',
  'unsetGuildMemberRole',
  'getGuildRoleList',
  'getGuildRoleIter',
  'createGuildRole',
  'updateGuildRole',
  'deleteGuildRole',
  // channel
  'getChannel',
  'getChannelList',
  'getChannelIter',
  'createDirectChannel',
  'createChannel',
  'updateChannel',
  'deleteChannel',
  'muteChannel',
  // request
  'handleFriendRequest',
  'handleGuildRequest',
  'handleGuildMemberRequest',
  // commands
  'updateCommands',
]

const satoriEvents: (keyof Events)[] = [
  'message',
  'message-created',
  'message-deleted',
  'message-pinned',
  'message-unpinned',
  'message-updated',
  'guild-added',
  'guild-removed',
  'guild-updated',
  'guild-member-added',
  'guild-member-removed',
  'guild-member-updated',
  'guild-role-created',
  'guild-role-deleted',
  'guild-role-updated',
  'reaction-added',
  'reaction-removed',
  'login-added',
  'login-removed',
  'login-updated',
  'friend-request',
  'guild-request',
  'guild-member-request',
  'interaction/command',
  'interaction/button',
  'internal/session',
  'before-send',
  'send',
]

export interface SatoriBridge extends SatoriIpcApiFuncs { }

export class SatoriBridge {
  static inject = ['window', 'satori', 'ipc']

  constructor(ctx: Context) {
    satoriEvents.forEach(event => {
      ctx.on(event, (session: Session, options: SendOptions) => {
        if (options)
          ctx.ipc.send(`chat/${event}` as keyof IpcEvents, session, options)
        else
          ctx.ipc.send(`chat/${event}` as keyof IpcEvents, session)
      })
    })

    
  }
}
