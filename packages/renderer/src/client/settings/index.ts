import { Context } from '@satoriapp/renderer'
import SettingsView from './view.vue'

export default function (ctx: Context) {
  ctx.page({
    path: '/settings',
    name: 'Settings',
    icon: 'Settings',
    position: 'bottom',
    component: SettingsView,
  })
}
