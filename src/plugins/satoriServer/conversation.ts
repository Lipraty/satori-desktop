import { Context } from 'cordis'
import { } from '@internal/database'
import { Conversation } from './types'

declare module '@internal/database' {
  interface Tables {
    conversation: Conversation
  }
}

export class SatoriAppContact {
  static readonly inject = ['database', 'ipc']

  private contactCache: Map<string, Conversation> = new Map()

  constructor(ctx: Context) {
    // @ts-ignore
    ctx.model.extend('conversation', {
      id: 'string',
      type: 'string',
      unread: 'number',
      flags: 'number',
      draft: 'string',
    })
  }
}
