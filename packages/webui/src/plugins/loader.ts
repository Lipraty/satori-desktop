import type { Context } from '@satoriapp/webui'
import { Service } from 'cordis'
import { store } from '../data'

declare module '@satoriapp/webui' {
  interface Context {
    $loader: LoaderService
    addEntry: LoaderService['addEntry']
  }
}

export default class LoaderService extends Service<never, Context> {
  constructor(ctx: Context) {
    super(ctx, '$loader', true)
    ctx.mixin('$loader', ['addEntry'])
  }

  addEntry(key: string): () => void {
    return this.ctx.effect(() => {
      const disposers: Array<() => void> = []

      disposers.push(
        this.ctx.link.on(`data:${key}`, (value: unknown) => {
          store[key] = value
        }),
      )

      disposers.push(
        this.ctx.link.on(`data:${key}.patch`, (patch: Record<string, unknown>) => {
          if (store[key] && typeof store[key] === 'object') {
            store[key] = { ...(store[key] as Record<string, unknown>), ...patch }
          }
        }),
      )

      void this.ctx.link.action<unknown>(`data:${key}.get`)
        .then((value) => { store[key] = value })
        .catch(() => {})

      return () => {
        for (const d of disposers) d()
        delete store[key]
      }
    })
  }
}
