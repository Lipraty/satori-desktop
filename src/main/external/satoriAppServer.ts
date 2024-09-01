import { } from '@satorijs/adapter-satori'
import { Session } from '@satorijs/core'
import { Event as SPMessage } from '@satorijs/protocol'
import { SatoriAdapter as AdapterSatori } from '@satorijs/adapter-satori'

import { Context, Service } from '@main'
import { SnowflakeService } from '@main/external/snowflakeService'
import { SatoriIpcApiFuncs } from '@shared/types'

import { } from './windowManager'
import { } from './ipcManager'
import { AppMessage } from './messageDatabase'

declare module '@main' {
  interface Context {
    sas: SatoriAppServer
  }
}

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

export namespace SatoriAppServer { }

export class SatoriAppServer extends Service {
  static inject = ['satori', 'ipc', 'snowflake']

  private lastAppMessageId = 0

  constructor(ctx: Context) {
    super(ctx, 'sas')

    

    //TODO Aoto load in network settings
    ctx.plugin(AdapterSatori, {
      endpoint: 'http://localhost:5500',
      token: '8f69490142b1da3ed0968e8658aa12af49a3774fc5c9ccc65f1b31b0cb152f3b'
    })
    ctx.on('internal/session', (session: Session) => {
      if (session.type.includes('message')) {
        ctx.ipc.send('chat/message', session.toJSON())
      }
    })
  }

  async start() {
    console.log('SatoriAppServer init')
  }

  async createAppMessage(message: SPMessage) {
    const id = this.ctx.snowflake()
    const messageId = message.message?.id
    if (!messageId) return
    const appMessage: AppMessage = {
      id,
      platfrom: message.platform,
      channel: message.channel!,
      messageId,
      timestamp: message.timestamp,
      next: 0,
      prev: 0,
      content: message.message!,
    }
  }
}
