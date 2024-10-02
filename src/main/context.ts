import { resolve } from 'node:path'
import * as Electron from 'electron'

import * as Cordis from 'cordis'
import * as Minato from 'minato'

export interface Events<C extends Context = Context> extends Cordis.Events<C> { }

export interface Context extends Cordis.Context {
  [Context.events]: Events<this>
}

export class Context extends Cordis.Context {
  app: Electron.App
  appImage: Electron.NativeImage
  dataDir: string

  constructor() {
    super()

    this.app = Electron.app
    this.appImage = Electron.nativeImage.createFromPath(`../shared/assets/icon.png`)
    this.dataDir = resolve(this.app.getPath('userData'))

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    this.plugin(Minato.Database)

    this.on('dispose', () => {
      if (process.platform !== 'darwin') {
        this.app.quit()
      }
    })
  }
}

//eslint-disable-next-line
export abstract class Service<T = any, C extends Context = Context> extends Cordis.Service<T, C> { }
