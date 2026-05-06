import type { Context } from '@satoriapp/webui'
import Schema from 'schemastery'
import NetworkView from './network.vue'
import SettingsView from './settings.vue'

import 'element-plus/dist/index.css'

const GeneralSchema = Schema.object({
  locale: Schema.union(['zh-CN', 'en-US']).default('zh-CN').description('应用语言'),
}).description('通用')

const AppearanceSchema = Schema.object({
  theme: Schema.union(['light', 'dark']).default('dark').description('主题'),
  fontSize: Schema.union(['small', 'medium', 'large']).default('medium').description('字号'),
  sidebar: Schema.object({
    collapsed: Schema.boolean().default(false).description('折叠侧栏'),
    width: Schema.number().min(200).max(400).default(280).description('侧栏宽度'),
  }).description('侧栏'),
}).description('外观')

const MessageSchema = Schema.object({
  messageInput: Schema.object({
    sendKey: Schema.union(['Enter', 'Ctrl+Enter', 'Cmd+Enter']).default('Enter').description('发送键'),
  }).description('消息输入'),
}).description('消息')

export const inject: string[] = []

export function apply(ctx: Context) {
  ctx.client.setting.settings({ id: 'general', title: '通用', order: 1000, schema: GeneralSchema })
  ctx.client.setting.settings({ id: 'appearance', title: '外观', order: 1100, schema: AppearanceSchema })
  ctx.client.setting.settings({ id: 'message', title: '消息', order: 1200, schema: MessageSchema })

  ctx.client.router.page({
    path: '/network',
    name: 'Network',
    icon: 'PlugConnectedSettings',
    order: 3,
    component: NetworkView,
  })

  ctx.client.router.page({
    path: '/settings/:section?',
    name: 'Settings',
    icon: 'Settings',
    position: 'bottom',
    order: 1,
    component: SettingsView,
  })
}
