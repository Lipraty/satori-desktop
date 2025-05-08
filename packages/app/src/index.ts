import { resolve } from 'node:path'
import type * as electorn from 'electron'
import { Context, Service } from 'cordis'

declare module 'cordis' {
  interface Context {
    electorn: typeof electorn
  }
}

import * as Package from '../package.json'

declare module 'cordis' {
  interface Context {
    app: SatoriApp
    $version: string
  }
}

export const APP_NAME = 'Satori App for Desktop'
export const APP_VERSION = Package.version
export const APP_ID = 'com.satoriapp.desktop'

class SatoriApp extends Service {
  constructor(ctx: Context) {
    super(ctx)
    ctx.set('$version', APP_VERSION)
    ctx.inject(['electorn'], (ctx) => {
      ctx.set('dataDir', resolve(ctx.electorn.app.getPath('userData'), 'sapp'))
    })
    // TODO
    // ctx.inject(['cirno'], (ctx) => {})
  }
}

namespace SatoriApp { }

export default SatoriApp
