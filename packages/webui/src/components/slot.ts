import type { App, Component, DefineComponent, VNode } from 'vue'
import { defineComponent, h } from 'vue'
import { useContext } from '../context'
import { insert } from '../utils'

export interface SlotItem {
  order?: number
  component: Component | DefineComponent
}

export interface SlotOptions extends SlotItem {
  type: string
  /** @deprecated */
  when?: () => boolean
  disabled?: () => boolean
}

export const KSlotItem = defineComponent({
  props: {
    order: Number,
  },
  setup(_props, { slots }) {
    return () => slots.default?.()
  },
})

interface SlotEntry {
  node: VNode
  order: number
  layer?: number
}

export const KSlot = defineComponent({
  props: {
    name: { type: String, required: true },
    data: Object,
    single: Boolean,
  },
  setup(props, { slots }) {
    const ctx = useContext()
    return () => {
      const internal: SlotEntry[] = props.single
        ? []
        : [...(slots.default?.() || [])]
            .filter((node): node is VNode => (node as VNode).type === KSlotItem)
            .map((node) => {
              const propsAny = node.props as { order?: number } | null
              return { node, order: propsAny?.order ?? 0 }
            })
      const views = (ctx.client.router.views[props.name] as SlotOptions[] | undefined) ?? []
      const external: SlotEntry[] = views
        .filter(item => !item.disabled?.())
        .map(item => ({
          node: h(item.component!, { ...props.data }, slots),
          order: item.order ?? 0,
          layer: 1,
        }))
      const merged = [...internal, ...external]
      const ordered: SlotEntry[] = []
      for (const item of merged) insert(ordered, item)
      ordered.reverse()
      if (props.single) {
        return ordered[0]?.node || slots.default?.()
      }
      return ordered.map(item => item.node)
    }
  },
})

function defineSlotComponent(name: string) {
  return defineComponent({
    inheritAttrs: false,
    setup(_, { slots, attrs }) {
      return () => h(KSlot, { name, data: attrs, single: true }, slots)
    },
  })
}

export default (app: App) => {
  app.component('k-slot', KSlot)
  app.component('k-slot-item', KSlotItem)
  app.component('k-layout', defineSlotComponent('layout'))
  app.component('k-status', defineSlotComponent('status'))
}
