import type { Context } from '@satoriapp/webui'
import NetworkView from './view.vue'

export const inject = ['link'] as const

export default function (ctx: Context) {
  ctx.page({
    path: '/network',
    name: 'Network',
    icon: 'PlugConnectedSettings',
    component: NetworkView,
  })
}
