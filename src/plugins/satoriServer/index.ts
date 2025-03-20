import { Context } from "cordis"
import type { } from '@satorijs/adapter-satori'
import type { } from '../../internal/ipc'

export const name = 'satori-server'

export const inject = ['satori', 'ipc']

export function apply(ctx: Context) {
  ctx.on('internal/session', async (session) => {
    if (session.type.includes('message')) {
      ctx.ipc.sendAll('satori:message', session.toJSON())
    }
  })
}
