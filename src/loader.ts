import { Context, Plugin as CordisPlugin, ForkScope, Schema } from 'cordis'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Dict } from 'cosmokit'

/**
 * In production, the plugins are builded from the `PROD_PLUGINS` variable.
 */
declare const PROD_PLUGINS: Promise<Loader.Plugin[]>

declare module 'cordis' {
  interface Context {
    appDataDir: string
  }
  interface Events {
    'config/update': (config: Dict) => void
  }
}

export class Loader {
  static readonly name = 'loader'
  static readonly inject = ['app']

  private plugins: Loader.Plugin[] = []
  private configPath: string = ''
  private configSuspend = false

  scope: Map<string, ForkScope> = new Map()
  config: Record<string, any> = {}

  constructor(private ctx: Context) {
    this.configPath = resolve(resolve(ctx.app.getPath('userData')), 'config.json')
    ctx.on('ready', this.start.bind(this))
  }

  async start() {
    this.plugins = await this.loadPlugins()
    this.config = await this.readConfig()
    for (const { name, plugin, validate } of this.plugins) {
      const config = this.config[name]
      try {
        if (validate && validate(config) || !validate)
          await this.processPlugin(name, plugin, config)
      } catch (error) {
        this.ctx.logger.error('failed to load plugin %c: %c', name, error)
        continue
      }
    }
  }

  private async loadPlugins() {
    if (import.meta.env.DEV) {
      const internal = import.meta.glob<CordisPlugin>([
        './internal/*.ts',
        './internal/**/index.ts',
      ])
      const external = import.meta.glob<CordisPlugin>([
        './plugins/*.ts',
        './plugins/**/index.ts',
      ])
      const modules = { ...internal, ...external }
      const plugins: CordisPlugin[] = []
      for (const path in modules) {
        const module = await modules[path]()
        // @ts-ignore
        if (module?.default) plugins.push(module.default)
        // @ts-ignore
        else if (typeof module?.apply === 'function') plugins.push(module)
        else Object.values(module)
          .filter((plugin) => typeof plugin === 'function')
          .forEach(plugin => plugins.push(plugin as CordisPlugin))
      }
      return plugins.map(plugin => {
        const name = (plugin.name || plugin.constructor.name).replace(/Service$/, '').toLowerCase()
        const validate = plugin.Config && plugin.Config instanceof Schema ? plugin.Config : undefined
        const schema = validate ? this.reverseSchema(validate) : undefined
        return { name, schema, validate, plugin }
      })
    } else {
      return (await PROD_PLUGINS)
    }
  }

  private async processPlugin(name: string, plugin: CordisPlugin, config?: Dict) {
    this.ctx.logger.info(`apply plugin: %c`, name)
    const fork = this.ctx.plugin(plugin, config)
    this.scope.set(name, fork)
  }

  private reverseSchema(schema: Schema) {
    const { type, meta } = schema
    const result: Loader.SchemaRaw = { type, meta, children: {} }
    if (type === 'const') result.children = schema.value
    if (type === 'transform') result.children = this.reverseSchema(schema.inner!)
    if (type === 'object') {
      Object.keys(schema.dict!).forEach(key => {
        result.children[key] = this.reverseSchema(schema.dict![key])
      })
    } else if (['tuple', 'intersect', 'union'].includes(type)) {
      result.children = schema.list!.map(this.reverseSchema.bind(this))
    } else if (type === 'dict') {
      result.children = this.reverseSchema(schema.inner!)
    } else if (type === 'array') {
      result.children = this.reverseSchema(schema.inner!)
    } else if (['string', 'number', 'boolean'].includes(type)) {
      result.children = null
    }
    return result
  }

  private generateConfig(namespace: string, schema: Loader.SchemaRaw) {
    this.config[namespace] = {}
  }

  private async readConfig() {
    if (existsSync(this.configPath)) {
      const data = JSON.parse(await readFile(this.configPath, 'utf8')) as typeof this.config
      this.ctx.emit('config/update', data)
      return new Proxy(data, {
        get() { },
        set() {
          return true
        },
      })
    } else {
      this.ctx.logger('config').debug('config file not found, creating a new one')
      await this.writeConfig()
      return {}
    }
  }

  private async writeConfig() {
    if (this.configSuspend) return
    await writeFile(this.configPath, JSON.stringify(this.config, null, 2))
      .catch(error => this.ctx.logger('config').error('failed to write config', error))
    this.configSuspend = false
  }
}

export namespace Loader {
  export interface Plugin {
    name: string
    schema?: SchemaRaw
    validate?: Schema
    plugin: CordisPlugin
  }
  export type SchemaRaw = {
    type: Schema['type']
    meta: Schema['meta']
    children: SchemaRaw | any
  }
}

export default Loader
