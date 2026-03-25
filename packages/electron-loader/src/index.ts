import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export type LoaderState
  = | 'registered'
    | 'loading'
    | 'active'
    | 'stopped'
    | 'failed'

export interface LoaderHealth {
  state: LoaderState
  updatedAt: number
  message?: string
}

export interface LoaderPluginMeta {
  name: string
  scope?: string
  requires?: string[]
  provides?: string[]
  bootOrder?: number
  capabilities?: string[]
  reusable?: boolean
}

export interface LoaderFork {
  dispose: () => unknown
  update?: (config: unknown) => unknown
}

export interface ExternalPluginSpec<TContext = unknown, TConfig = any> {
  name: string
  packageName: string
  plugin: LoaderPlugin<TContext, TConfig>
}

export interface LoaderPluginConfig<TConfig = any> {
  enabled?: boolean
  config?: TConfig
  package?: string
}

export interface LoaderConfigFile<TConfig = unknown> {
  $root?: Record<string, unknown>
  root?: Record<string, unknown>
  plugins?: Record<string, LoaderPluginConfig<TConfig> | TConfig>
  [key: string]: unknown
}

export interface BootOptions<TContext = unknown> {
  configPath: string
  externalPluginRoot: string
  applyRootConfig?: (ctx: TContext, rootConfig: Record<string, unknown>) => void | Promise<void>
}

export interface LoaderPlugin<TContext = unknown, TConfig = any> extends LoaderPluginMeta {
  setup: (ctx: TContext, config?: TConfig) => void | LoaderFork | Promise<void | LoaderFork>
  dispose?: (ctx: TContext) => void | Promise<void>
  healthCheck?: (ctx: TContext) => LoaderHealth | Promise<LoaderHealth>
}

export interface LoaderEntry<TContext = unknown, TConfig = any> {
  name: string
  id: string
  plugin: LoaderPlugin<TContext, TConfig>
  health: LoaderHealth
  config?: TConfig
  fork?: LoaderFork
  source: 'internal' | 'external'
  packageName?: string
}

export class ElectronLoader<TContext = unknown, TConfig = any> {
  private readonly entries = new Map<string, LoaderEntry<TContext, TConfig>>()
  private context?: TContext
  private configPath = ''
  private externalPluginRoot = ''
  private rootConfig: Record<string, unknown> = {}
  private rawConfig: LoaderConfigFile<TConfig> = {}
  private applyRootConfigHook?: (ctx: TContext, rootConfig: Record<string, unknown>) => void | Promise<void>

  constructor(context?: TContext) {
    this.context = context
  }

  setContext(context: TContext): void {
    this.context = context
  }

  register(plugin: LoaderPlugin<TContext, TConfig>, config?: TConfig, source: LoaderEntry<TContext, TConfig>['source'] = 'internal', packageName?: string, instanceId?: string): string {
    const id = instanceId || this.createId()
    const name = `${plugin.name}:${id}`
    if (this.entries.has(name)) {
      throw new Error(`Plugin already registered: ${name}`)
    }

    const entry: LoaderEntry<TContext, TConfig> = {
      name,
      id,
      plugin,
      config,
      source,
      packageName,
      health: {
        state: 'registered',
        updatedAt: Date.now(),
      },
    }

    this.entries.set(name, entry)
    return entry.id
  }

  registerMany(plugins: Array<LoaderPlugin<TContext, TConfig> | [LoaderPlugin<TContext, TConfig>, TConfig]>): void {
    for (const plugin of plugins) {
      if (Array.isArray(plugin)) {
        this.register(plugin[0], plugin[1])
      }
      else {
        this.register(plugin)
      }
    }
  }

  getRootConfig(): Record<string, unknown> {
    return { ...this.rootConfig }
  }

  async boot(options: BootOptions<TContext>): Promise<void> {
    this.configPath = options.configPath
    this.externalPluginRoot = options.externalPluginRoot
    this.applyRootConfigHook = options.applyRootConfig

    const config = await this.readConfig()
    this.applySavedPluginConfigs()

    await this.startBySource('internal')
    await this.applyRootConfig(config)

    const discovered = await this.discoverExternalPlugins()
    this.emit('scan', discovered.map(item => ({
      name: item.name,
      packageName: item.packageName,
    })))
    this.registerExternalByConfig(config, discovered)
    await this.startBySource('external')
  }

