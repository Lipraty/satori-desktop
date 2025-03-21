import { Context, Plugin as CordisPlugin, ForkScope, Schema, Inject } from 'cordis'
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
    for (const plugin of this.plugins) {
      const { name, schema, internal } = plugin
      // Non-internal plugin names may have '~' to indicate a closed
      const closed = internal ? false : Object.keys(this.config).some(key => key.startsWith(`~${name}`)) || !this.config[name]
      if (schema) {
        if (closed) {
          this.config[`~${name}`] = this.generateConfig(schema, this.config[`~${name}`] || {})
          continue
        } else {
          this.config[name] = this.generateConfig(schema, this.config[name])
        }
      } else if (closed) {
        this.config[`~${name}`] = this.config[name] || {}
        await this.writeConfig()
        continue
      }
      try {
        const fork = this.applyPlugin(name, plugin, this.config[name], true)
        this.scope.set(name, fork)
      } catch (_) {
        this.ctx.logger.error(`failed to apply plugin %c`, name, _)
        continue
      }
    }
  }

  applyPlugin(name: string, plugin: Loader.Plugin, config?: Dict, start: boolean = false): ForkScope<Context> {
    const { validate, plugin: _plugin, inject } = plugin
    if (!start && inject) {
      const requires = Object.entries(inject).map(([key, meta]) => meta.required ? key : undefined).filter(k => k !== undefined)
      if (requires.some(k => !this.scope.has(k))) {
        throw new Error(`: missing required dependencies: ${requires.join(', ')}`)
      }
    }
    if (validate && validate(config) || !validate) {
      this.ctx.logger.info('apply plugin %c', name)
      return this.ctx.plugin(_plugin, config)
    } else {
      throw new Error('')
    }
  }

  stopPlugin(name: string) {
    const scope = this.scope.get(name)
    if (scope) {
      this.ctx.logger.info('stop plugin %c', name)
      scope.dispose()
      this.scope.delete(name)
    }
  }

  private async loadPlugins() {
    if (import.meta.env.DEV) {
      const loader = async (modules: Record<string, () => Promise<CordisPlugin>>, isInternal: boolean) => {
        const plugins: Loader.Plugin[] = []
        for (const path in modules) {
          const module = await modules[path]()
          const exports: CordisPlugin[] = []
          // @ts-ignore
          if (typeof module?.default === 'function') exports.push(module.default)
          else if (typeof module?.apply === 'function') {
            exports.push(module)
          } else if (typeof module === 'object') {
            for (const key in module) {
              const exported = (module as any)[key] as CordisPlugin
              // @ts-ignore
              if (typeof exported?.default === 'function') exports.push(exported.default)
              if (typeof exported?.apply === 'function') exports.push(exported)
            }
          }
          for (const plugin of exports) {
            const name = (plugin.name || plugin.constructor.name).replace(/Service$/, '').toLowerCase()
            const validate = plugin.Config && plugin.Config instanceof Schema ? plugin.Config : undefined
            const schema = validate ? this.reverseSchema(validate) : undefined
            const inject = plugin.inject
              ? Array.isArray(plugin.inject)
                ? Object.fromEntries(plugin.inject.map(k => [k, { required: true }])) as Dict<Inject.Meta>
                : plugin.inject
              : undefined
            plugins.push({ name, schema, validate, internal: isInternal, plugin, inject })
          }
        }
        return plugins
      }

      const internal = import.meta.glob<CordisPlugin>([
        './internal/*.ts',
        './internal/**/index.ts',
      ])
      const external = import.meta.glob<CordisPlugin>([
        './plugins/*.ts',
        './plugins/**/index.ts',
      ])

      return await Promise.all([loader(internal, true), loader(external, false)])
        .then(([internal, external]) => [...internal, ...external])
    } else {
      // In production, the plugins are builded to the `plugins.js` file.
      // @ts-ignore
      const plugins = await import('../plugins.js').then(m => m.default)
      return plugins
    }
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
    inject?: Dict<Inject.Meta>
    validate?: Schema
    internal: boolean
    plugin: CordisPlugin
  }
  export type SchemaRaw = {
    type: Schema['type']
    meta: Schema['meta']
    children: SchemaRaw | any
  }
}

export default Loader
