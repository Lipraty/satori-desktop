import type { AppMessage } from '@satoriapp/plugin-message'
import type { Context } from 'cordis'
import type {} from 'minato' // module augmentation

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

  ctx.on('message/created', async (message: AppMessage) => {
    try {
      await ctx.database.upsert('message', [{
        seq: message.seq,
        platform: message.platform,
        channelId: message.channelId,
        syncFlag: message.syncFlag,
        dead: message.dead,
        localOnly: message.localOnly,
        isEvent: message.isEvent,
        eventType: message.eventType,
        eventId: message.eventId,
        id: message.id,
        content: message.content,
        elements: message.elements,
        timestamp: message.timestamp ?? message.createdAt,
        createdAt: message.createdAt,
        updatedAt: Date.now(),
      }])
      ctx.emit('message/persisted', message.seq)
    }
    catch (error) {
      ctx.logger('msgdb').warn('persist-message failed: %s', error instanceof Error ? error.message : String(error))
    }
  })

  ctx.on('message/dead', async (seq: bigint, dead: boolean) => {
    try {
      await ctx.database.set('message', { seq }, { dead, updatedAt: Date.now() })
    }
    catch (error) {
      ctx.logger('msgdb').warn('persist-dead failed: %s', error instanceof Error ? error.message : String(error))
    }
  })
}
