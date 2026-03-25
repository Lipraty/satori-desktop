import { Schema } from 'cordis'

export interface AppSelfConfig {
  locale: string
  theme: 'light' | 'dark' | 'system'
  autoLaunch: boolean
}

export interface MessagePluginConfig {
  compactMode: boolean
  previewLimit: number
}

export interface SettingsPluginConfig {
  app: AppSelfConfig
  message: MessagePluginConfig
}

export interface SettingsPageConfig {
  plugins: SettingsPluginConfig
}

export const AppSelfConfigSchema = Schema.object({
  locale: Schema.string().default('zh-CN').description('应用语言'),
  theme: Schema.union(['light', 'dark', 'system']).default('system').description('主题模式'),
  autoLaunch: Schema.boolean().default(false).description('开机自启动'),
})

export const MessagePluginConfigSchema = Schema.object({
  compactMode: Schema.boolean().default(false).description('消息紧凑模式'),
  previewLimit: Schema.number().default(50).description('消息预览条数'),
})

export const SettingsPluginConfigSchema = Schema.object({
  app: AppSelfConfigSchema.default({
    locale: 'zh-CN',
    theme: 'system',
    autoLaunch: false,
  }),
  message: MessagePluginConfigSchema.default({
    compactMode: false,
    previewLimit: 50,
  }),
})

export const SettingsPluginConfigDefault = new SettingsPluginConfigSchema() as SettingsPluginConfig

export const SettingsPageConfigSchema = Schema.object({
  plugins: SettingsPluginConfigSchema.default({
    app: {
      locale: 'zh-CN',
      theme: 'system',
      autoLaunch: false,
    },
    message: {
      compactMode: false,
      previewLimit: 50,
    },
  }),
})