  configure(name: string, config: TConfig): void {
    const entry = this.requireEntry(name)
    entry.config = config
    if (entry.fork?.update) {
      void Promise.resolve(entry.fork.update(config))
      this.emit('update', entry.name, config)
    }
  }

  list(): LoaderEntry<TContext, TConfig>[] {
    return [...this.entries.values()]
  }

  health(): Record<string, LoaderHealth> {
    return [...this.entries.values()].reduce<Record<string, LoaderHealth>>((acc, entry) => {
      acc[entry.name] = { ...entry.health }
      return acc
    }, {})
  }

  resolve(name: string): LoaderEntry<TContext, TConfig> | undefined {
    return this.entries.get(name)
  }

  async start(name?: string): Promise<void> {
    const ctx = this.ensureContext()
    const targets = name ? [this.requireEntry(name)] : this.resolveStartOrder()

    for (const entry of targets) {
      if (entry.health.state === 'active')
        continue

      if ((entry.config as Record<string, unknown>)?.$disabled === true) {
        this.mark(entry, 'stopped')
        continue
      }

      this.mark(entry, 'loading')
      try {
        const setupConfig = entry.config ? { ...(entry.config as Record<string, any>) } : entry.config
        if (setupConfig)
          delete (setupConfig as Record<string, any>).$disabled
        const fork = await entry.plugin.setup(ctx, setupConfig as TConfig)
        if (fork && typeof fork === 'object' && 'dispose' in fork) {
          entry.fork = fork
        }
        this.mark(entry, 'active')
        this.emit('apply', entry.name, entry.fork)
      }
      catch (error) {
        this.mark(entry, 'failed', this.formatError(error))
        throw error
      }
    }
  }

  async stop(name?: string): Promise<void> {
    const ctx = this.ensureContext()
    const targets = name
      ? [this.requireEntry(name)]
      : [...this.resolveStartOrder()].reverse()

    for (const entry of targets) {
      if (entry.health.state !== 'active')
        continue

      try {
        if (entry.fork) {
          await Promise.resolve(entry.fork.dispose())
          entry.fork = undefined
        }
        await entry.plugin.dispose?.(ctx)
        this.mark(entry, 'stopped')
        this.emit('unload', entry.name)
      }
      catch (error) {
        this.mark(entry, 'failed', this.formatError(error))
        throw error
      }
    }
  }

  async startBySource(source: LoaderEntry<TContext, TConfig>['source']): Promise<void> {
    const entries = this.resolveStartOrder().filter(entry => entry.source === source)
    for (const entry of entries) {
      await this.start(entry.name)
    }
  }

  async reload(name: string, config?: TConfig): Promise<void> {
    if (config !== undefined)
      this.configure(name, config)
    await this.stop(name)
    await this.start(name)
  }

  async unload(name: string): Promise<void> {
    if (this.entries.has(name)) {
      await this.stop(name)
      this.entries.delete(name)
    }
  }

  async checkHealth(name?: string): Promise<Record<string, LoaderHealth>> {
    const ctx = this.ensureContext()
    const entries = name
      ? [[name, this.requireEntry(name)]] as const
      : [...this.entries.entries()] as const

    for (const [, entry] of entries) {
      if (!entry.plugin.healthCheck)
        continue

      try {
        const result = await entry.plugin.healthCheck(ctx)
        entry.health = {
          ...result,
          updatedAt: Date.now(),
        }
      }
      catch (error) {
        this.mark(entry, 'failed', this.formatError(error))
      }
    }

    return this.health()
  }

  private ensureContext(): TContext {
    if (this.context === undefined) {
      throw new Error('Loader context is not set.')
    }
    return this.context
  }

  private requireEntry(name: string): LoaderEntry<TContext, TConfig> {
    const exact = this.entries.get(name)
    if (exact)
      return exact

    const matched = [...this.entries.values()].filter(entry => entry.plugin.name === name)
    if (matched.length === 1)
      return matched[0]
    if (matched.length > 1)
      throw new Error(`Plugin name is ambiguous: ${name}, please use instance id.`)

    throw new Error(`Plugin is not registered: ${name}`)
  }

