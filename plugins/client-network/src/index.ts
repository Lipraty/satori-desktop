import type { ElectronLoader, LoaderHealth } from '@satoriapp/electron-loader'
import type { Context } from 'cordis'
import { Service } from 'cordis'

const CORE_PLUGINS = new Set(['satori', 'http', 'server', 'link', 'app-server', 'state', 'msgdb', 'resource-store', 'message'])

declare module 'cordis' {
  interface Context {
    clientNetwork: ClientNetworkService
    loaderRuntime: ElectronLoader<Context>
  }
}

export class ClientNetworkService extends Service {
  static readonly inject = ['link', 'loaderRuntime']

  private readonly routeDisposers: Array<() => void> = []

  constructor(ctx: Context) {
    super(ctx, 'clientNetwork', true)
  }

  async start() {
    const link = (this.ctx as any).link
    const loader = this.ctx.loaderRuntime

    this.routeDisposers.push(link.action('network.get', () => {
      const saved = loader.getPluginsConfig()
      const adapters: Record<string, { enabled: boolean, config: Record<string, any> }> = {}
      for (const entry of loader.list()) {
        if (!entry.plugin.name.startsWith('adapter-'))
          continue
        const pkg = entry.packageName || entry.plugin.name
        adapters[pkg] = {
          enabled: entry.health.state === 'active',
          config: (saved[entry.name] || {}) as Record<string, any>,
        }
      }
      return { config: { adapters } }
    }))

    this.routeDisposers.push(link.action('network.set', async (payload: {
      adapters?: Record<string, { enabled?: boolean, config?: Record<string, any> }>
    } = {}) => {
      const adapterEntries = loader.list().filter(e => e.plugin.name.startsWith('adapter-'))
      const patches: Record<string, any> = {}

      for (const [pkgName, item] of Object.entries(payload.adapters || {})) {
        const entry = adapterEntries.find(e => e.packageName === pkgName)
        if (!entry)
          continue
        if (item.enabled && item.config?.endpoint) {
          await loader.reload(entry.name, item.config)
        }
        else if (item.enabled === false) {
          await loader.stop(entry.name)
        }
        const configData: Record<string, unknown> = item.config ? { ...item.config } : {}
        if (!item.enabled)
          configData.$disabled = true
        else
          delete configData.$disabled
        patches[entry.name] = configData
      }

      await loader.patchPluginsConfig(patches)
      return { ok: true, savedAt: Date.now() }
    }))

    this.routeDisposers.push(link.action('loader.list', () => {
      const plugins = loader.list()
        .filter(e => !CORE_PLUGINS.has(e.plugin.name))
        .map(e => ({
          name: e.name,
          pluginName: e.plugin.name,
          packageName: e.packageName,
          source: e.source,
          health: e.health as LoaderHealth,
          enabled: e.health.state === 'active',
        }))
      return { plugins }
    }))

    this.routeDisposers.push(link.action('loader.toggle', async (payload: {
      name?: string
      enabled?: boolean
    } = {}) => {
      if (!payload.name)
        return { error: { code: 'EBADREQ', message: 'name is required' } }

      const entry = loader.resolve(payload.name)
      if (!entry)
        return { error: { code: 'ENOENT', message: `plugin not found: ${payload.name}` } }

      if (payload.enabled) {
        await loader.start(payload.name)
      }
      else {
        await loader.stop(payload.name)
      }

      const currentConfig = (entry.config as Record<string, any>) ?? {}
      const saved: Record<string, any> = { ...currentConfig }
      if (!payload.enabled)
        saved.$disabled = true
      else
        delete saved.$disabled
      await loader.patchPluginsConfig({ [payload.name]: saved })

      return { ok: true, name: payload.name, enabled: payload.enabled, savedAt: Date.now() }
    }))

    this.logger.info('client-network routes registered (%d routes)', this.routeDisposers.length)
  }

  async stop() {
    while (this.routeDisposers.length) {
      this.routeDisposers.pop()?.()
    }
  }
}

export const name = 'client-network'
export default ClientNetworkService
