import type { Context } from '@satoriapp/webui'
import { Schema } from 'cordis'
import { AppSelfConfigSchema, MessagePluginConfigSchema } from './schema'
import SettingsView from './view.vue'

import 'element-plus/dist/index.css'

export const inject = ['link'] as const

export default function (ctx: Context) {
  ctx.settings({
    id: 'general',
    title: '通用设置',
    order: 1000,
    schema: Schema.object({
      plugins: Schema.object({
        app: AppSelfConfigSchema,
      }),
    }).description('通用设置'),
  })

  ctx.settings({
    id: 'message',
    title: '消息设置',
    order: 1100,
    schema: Schema.object({
      plugins: Schema.object({
        message: MessagePluginConfigSchema,
      }),
    }).description('消息设置'),
  })

  ctx.page({
    path: '/settings/:name?',
    name: 'Settings',
    icon: 'Settings',
    position: 'bottom',
    component: SettingsView,
  })
}
