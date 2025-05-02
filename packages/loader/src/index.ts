import { resolve } from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'

import { APP_NAME, APP_VERSION, Context, Dict, emptyObject, ForkScope, Inject, Schema, Plugin } from '@satoriapp/main'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { plugins } from './plugins'

declare module '@satoriapp/main' {
  interface Events {
    'config/read': (config: Dict) => void
    'config/write': (config: Dict) => void
  }
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
    const eventer = (event: 'read' | 'write') => {
      this.ctx.logger('config').info(`Config ${event} event`, config)
      this.ctx.emit(`config/${event}`, config)
    }
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
            .finally(() => {
              this.suspend = false
            })
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
