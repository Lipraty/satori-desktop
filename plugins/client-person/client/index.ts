import type { Context } from '@satoriapp/webui'
import PersonView from './view.vue'

export const inject = [] as const

export default function (ctx: Context) {
  ctx.page({
    path: '/person',
    name: 'Person',
    icon: 'Person',
    component: PersonView,
  })
}
