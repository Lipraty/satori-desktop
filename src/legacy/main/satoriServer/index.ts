import { } from '@minatojs/driver-sqlite'
import * as SP from '@satorijs/protocol'

import { Context, Service } from '@main'

import { } from '../external/windowManager'
import { } from '../external/ipcManager'
import { AppMessage } from '../external/messageDatabase'

declare module '@main/context' {
  interface Context {
    sas: SatoriAppServer
  }

  interface Tables {

  }
}

export const messageEventRule = ['message', 'message-*']

export const cachedEventRule = []

export class SatoriAppServer extends Service {
  static inject = ['satori', 'ipc', 'snowflake', 'database']

  constructor(ctx: Context) {
    super(ctx, 'sas')
    // ctx.model.extend('')
  }

  async start() {
    this.ctx.logger.info('SatoriAppServer started')
  }

  messageFomatter(message: AppMessage) {

  }
}

export namespace SatoriAppServer {
  export interface Contact { }

  export interface EventDatabase extends SP.Event {}

  export interface MessageEventDatabase extends SP.Message {}
}
