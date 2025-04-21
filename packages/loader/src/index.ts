/**
 * In Electron projects, the development and production modes operate in fundamentally different ways. This loader primarily serves three key purposes:
 * 
 * 1. ​Development - Automatically discovers and loads plugins/packages from the designated plugins directory during runtime.
 * 2. Production - Directly imports pre-built bundles without performing any dynamic loading operations.
 * 3. External Plugin - Functions as a centralized loader for externally developed plugins residing in application-defined directories.
 */
import { APP_NAME, APP_VERSION, Context, Dict, emptyObject, ForkScope, Inject, Schema, Plugin } from '@satoriapp/main'
import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

import manifest from './plugins.manifest.json'

declare module 'cordis' {
  interface Context {
    loader: Loader
  }
}

export function unwrapExport(module: any) {
  return module?.default || module
}

class Loader {
  static readonly name = 'loader'
  static readonly FILE_NAME = 'config.json'

  private config: Dict = {}
  private suspend: boolean = false
  private entrys: Loader.EntryOptions[] = []
  public scope: Map<string, ForkScope> = new Map()
  public configPath: string

  constructor(private ctx: Context) {
    ctx.logger('app').info(`${APP_NAME}/%c`, APP_VERSION)
    this.configPath = resolve(ctx.app.getPath('userData'), Loader.FILE_NAME)
    ctx.provide('loader', this, true)

    ctx.on('ready', async () => {
      // step 1: read config and proxy it
      this.config = await this.read()
      let init = false
      // step 2: if config is empty, init it
      if (emptyObject(this.config)) {
        init = true
      }
      await this.init(init)
    })

    ctx.on('internal/update', (scope, config) => {

    })

    ctx.on('dispose', async () => { })
  }

  async init(init: boolean) {
    
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
          this.write(target)
        }, 500)
        return true
      }
    }
    return new Proxy(config, handler)
  }

  async read() {
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

  async write(config: Dict) {
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

export default Loader
