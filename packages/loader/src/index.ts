import type { CordisConfig, Dict } from '@satoriapp/common'
import type { Context, ForkScope, Inject, Plugin, Schema } from 'cordis'
import type { Entry } from './entry'

import { access } from 'node:fs/promises'
import { createRequire } from 'node:module'

import { resolve } from 'node:path'
import { ImportTree } from './import'

declare module 'cordis' {
  interface Events {
    'loader/scan': (plugins: PluginManifest[]) => void
    'loader/apply': (name: string, fork: ForkScope) => void
    'loader/unload': (name: string) => void
    'loader/update': (name: string, config: Dict) => void
  }
  interface Context {
    loader: Loader
  }
}

export function unwrapExport(module: any) {
  return module?.default || module
}

class Loader extends ImportTree {
  static readonly name = 'loader'

  constructor(ctx: Context) {
    super(ctx)
    ctx.logger('app').info(`Satori App for Desktop/%c`, ctx.$version)
    ctx.provide('loader', this, true)

    this.configPath = resolve(ctx.dataDir, 'config.json')

    ctx.on('ready', async () => {
      await this.init()
    })

    ctx.on('loader/apply', (name: string) => {
      this._log('apply', name)
    })

    ctx.on('loader/unload', (name: string) => {
      this._log('unload', name)
    })

    ctx.on('loader/update', async (name: string) => {
      this._log('update', name)
    })

    ctx.on('dispose', async () => { })
  }

  async require(path: string, isESM: boolean = false) {
    try {
      await access(path)
      if (isESM)
        return await import(path)
      else
        return createRequire(resolve(this.ctx.dataDir, 'external'))(path)
    }
    catch (_e) {
      this.ctx.logger('loader').error('failed to access %s', path)
      return undefined
    }
  }

  _log(active: string, pkgName: string) {
    return this.ctx.logger('loader').info('%s plugin %c', active, this.purifyName(pkgName))
  }

  unwrapExport(module: any) {
    return module?.default?.default || module?.default || module
    //     ^fix esbuild issue
  }

  resolve(id: string): Entry | undefined {
    if (this.entryTree.has(id)) {
      return this.entryTree.get(id)
    }
    return undefined
  }

  _mixins(plugins: PluginManifest[]) {
    this.cache.push(...plugins)
  }
}

namespace Loader {
  export interface EntryOptions {
    id: string
    name: string
    schema?: SchemaRaw
    disabled?: boolean
    inject?: Inject | null
    plugin: Plugin
  }

  export interface SchemaRaw {
    type: Schema['type']
    meta: Schema['meta']
    children?: SchemaRaw | any
  }

  export interface Manifest {
    path: string
    meta?: ManifestMeta
  }

  export interface ManifestMeta {
    service?: {
      required?: string[]
      optional?: string[]
      implements?: string[]
    }
  }
}

export interface PluginManifest {
  name: string
  packageName: string
  // Only used in external plugins from 'createRequire' scope
  path?: string
  meta: Record<string, any> & CordisConfig
  version: string
  internal?: boolean
  plugin: any
}

export default Loader
