import type { Context } from 'cordis'
import type * as electorn from 'electron'
import { } from '@cordisjs/plugin-http'

import { } from '@satorijs/core'
import { Schema, Service } from 'cordis'

import * as Package from '../package.json'

declare module 'cordis' {
  interface Context {
    electorn: typeof electorn
  }
}

declare module 'cordis' {
  interface Context {
    sapp: SatoriApp
    $version: string
  }
}

export const APP_NAME = 'Satori App for Desktop'
export const APP_VERSION = Package.version
export const APP_ID = 'chat.satori.desktop'

class SatoriApp extends Service {
  static readonly inject = ['satori', 'server']
  static readonly Config: Schema<SatoriApp.Config> = Schema.object({
    port: Schema.number().default(11510),
    maxPort: Schema.number().default(11519),
    host: Schema.string(),
  })

  constructor(ctx: Context) {
    super(ctx, 'sapp')
    ctx.set('$version', APP_VERSION)
  }

  async start() { }

  async stop() { }
}

namespace SatoriApp {
  export interface Config {
    port: number
    maxPort?: number
    host?: string
  }
}

export default SatoriApp
