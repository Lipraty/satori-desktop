import { } from '@satorijs/adapter-satori'
import { Session } from '@satorijs/core'

import { Context } from '@main'
import { SatoriIpcApiFuncs } from '@shared/types'

import { } from './windowManager'
import { } from './ipcManager'

export const satoriApi = [
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

export class SatoriAppServer {
  static inject = ['window', 'satori', 'ipc']

  constructor(ctx: Context) {
    ctx.on('internal/session', (session: Session) => {
      if(session.type.includes('message')){
        ctx.ipc.send('chat/message', session.toJSON())
      }
    })
  }
}
