import type { Context, Events as MainEvents } from '.'
import type { } from './ipc'

declare module '@satoriapp/common' {
  interface IpcEvents {
    'internal:event': (name: keyof MainEvents<Context>, args: any[]) => void
  }
}

export const name = 'event-bridge'

export const inject = ['ipc', 'window']

export function apply(ctx: Context) {
  ctx.on('internal/event', (type, name, args) => {
    if (type === 'emit' && !name.startsWith('internal')) {
      console.log('sending event', name)
      ctx.ipc.sendAll('internal:event', name as keyof MainEvents<Context>, args)
    }
  })
}
