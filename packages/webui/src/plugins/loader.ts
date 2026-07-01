import type { Context } from 'cordis'
import { Service } from 'cordis'
import { defineProperty } from 'cosmokit'
import type { Ref } from 'vue'
import { reactive } from 'vue'
import { store } from '../data'
import type {} from '@satoriapp/link'

export interface LoadState {
  data: Ref
}

export default class LoaderService {
  public initTask: Promise<void>
  public state = reactive<{ ready: boolean }>({ ready: false })

  constructor(public ctx: Context) {
    defineProperty(this, Service.tracker, { property: 'ctx' })
    this.initTask = Promise.resolve().then(() => {
      this.state.ready = true
    })
  }

  addEntry(key: string): () => void {
    return this.ctx.effect(() => {
      const link = this.ctx.link
      const disposers: Array<() => void> = []

      disposers.push(
        link.on(`data:${key}`, (value: unknown) => {
          store[key] = value
        }),
      )

      disposers.push(
        link.on(`data:${key}.patch`, (patch: Record<string, unknown>) => {
          if (store[key] && typeof store[key] === 'object') {
            store[key] = { ...(store[key] as Record<string, unknown>), ...patch }
          }
        }),
      )

      void link.action(`data:${key}.get`)
        .then((value: unknown) => { store[key] = value })
        .catch(() => {})

      return () => {
        for (const d of disposers) d()
        delete store[key]
      }
    })
  }
}
