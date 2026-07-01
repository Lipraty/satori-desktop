import type { Context, Plugin } from 'cordis'
import type { EntryOptions } from '@cordisjs/plugin-loader'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { Loader } from '@cordisjs/plugin-loader'

export interface PluginManifest {
  name: string
  plugin: Plugin
}

export interface ElectronLoaderConfig {
  baseDir: string
  internals: PluginManifest[]
  defaultEntries?: EntryOptions[]
}

const FLUSH_DEBOUNCE_MS = 200

export class ElectronLoader extends Loader {
  private baseDir: string
  private flushTimer: NodeJS.Timeout | undefined
  private writeQueued = false
  public electronConfig: ElectronLoaderConfig

  constructor(ctx: Context, config: ElectronLoaderConfig) {
    super(ctx, {})
    this.electronConfig = config
    this.baseDir = config.baseDir
    for (const manifest of config.internals) {
      this.builtins[manifest.name] = manifest.plugin
    }

    void this.bootEntries(config.defaultEntries ?? [])
  }

  private get configPath(): string {
    return resolve(this.baseDir, 'config.json')
  }

  private async bootEntries(defaults: EntryOptions[]): Promise<void> {
    const entries = await this.readConfig(defaults)
    await this.root.update(entries)
  }

  private async readConfig(defaults: EntryOptions[]): Promise<EntryOptions[]> {
    try {
      const raw = await readFile(this.configPath, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed))
        return parsed
      return defaults
    }
    catch (err: any) {
      if (err?.code === 'ENOENT') {
        await this.persist(defaults)
        return defaults
      }
      throw err
    }
  }

  override write(): void {
    if (this.writeQueued)
      return
    this.writeQueued = true
    if (this.flushTimer)
      clearTimeout(this.flushTimer)
    this.flushTimer = setTimeout(() => {
      this.flushTimer = undefined
      this.writeQueued = false
      void this.persist(this.root.data)
    }, FLUSH_DEBOUNCE_MS)
  }

  private async persist(entries: EntryOptions[]): Promise<void> {
    try {
      await mkdir(dirname(this.configPath), { recursive: true })
      await writeFile(this.configPath, JSON.stringify(entries, null, 2), 'utf-8')
    }
    catch (err) {
      this.ctx.logger('loader').warn('failed to write config: %s', err instanceof Error ? err.message : String(err))
    }
  }
}

export class PluginStore {
  static readonly inject = ['logger']

  constructor(public ctx: Context, public config: { baseDir: string }) {}

  async install(_spec: string): Promise<void> {
    // External plugin install via pacote/arborist — TBD; see CLAUDE.md
  }

  async uninstall(_packageName: string): Promise<void> {
    // TBD
  }
}

declare module 'cordis' {
  interface Context {
    pluginStore: PluginStore
  }
}

export type { EntryOptions } from '@cordisjs/plugin-loader'
export default ElectronLoader
