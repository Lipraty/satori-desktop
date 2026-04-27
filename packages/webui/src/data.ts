import { Service } from 'cordis'
import type { Context } from 'cordis'
import { computed, shallowReactive } from 'vue'
import type { ComputedRef } from 'vue'

export const store: Record<string, unknown> = shallowReactive({})

export function useData<T>(key: string): ComputedRef<T | undefined> {
  return computed(() => store[key] as T | undefined)
}

export abstract class DataService<T> extends Service {
  static readonly inject = ['link']

  constructor(ctx: Context, readonly key: string) {
    super(ctx, `data:${key}`, true)
  }

  abstract get(): T | Promise<T>

  async refresh(): Promise<void> {
    this.ctx.emit('link/send', `data:${this.key}`, await this.get())
  }

  patch(value: Partial<T>): void {
    this.ctx.emit('link/send', `data:${this.key}.patch`, value)
  }

  protected async start(): Promise<void> {
    ;(this.ctx as any).link.action(`data:${this.key}.get`, () => this.get())
  }
}
