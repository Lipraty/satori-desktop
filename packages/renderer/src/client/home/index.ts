import { Context } from '@satoriapp/renderer'
import Home from './home.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/',
    name: 'home',
    component: Home,
  })
}
