import type { Context } from '@satoriapp/webui'
import MessageView from './view.vue'

export const inject = [] as const

export default function (ctx: Context) {
  ctx.page({
    path: '/',
    name: 'Message',
    icon: 'ChatSparkle',
    component: MessageView,
  })
}
