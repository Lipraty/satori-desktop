import { readdir, readFile, writeFile } from 'node:fs/promises'
import { Dirent } from 'node:fs'
import { resolve } from 'node:path'

import { Context, ForkScope, Plugin, Schema } from 'cordis'
import { Dict, PackageJson } from '@satoriapp/common'

// `plugin.ts` is automatically generated
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { plugins as prePlugin, PluginManifest } from './plugins'
import { Entry } from './entry'

export interface ImportCache {
  internal: PluginManifest[]
  external: PluginManifest[]
}

export abstract class ImportTree {
  entryTree: Map<string, Entry> = new Map()
  suspend: boolean = false
  configPath: string
  config: Dict = {}
  cache: PluginManifest[] = []

  constructor(public ctx: Context) { }

  abstract require(name: string, isESM: boolean): Promise<any>
  abstract unwrapExport(module: any): any
  abstract _log(active: string, pkgName: string): void

  async init() {
    this.config = await this.readCofig()

    // step 1: load external plugins manifest and save it to cache
    await this.discoverExternal()

    // step 2: load internal plugins
    for (const plugin of prePlugin) {
      const entry = await this.resolveEntry(plugin)
      if (!entry) continue

      const config = this.config[plugin.name]
      entry.reload(this.ctx, config)
    }
  }

  async discoverExternal() {
    const externalDir = resolve(this.ctx.dataDir, 'sapp/external')
    try {
      const paths = await readdir(externalDir, { withFileTypes: true })

      for (const path of paths) {
        if (!path.isDirectory()) continue
        const manifest = await this.externalManifest(path, externalDir)
        if (!manifest) continue
        this.cache.push(manifest)
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.ctx.logger('loader').info('no external plugins.')
      }
      this.ctx.logger('loader').error('failed to read external plugins', error)
    }
  }

  async externalManifest(path: Dirent, baseDir: string) {
    try {
      const pkgPath = resolve(baseDir, path.name, 'package.json')
      const pkgFile = JSON.parse(await readFile(pkgPath, 'utf-8')) as PackageJson
      if (!/^(@satoriapp\/plugin-|sapp-plugin-|@[^/]+\/sapp-plugin-).+/.test(pkgFile.name)) return undefined
      if (pkgFile.main) return undefined
      return {
        name: this.purifyName(pkgFile.name),
        packageName: pkgFile.name,
        version: pkgFile.version,
        path: resolve(pkgPath, '..', pkgFile.main || pkgFile.module),
        meta: pkgFile.sapp || {},
        plugin: this.require(pkgPath, pkgFile.type === 'module')
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.ctx.logger('loader').error('failed to read package.json')
      } else if (error instanceof SyntaxError || error.message.includes('Unexpected token')) {
        this.ctx.logger('loader').error('failed to parse package.json')
      }
      this.ctx.logger('loader').error('failed to load plugin "%c"', path.name)
      return undefined
    }
  }

  async import(name: string, config?: Dict): Promise<ForkScope> {
    name = name.includes('plugin-') ? this.purifyName(name) : name

    for (const entry of this.entryTree.values()) {
      if (entry.options.name === name && !entry.options.meta.reusable)
        return entry.reload(this.ctx, config)
    }

    const entry = await this.resolveEntry(name)
    if (!entry) return

    return entry.reload(this.ctx, config)
  }

  protected async resolveEntry(name: string): Promise<Entry | undefined>
  protected async resolveEntry(manifest: PluginManifest): Promise<Entry | undefined>
  protected async resolveEntry(arg: string | PluginManifest) {
    const manifest = typeof arg === 'string' ? this.cache.find(p => p.name === arg) : arg

    if (!manifest) return undefined

    const internal = prePlugin.findIndex(p => p.name === arg) !== -1
    const plugin = this.unwrapExport(manifest.plugin) as Plugin
    const options: Partial<Entry.Options> = {
      name: plugin.name || this.purifyName(manifest.name),
      config: this.config[manifest.name],
      inject: plugin.inject,
      plugin,
      meta: {
        disabled: false,
        internal,
        schema: plugin?.Config as Schema,
        reusable: plugin?.reusable
      }
    }

    options.id = this.ensureId(options)
    return new Entry(options as Entry.Options)
  }

  protected ensureId(options: Partial<Entry.Options>) {
    if (!options.id) {
      do {
        options.id = Math.random().toString(36).slice(2, 8)
      } while (this.entryTree.has(options.id))
    }
    return options.id!
  }

  /**
   * - `@satoriapp/plugin-*`
   * - `sapp-plugin-*`
   * - `@scope/sapp-plugin-*`
   */
  protected purifyName(name: string) {
    return name.replace(/^(sapp|@satoriapp)\/plugin-/, '')
  }

  private _handleConfig(config: Dict) {
    const handler = {
      get: (target: Dict, key: string) => {
        if (typeof target[key] === 'object' && target[key] !== null) {
          return this._handleConfig(target[key])
        }
        return target[key]
      },
      set: (target: Dict, key: string, value: any) => {
        target[key] = value
        if (this.suspend) return true
        this.ctx.setTimeout(() => {
          this.writeCofig(target)
            .finally(() => {
              this.suspend = false
            })
        }, 500)
        return true
      }
    }
    return new Proxy(config, handler)
  }

  async readCofig() {
    this.suspend = true
    try {
      const raw = await readFile(this.configPath, 'utf-8').catch(err => {
        if (err.code === 'ENOENT') {
          return '{}'
        } else {
          throw err
        }
      })
      return this._handleConfig(JSON.parse(raw))
    } catch (error) {
      this.ctx.logger.error('Failed to read config', error)
      return {}
    } finally {
      this.suspend = false
    }
  }

  async writeCofig(config: Dict) {
    this.suspend = true
    try {
      await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8')
    } catch (error) {
      this.ctx.logger.error('Failed to write config', error)
    } finally {
      this.suspend = false
    }
  }
}
