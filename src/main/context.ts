import * as Electron from 'electron'

import * as Cordis from 'cordis'

export interface Events<C extends Context = Context> extends Cordis.Events<C> { }

export interface Context extends Cordis.Context {
  [Context.events]: Events<this>
}

export class Context extends Cordis.Context {
  app: Electron.App

  constructor() {
    super()

    this.app = Electron.app

    this.on('dispose', () => {
      if (process.platform !== 'darwin') {
        this.app.quit()
      }
    })
  }
}

//eslint-disable-next-line
export abstract class Service<T = any, C extends Context = Context> extends Cordis.Service<T, C> { }
