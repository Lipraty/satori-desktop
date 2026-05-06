import { defineComponent, h, VNode } from 'vue'
import { useContext } from '../context'
import { insert } from '../utils'
import type { SlotOptions } from '../plugins/router'

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
      // re-sort by order desc using insert helper for stability
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
