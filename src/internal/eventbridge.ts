import { Context, Events } from 'cordis'

declare module '@shared/ipc' {
  interface IpcEvents {
    'internal:event': (name: keyof Events<Context>, args: any[]) => void
  }
}

export const name = 'event-bridge'

export const inject = ['ipc']

export function apply(ctx: Context) {
  ctx.on('internal/event', (type, name, args) => {
    if (type === 'emit' && !name.startsWith('internal')) {
      console.log('eventBridge:', name)
      ctx.ipc.sendAll('internal:event', name as keyof Events<Context>, args)
    }
  })
}
