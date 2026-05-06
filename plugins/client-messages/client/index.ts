import type { Context } from '@satoriapp/webui'
import MessageView from './view.vue'

export const inject = ['link']

export function apply(ctx: Context) {
  ctx.client.router.page({
    path: '/',
    name: 'Message',
    icon: 'ChatSparkle',
    order: 1,
    component: MessageView,
  })
}
