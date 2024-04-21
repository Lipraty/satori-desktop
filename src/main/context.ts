/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import * as Cordis from 'cordis'
import * as Electron from 'electron'

export interface Events<C extends Context = Context> extends Cordis.Events<C> {}

export interface Context {
  [Context.events]: Events<this>
}

export class Context extends Cordis.Context {
  app: Electron.App

  constructor() {
    super()

    this.app = Electron.app
  }
}

export abstract class Service<T = any, C extends Context = Context> extends Cordis.Service<T, C> {}
