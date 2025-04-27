import { Context } from '@satoriapp/renderer'
import MessageView from './view.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/',
    name: 'Message',
    component: MessageView,
    icon: 'ChatSparkle'
  })
}
