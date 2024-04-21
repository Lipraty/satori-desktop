/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
import * as Cordis from 'cordis'
import * as Electron from 'electron'

export { Service } from 'cordis'
export interface Events<C extends Context> extends Cordis.Events<C> {}

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
