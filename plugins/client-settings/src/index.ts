import type { AppNamespaceState } from '@satoriapp/state'
import type { Context } from 'cordis'
import { Service } from 'cordis'

const DEFAULT_SETTINGS_PLUGIN_CONFIG = {
  plugins: {
    'app': {
      locale: 'zh-CN',
      theme: 'system',
      autoLaunch: false,
    },
    '@satoriapp/plugin-message': {
      compactMode: false,
      previewLimit: 50,
    },
  },
}

declare module 'cordis' {
  interface Context {
    clientSettings: ClientSettingsService
  }
}

export class ClientSettingsService extends Service {
  static readonly inject = ['link', 'stater']

  private readonly routeDisposers: Array<() => void> = []

  constructor(ctx: Context) {
    super(ctx, 'clientSettings', true)
  }

  async start() {
    const link = (this.ctx as any).link

    this.routeDisposers.push(link.action('settings.get', () => {
      const appNs = (this.ctx as any).stater.snapshot().app as AppNamespaceState & { pluginConfigs?: { settings?: unknown } }
      return {
        config: appNs?.pluginConfigs?.settings ?? DEFAULT_SETTINGS_PLUGIN_CONFIG,
      }
    }))

    this.routeDisposers.push(link.action('settings.set', (payload: unknown = {}) => {
      const snap = (this.ctx as any).stater.snapshot().app as AppNamespaceState & { pluginConfigs?: Record<string, unknown> }
      ;((this.ctx as any).stater.app as AppNamespaceState & { pluginConfigs: Record<string, unknown> }).pluginConfigs = {
        ...snap?.pluginConfigs,
        settings: payload,
      }
      return { ok: true, savedAt: Date.now() }
    }))

    this.logger.info('client-settings routes registered (%d routes)', this.routeDisposers.length)
  }

  async stop() {
    while (this.routeDisposers.length) {
      this.routeDisposers.pop()?.()
    }
  }
}

export const name = 'client-settings'
export default ClientSettingsService
