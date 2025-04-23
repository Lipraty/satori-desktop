import { Context } from '@satoriapp/renderer'
import Chat from './chat.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/chat',
    name: 'chat',
    component: Chat,
  })
}
