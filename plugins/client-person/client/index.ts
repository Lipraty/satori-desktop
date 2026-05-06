import type { Context } from '@satoriapp/webui'
import PersonView from './view.vue'

export const inject: string[] = []

export function apply(ctx: Context) {
  ctx.client.router.page({
    path: '/person',
    name: 'Person',
    icon: 'Person',
    order: 2,
    component: PersonView,
  })
}
