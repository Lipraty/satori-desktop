import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import type {} from 'minato'

export const name = 'msgdb'
export const inject = ['database']

declare module 'minato' {
  interface Tables {
    message: AppMessage
  }
}

export function apply(ctx: Context) {
  ctx.model.extend('message', {
    uid: 'bigint(64)',
    seq: 'bigint(64)',
    platform: 'string',
    channelId: 'string',
    syncFlag: 'unsigned(2)',
    dead: 'boolean',
    localOnly: 'boolean',
    isEvent: 'boolean',
    eventType: 'string',
    eventId: 'string',
    id: 'string',
    content: 'string',
    elements: 'json',
    timestamp: 'integer(32)',
    createdAt: 'integer(32)',
    updatedAt: 'integer(32)',
  }, {
    autoInc: true,
    primary: 'uid',
  })
}
