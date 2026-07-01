import type { App } from 'vue'
import { defineComponent, h } from 'vue'
import { RouterLink } from 'vue-router'
import { useContext } from '../context'

const KActivityLink = defineComponent({
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props, { slots }) {
    const ctx = useContext()
    return () => {
      const activity = ctx.client.router.pages[props.id]
      return h(RouterLink, {
        to: ctx.client.router.cache[activity?.id] || activity?.path.replace(/:.+/, ''),
      }, {
        default: () => slots.default?.() ?? activity?.name,
      })
    }
  },
})

export default (app: App) => {
  app.component('k-activity-link', KActivityLink)
}
