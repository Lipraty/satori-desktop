import { Context, Plugin as CordisPlugin, ForkScope, Schema, Inject } from 'cordis'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { Dict } from 'cosmokit'

declare module 'cordis' {
  interface Context {
    appDataDir: string
    $loader: Loader
  }
  interface Events {
    'config/update': (config: Dict) => void
  }
}

export class Loader {
  static readonly name = 'loader'
  static readonly inject = ['app']

  private readonly internalConfig = {
    window: {
      theme: 'system',
      title: 'Satori App for Desktop',
      width: 1076,
      height: 653,
    }
  }
  private plugins: Loader.Plugin[] = []
  private configPath: string = ''
  private configSuspend = false

  scope: Map<string, ForkScope | undefined> = new Map()
  config: Dict = {}

  constructor(private ctx: Context) {
    ctx.provide('$loader', this, true)
    this.configPath = resolve(resolve(ctx.app.getPath('userData')), 'config.json')
    ctx.on('ready', this.start.bind(this))
  }

  async start() {
    this.config = await this.readConfig()
    this.plugins = await this.loadPlugins()
    const internal = this.plugins.filter(plugin => plugin.internal)
    internal.forEach(plugin => {
      try {
        const fork = this.ctx.plugin(plugin.plugin, this.config[plugin.name])
        this.scope.set(plugin.name, fork)
        this.ctx.logger.info('apply internal %c', plugin.name)
      } catch (error) {
        this.ctx.logger.error('failed to apply internal %c: ', plugin.name, error)
      }
    })
    // loaded from app start
    this.scope.set('app', undefined)
    this.scope.set('satori', undefined)
    this.scope.set('bots', undefined)
    const external = this.plugins.filter(plugin => !plugin.internal)
    for (const plugin of external) {
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

  private getRequiredPlugins(inject: Dict<Inject.Meta>) {
    return Object.entries(inject).map(([key, meta]) => meta.required ? key : undefined).filter(k => k !== undefined)
  }

  applyPlugin(name: string, plugin: Loader.Plugin, config?: Dict, start: boolean = false): ForkScope<Context> {
    const { validate, plugin: _plugin, inject } = plugin
    if (inject) {
      const requires = this.getRequiredPlugins(inject)
      if (
        requires.some(k => !this.scope.has(k))
      ) {
        throw `required dependencies: [${requires.join(', ')}]`
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

  private sortByDeps(plugins: Loader.Plugin[]) {
    const graph: Map<string, string[]> = new Map()
    const inDegree: Map<string, number> = new Map()
    const nameToPlugin: Map<string, Loader.Plugin> = new Map()
    for (const plugin of plugins) {
      const name = plugin.internal ? `$${plugin.name}` : plugin.name
      graph.set(name, [])
      inDegree.set(name, 0)
      nameToPlugin.set(name, plugin)
    }
    for (const plugin of plugins) {
      const name = plugin.internal ? `$${plugin.name}` : plugin.name
      if (plugin.inject) {
        const requiredDeps = this.getRequiredPlugins(plugin.inject)
        for (const dep of requiredDeps) {
          const depName = nameToPlugin.has(dep) ? dep : `$${dep}`
          if (graph.has(depName)) {
            graph.get(depName)!.push(name)
            inDegree.set(name, (inDegree.get(name) || 0) + 1)
          }
        }
      }
    }
    const queue: string[] = []
    const sorted: Loader.Plugin[] = []
    for (const [name, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(name)
      }
    }
    while (queue.length > 0) {
      const current = queue.shift()!
      const plugin = nameToPlugin.get(current)!
      sorted.push(plugin)
      for (const neighbor of graph.get(current) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1)
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor)
        }
      }
    }
    if (sorted.length !== plugins.length) {
      this.ctx.logger.warn('circular dependency detected, loading plugins in order of declaration')
      const sortedNames = new Set(sorted.map(p => p.internal ? `$${p.name}` : p.name))
      for (const plugin of plugins) {
        const name = plugin.internal ? `$${plugin.name}` : plugin.name
        if (!sortedNames.has(name)) {
          sorted.push(plugin)
        }
      }
    }
    return sorted
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
      const plugins = import.meta.glob<CordisPlugin>([
        './plugins/*.ts',
        './plugins/**/index.ts',
      ])

      return await Promise.all([loader(internal, true), loader(plugins, false)])
        .then(([internal, plugins]) => [...internal, ...plugins])
    } else {
      // In production, the plugins are builded to the `plugins.js` file.
      // @ts-ignore
      const plugins = await import('../plugins.js').then(m => m.default)
      return plugins
    }
  }

  private async loadExternal(): Promise<Loader.Plugin[]> {
    return []
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
