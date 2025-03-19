import { Context, Plugin as CordisPlugin, ForkScope, Schema } from 'cordis'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Dict } from 'cosmokit'

/**
 * In production, the plugins are builded to the `PROD_PLUGINS` variable.
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
  config: Dict = {}

  constructor(private ctx: Context) {
    this.configPath = resolve(resolve(ctx.app.getPath('userData')), 'config.json')
    ctx.on('ready', this.start.bind(this))
  }

  async start() {
    this.config = await this.readConfig()
    this.plugins = await this.loadPlugins()
    for (const { name, plugin, validate, schema } of this.plugins) {
      if (schema) this.config[name] = this.generateConfig(schema, this.config[name])
      try {
        console.log({
          name,
          config: this.config[name],
        })
        if (validate && validate(this.config[name]) || !validate)
          await this.processPlugin(name, plugin, this.config[name])
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

  private generateConfig(schema: Loader.SchemaRaw, config: Dict) {
    const isNestedType = (type: string) =>
      ['object', 'intersect', 'tuple', 'dict', 'array'].includes(type)

    const mergeObject = (s: Loader.SchemaRaw, c: Dict) => {
      const merged = { ...c };
      Object.entries(s.children || {}).forEach(([key, child]: [string, Loader.SchemaRaw]) => {
        const existingValue = merged[key];
        if (existingValue !== undefined && !isNestedType(child.type)) return
        if (child.meta?.default !== undefined) {
          if (existingValue === undefined) {
            merged[key] = getDefaultValue(child)
          } else if (isNestedType(child.type)) {
            merged[key] = this.generateConfig(child, existingValue).bind(this)
          }
        } else if (isNestedType(child.type)) {
          merged[key] = this.generateConfig(child, existingValue || {}).bind(this)
        }
      })
      return merged
    }

    const mergeIntersect = (s: Loader.SchemaRaw, c: Dict) => (s.children as Loader.SchemaRaw[])
      .filter((child: Loader.SchemaRaw) => child.type === 'object')
      .reduce((acc, child) => mergeObject(child, acc), { ...c })

    const getDefaultValue = (child: Loader.SchemaRaw) => {
      if (child.type === 'object') {
        return mergeObject(child, {})
      }
      if (child.type === 'intersect') {
        return mergeIntersect(child, {})
      }
      return child.meta?.default;
    };

    if (schema.type === 'object') {
      return mergeObject(schema, config)
    }
    if (schema.type === 'intersect') {
      return mergeIntersect(schema, config)
    }

    return config
  }

  private async readConfig() {
    if (existsSync(this.configPath)) {
      const data = JSON.parse(await readFile(this.configPath, 'utf8')) as typeof this.config
      this.ctx.emit('config/update', data)
      return this.configHandler(data)
    } else {
      this.ctx.logger('config').debug('config file not found, creating a new one')
      await this.writeConfig()
      return {}
    }
  }

  private debounceConfigTimer: NodeJS.Timeout | null = null

  private configHandler(config: Dict) {
    const handler = {
      get: (target: Dict, key: string) => {
        if (typeof target[key] === 'object' && target[key] !== null) {
          return this.configHandler(target[key])
        }
        return target[key]
      },
      set: (target: Dict, key: string, value: any) => {
        target[key] = value
        if (this.debounceConfigTimer) clearTimeout(this.debounceConfigTimer)
        this.debounceConfigTimer = setTimeout(this.writeConfig.bind(this), 500)
        return true
      }
    }
    return new Proxy(config, handler)
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
