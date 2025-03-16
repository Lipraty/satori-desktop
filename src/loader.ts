import { Context, Plugin } from 'cordis'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Dict } from 'cosmokit'

/**
 * In production, the plugins are builded from the `PROD_PLUGINS` variable.
 */
declare const PROD_PLUGINS: Promise<Plugin[]>

declare module 'cordis' {
  interface Context {
    appDataDir: string
  }
  interface Events {
    'loader/update': (path: string) => void
  }
}

export class Loader {
  static readonly name = 'loader'
  static readonly inject = ['app']

  private plugins: Plugin[] = []
  private configPath: string = ''

  config: Dict = {}

  constructor(private ctx: Context) {
    this.configPath = resolve(resolve(ctx.app.getPath('userData')), 'config.json')
    this.readConfig()
    ctx.on('ready', this.start.bind(this))
  }

  async start() {
    if (import.meta.env.DEV) {
      const modules = import.meta.glob<Plugin>([
        './internal/*.ts',
        './internal/**/*.ts',
      ])

      for (const path in modules) {
        const module = await modules[path]()
        // 
        // @ts-ignore
        if (module?.default?.default) this.plugins.push(module?.default?.default)
        // @ts-ignore
        else if (module?.default) this.plugins.push(module?.default)
        else if (module?.apply) this.plugins.push(module)
        else {
          const name = path.split('/').pop()?.replace('.ts', '') ?? 'Unknown'
          this.ctx.logger.error(`incorrect plugin: ${name}. expected a default export or an apply function`)
        }
        this.ctx.emit('loader/update', path)
      }
    } else {
      this.plugins = await PROD_PLUGINS
    }

    for (const plugin of this.plugins) {
      const name = plugin.name ?? plugin.constructor.name ?? 'Unknown'
      if (name !== 'Object') {
        this.ctx.logger.info(`apply plugin: %c`, name)
      }
      const config = this.config[name] ?? {}
      try {
        this.ctx.plugin(plugin, config)
      } catch (error) {
        this.ctx.logger.error(`failed to load plugin: ${name}`, error)
        continue
      }
    }
  }

  private async readConfig() {
    if (existsSync(this.configPath)) {
      this.config = JSON.parse(await readFile(this.configPath, 'utf8'))
    } else {
      await this.writeConfig()
    }
  }

  private async writeConfig() {
    await writeFile(this.configPath, JSON.stringify(this.config, null, 2))
  }

  async pushConfig(plugin: string, config: Dict) {
    this.config[plugin] = config
    await this.writeConfig()
    this.ctx.logger('config').debug(`updated config for plugin: %c`, plugin)
  }
}

export default Loader
