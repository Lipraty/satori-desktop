import Schema from 'schemastery'

export interface WindowServiceConfig {
  theme: 'dark' | 'light' | 'system'
  width: number
  height: number
}

export const WindowConfigSchema: Schema<WindowServiceConfig> = Schema.object({
  theme: Schema.union(['dark', 'light', 'system']).default('system').description('主题模式'),
  width: Schema.number().step(1).default(1076).description('窗口宽度'),
  height: Schema.number().step(1).default(653).description('窗口高度'),
})

export interface RootConfig {
  window?: WindowServiceConfig
  locale?: string
  autoLaunch?: boolean
}

export const RootConfigSchema: Schema<RootConfig> = Schema.object({
  window: WindowConfigSchema,
  locale: Schema.string().default('zh-CN').description('应用语言'),
  autoLaunch: Schema.boolean().default(false).description('开机自启动'),
})
