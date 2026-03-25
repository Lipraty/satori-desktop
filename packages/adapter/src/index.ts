import { Schema } from 'cordis'

export interface AdapterPluginConfig<T = Record<string, any>> {
  enabled: boolean
  config: T
}

export interface NetworkAdapterManifest<T = any> {
  packageName: string
  displayName: string
  description: string
  defaultEnabled: boolean
  configSchema: Schema<T>
  defaultConfig: T
}

export interface NetworkAdapterCatalogItem {
  packageName: string
  displayName: string
  description: string
}

export interface SatoriAdapterConfig {
  endpoint: string
  token: string
  retry: number
}

export const SatoriAdapterConfigSchema: Schema<SatoriAdapterConfig> = Schema.object({
  endpoint: Schema.string().default('').description('Adapter endpoint 地址'),
  token: Schema.string().default('').description('访问 token'),
  retry: Schema.number().default(3).description('失败重试次数'),
})

export const NETWORK_ADAPTER_CATALOG: NetworkAdapterCatalogItem[] = [
  {
    packageName: '@satorijs/adapter-satori',
    displayName: 'Satori',
    description: 'Satori 协议 adapter。',
  },
  {
    packageName: '@satorijs/adapter-discord',
    displayName: 'Discord',
    description: 'Discord adapter。',
  },
  {
    packageName: '@satorijs/adapter-dingtalk',
    displayName: 'DingTalk',
    description: 'DingTalk（钉钉）adapter。',
  },
  {
    packageName: '@satorijs/adapter-kook',
    displayName: 'KOOK',
    description: 'KOOK（开黑啦）adapter。',
  },
  {
    packageName: '@satorijs/adapter-lark',
    displayName: 'Lark',
    description: 'Lark（飞书）adapter。',
  },
  {
    packageName: '@satorijs/adapter-line',
    displayName: 'LINE',
    description: 'LINE adapter。',
  },
  {
    packageName: '@satorijs/adapter-mail',
    displayName: 'Mail',
    description: 'Mail adapter。',
  },
  {
    packageName: '@satorijs/adapter-matrix',
    displayName: 'Matrix',
    description: 'Matrix adapter。',
  },
  {
    packageName: '@satorijs/adapter-qq',
    displayName: 'QQ',
    description: 'QQ / QQ Guild adapter。',
  },
  {
    packageName: '@satorijs/adapter-slack',
    displayName: 'Slack',
    description: 'Slack adapter。',
  },
  {
    packageName: '@satorijs/adapter-telegram',
    displayName: 'Telegram',
    description: 'Telegram adapter。',
  },
  {
    packageName: '@satorijs/adapter-wechat-official',
    displayName: 'Wechat Official',
    description: 'Wechat Official（微信公众号）adapter。',
  },
  {
    packageName: '@satorijs/adapter-wecom',
    displayName: 'Wecom',
    description: 'Wecom（企业微信）adapter。',
  },
  {
    packageName: '@satorijs/adapter-whatsapp',
    displayName: 'WhatsApp',
    description: 'WhatsApp adapter。',
  },
  {
    packageName: '@satorijs/adapter-zulip',
    displayName: 'Zulip',
    description: 'Zulip adapter。',
  },
]

export const NETWORK_ADAPTER_MANIFESTS: NetworkAdapterManifest[] = [
  {
    packageName: '@satorijs/adapter-satori',
    displayName: 'Satori',
    description: 'Satori 协议 adapter。',
    defaultEnabled: false,
    configSchema: SatoriAdapterConfigSchema,
    defaultConfig: {
      endpoint: 'http://127.0.0.1:5500',
      token: '',
      retry: 3,
    },
  },
]

function createAdapterPluginSchema<T extends Record<string, any>>(inner: Schema<T>): Schema<AdapterPluginConfig<T>> {
  return Schema.object({
    enabled: Schema.boolean().default(false).description('是否启用该 adapter 插件'),
    config: inner,
  }) as Schema<AdapterPluginConfig<T>>
}

const networkSchemaEntries = Object.fromEntries(
  NETWORK_ADAPTER_MANIFESTS.map(item => [
    item.packageName,
    createAdapterPluginSchema(item.configSchema).default({
      enabled: item.defaultEnabled,
      config: item.defaultConfig,
    }),
  ]),
) as Record<string, any>

export type NetworkPluginConfig = Record<string, AdapterPluginConfig>

export const NetworkPluginConfigSchema: Schema<NetworkPluginConfig> = Schema.object(networkSchemaEntries) as Schema<NetworkPluginConfig>
export const NetworkPluginConfigDefault = new NetworkPluginConfigSchema() as NetworkPluginConfig

export interface NetworkPageConfig {
  adapters: NetworkPluginConfig
}

export const NetworkPageConfigSchema: Schema<NetworkPageConfig> = Schema.object({
  adapters: NetworkPluginConfigSchema.default(NetworkPluginConfigDefault),
}) as Schema<NetworkPageConfig>

export function getNetworkAdapterManifest(packageName: string): NetworkAdapterManifest | undefined {
  return NETWORK_ADAPTER_MANIFESTS.find(item => item.packageName === packageName)
}

export function isConfigurableNetworkAdapter(packageName: string): boolean {
  return NETWORK_ADAPTER_MANIFESTS.some(item => item.packageName === packageName)
}
