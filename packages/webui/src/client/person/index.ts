import { Context } from '@satoriapp/renderer'

import PersonView from './view.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/person',
    name: 'Person',
    icon: 'Person',
    component: PersonView,
  })
}
