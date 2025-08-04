import type { Context } from '@satoriapp/webui'

import MessageView from './view.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/',
    name: 'Message',
    component: MessageView,
    icon: 'ChatSparkle',
  })
}
