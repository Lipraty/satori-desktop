import { Session } from '@satorijs/core'
import * as SaroriProtocol from '@satorijs/protocol'
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

export const messageEventRule = ['message', 'message-*']

export const cachedEventRule = []

export namespace SatoriAppServer { }

export class SatoriAppServer extends Service {
  static inject = ['satori', 'ipc', 'snowflake', 'database']

  constructor(ctx: Context) {
    super(ctx, 'sas')
  }

  async start() {
    this.ctx.logger.info('SatoriAppServer started')
  }

  messageFomatter(message: AppMessage) {
    
  }
}
