import type { Component } from 'vue'
import type { Context } from '@satoriapp/webui'
import { Service } from 'cordis'
import { markRaw, reactive } from 'vue'

declare module '@satoriapp/webui' {
  interface Context {
    $slot: SlotService
    slot: SlotService['slot']
  }
}

export interface SlotItem {
  type: string
  component: Component
  order?: number
}

export default class SlotService extends Service<never, Context> {
  readonly slots = reactive<Record<string, SlotItem[]>>({})

  constructor(ctx: Context) {
    super(ctx, '$slot', true)
    ctx.mixin('$slot', ['slot'])
  }

  slot(options: SlotItem): () => void {
    const item: SlotItem = { ...options, component: markRaw(options.component) }
    return this.ctx.effect(() => {
      const list = (this.slots[options.type] ??= [])
      const order = item.order ?? 0
      const idx = list.findIndex(i => (i.order ?? 0) > order)
      if (idx < 0)
        list.push(item)
      else
        list.splice(idx, 0, item)

      return () => {
        const i = list.indexOf(item)
        if (i >= 0)
          list.splice(i, 1)
        if (!list.length)
          delete this.slots[options.type]
      }
    })
  }
}