  private mark(entry: LoaderEntry<TContext, TConfig>, state: LoaderState, message?: string): void {
    entry.health = {
      state,
      message,
      updatedAt: Date.now(),
    }
  }

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
  }

  private resolveStartOrder(): LoaderEntry<TContext, TConfig>[] {
    const byName = this.entries
    const pending = new Set(byName.keys())
    const visited = new Set<string>()
    const stack = new Set<string>()
    const ordered: LoaderEntry<TContext, TConfig>[] = []

    const resolveDependency = (dep: string): LoaderEntry<TContext, TConfig> => {
      const exact = byName.get(dep)
      if (exact)
        return exact

      const matched = [...byName.values()].filter(entry => entry.plugin.name === dep)
      if (matched.length === 1)
        return matched[0]
      if (matched.length > 1) {
        throw new Error(`Plugin dependency is ambiguous: ${dep}, please use instance id.`)
      }

      throw new Error(`Missing loader dependency: ${dep}`)
    }

    const visit = (name: string) => {
      if (visited.has(name))
        return
      if (stack.has(name)) {
        throw new Error(`Circular loader dependency detected at ${name}`)
      }

      const entry = byName.get(name)
      if (!entry) {
        throw new Error(`Missing loader dependency: ${name}`)
      }

      stack.add(name)
      for (const dep of entry.plugin.requires || []) {
        const depEntry = resolveDependency(dep)
        visit(depEntry.name)
      }
      stack.delete(name)
      visited.add(name)
      pending.delete(name)
      ordered.push(entry)
    }

    const roots = [...byName.values()].sort((a, b) => (a.plugin.bootOrder || 0) - (b.plugin.bootOrder || 0))
    for (const entry of roots) {
      visit(entry.name)
    }

    for (const name of pending) {
      visit(name)
    }

    return ordered
  }

  private createId(): string {
    return Math.random().toString(36).slice(2, 8)
  }

  private emit(type: 'scan' | 'apply' | 'unload' | 'update', ...args: unknown[]): void {
    const ctx = this.context as { emit?: (...a: unknown[]) => void } | undefined
    ctx?.emit?.(`loader/${type}`, ...args)
  }

  private applySavedPluginConfigs(): void {
    const saved = this.rawConfig.plugins || {}
    for (const [entryName, savedConfig] of Object.entries(saved)) {
      const entry = this.entries.get(entryName)
      if (entry && savedConfig !== null && typeof savedConfig === 'object') {
        entry.config = savedConfig as TConfig
      }
    }
  }

  getPluginsConfig(): Record<string, any> {
    return { ...(this.rawConfig.plugins || {}) }
  }

  async patchPluginsConfig(patches: Record<string, any>): Promise<void> {
    this.rawConfig.plugins = { ...(this.rawConfig.plugins || {}), ...patches }
    await mkdir(dirname(this.configPath), { recursive: true })
    await writeFile(this.configPath, JSON.stringify(this.rawConfig, null, 2), 'utf-8')
  }

  private async readConfig(): Promise<LoaderConfigFile<TConfig>> {
    if (!this.configPath)
      return {}

    try {
      const raw = await readFile(this.configPath, 'utf-8')
      this.rawConfig = JSON.parse(raw) as LoaderConfigFile<TConfig>
      return this.rawConfig
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        return {}
      }
      throw error
    }
  }

  private async applyRootConfig(config: LoaderConfigFile<TConfig>): Promise<void> {
    const ctx = this.ensureContext() as Record<string, unknown>
    const fromTopLevel = Object.fromEntries(
      Object.entries(config).filter(([key]) => !['plugins', '$root', 'root'].includes(key)),
    )
    this.rootConfig = {
      ...(config.$root || {}),
      ...(config.root || {}),
      ...fromTopLevel,
    } as Record<string, unknown>

    if (this.applyRootConfigHook) {
      await this.applyRootConfigHook(this.ensureContext(), this.rootConfig)
      return
    }

    for (const [key, value] of Object.entries(this.rootConfig)) {
      if (typeof (ctx as { set?: unknown }).set === 'function') {
        (ctx as { set: (k: string, v: unknown) => void }).set(key, value)
      }
      else {
        ctx[key] = value
      }
    }
  }

  private async discoverExternalPlugins(): Promise<ExternalPluginSpec<TContext, TConfig>[]> {
    if (!this.externalPluginRoot)
      return []

    const packageJsonPath = resolve(this.externalPluginRoot, 'package.json')
    try {
      const raw = await readFile(packageJsonPath, 'utf-8')
      const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> }
      const deps = Object.keys(pkg.dependencies || {})

      const requireFromPluginRoot = createRequire(pathToFileURL(packageJsonPath).href)
      const external: ExternalPluginSpec<TContext, TConfig>[] = []
      for (const dep of deps) {
        if (!this.isPluginPackage(dep))
          continue

        const entryPath = requireFromPluginRoot.resolve(dep)
        const module = await this.loadModule(entryPath, requireFromPluginRoot)
        const unwrapped = this.unwrapModule(module) as LoaderPlugin<TContext, TConfig>
        const name = unwrapped?.name || this.purifyName(dep)
        external.push({
          name,
          packageName: dep,
          plugin: {
            ...unwrapped,
            name,
          },
        })
      }

      return external
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT')
        return []
      throw error
    }
  }

  private registerExternalByConfig(config: LoaderConfigFile<TConfig>, discovered: ExternalPluginSpec<TContext, TConfig>[]): void {
    const pluginNodes = this.flattenPluginNodes(config.plugins || {})
    for (const node of pluginNodes) {
      if (node.disabled)
        continue

      const spec = discovered.find(item => item.name === node.pluginName || item.packageName === node.packageName)
      if (!spec)
        continue

      const entryName = `${spec.plugin.name}:${node.instanceId}`
      if (this.entries.has(entryName))
        continue

      this.register(spec.plugin, node.config, 'external', spec.packageName, node.instanceId)
    }
  }

  private flattenPluginNodes(tree: Record<string, any>, result: Array<{ pluginName: string, instanceId: string, disabled: boolean, packageName?: string, config: TConfig }> = []): Array<{ pluginName: string, instanceId: string, disabled: boolean, packageName?: string, config: TConfig }> {
    for (const [rawKey, rawValue] of Object.entries(tree)) {
      if (!rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue))
        continue

      const key = rawKey.startsWith('~') ? rawKey.slice(1) : rawKey
      if (key.startsWith('group:')) {
        this.flattenPluginNodes(rawValue as Record<string, any>, result)
        continue
      }

      const matched = key.match(/^([^:]+):([^:]+)$/)
      if (!matched)
        continue

      const [, pluginName, instanceId] = matched
      const objectValue = rawValue as Record<string, any>
      const config = this.pickPluginConfig(objectValue)
      result.push({
        pluginName,
        instanceId,
        disabled: objectValue.$disabled === true,
        packageName: typeof objectValue.$package === 'string' ? objectValue.$package : undefined,
        config,
      })
    }

    return result
  }

  private pickPluginConfig(objectValue: Record<string, any>): TConfig {
    const config = Object.fromEntries(
      Object.entries(objectValue).filter(([key]) => !key.startsWith('$')),
    )
    return config as TConfig
  }

  private unwrapModule(module: unknown): unknown {
    const m = module as { default?: { default?: unknown } }
    return m?.default?.default || m?.default || module
  }

  private async loadModule(entryPath: string, req: ReturnType<typeof createRequire>): Promise<unknown> {
    try {
      return req(entryPath)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ERR_REQUIRE_ESM') {
        return await import(pathToFileURL(entryPath).href)
      }
      throw error
    }
  }

  private isPluginPackage(name: string): boolean {
    return /^(?:@satoriapp\/plugin-|sapp-plugin-|@[^/]+\/sapp-plugin-).+/.test(name)
  }

  private purifyName(name: string): string {
    return name.replace(/^(?:@satoriapp\/plugin-|sapp-plugin-|@[^/]+\/sapp-plugin-)/, '')
  }
}

export default ElectronLoader
