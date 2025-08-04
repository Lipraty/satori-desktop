import type { Context } from '@satoriapp/webui'

import NetworkView from './view.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/network',
    name: 'Network',
    icon: 'PlugConnectedSettings',
    component: NetworkView,
  })
}
