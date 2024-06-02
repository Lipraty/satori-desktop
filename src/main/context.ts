import * as Electron from 'electron'

import * as Cordis from 'cordis'
import * as Satori from '@satorijs/core'
export * from '@satorijs/core'

export class Context extends Satori.Context {
  app: Electron.App

  constructor() {
    super()

    this.app = Electron.app
  }
}

//eslint-disable-next-line
export abstract class Service<T = any, C extends Context = Context> extends Cordis.Service<T, C> {}
