import { Session } from '@satorijs/core'
import { Event as SPMessage } from '@satorijs/protocol'
import { SatoriAdapter as AdapterSatori } from '@satorijs/adapter-satori'
import { } from '@minatojs/driver-sqlite'

import { Context, Service } from '@main'
import { SatoriIpcApiFuncs } from '@shared/types'

import { } from './windowManager'
import { } from './ipcManager'
import { AppMessage } from './messageDatabase'

declare module '@main/context' {
  interface Context {
    sas: SatoriAppServer
  }
}


export namespace SatoriAppServer { }

export class SatoriAppServer extends Service {
  static inject = ['satori', 'ipc', 'snowflake', 'database']

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

  async createAppMessage(message: SPMessage): Promise<AppMessage | undefined> {
    const messageId = message.message?.id
    if (!messageId) return

    const id = this.ctx.snowflake()
    const { platform, timestamp } = message
    const channel = message.channel!
    return {
      id,
      platform,
      channel,
      messageId,
      timestamp,
      next: 0,
      prev: 0,
      content: message.message!,
    }
  }


}
