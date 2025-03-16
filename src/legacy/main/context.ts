import { resolve } from 'node:path'
import * as Electron from 'electron'

import * as Cordis from 'cordis'
import * as Minato from 'minato'
import { } from 'minato'

import SatoriAppDatabase ,{ AppMessage, AppContact } from './database'

export interface Events<C extends Context = Context> extends Cordis.Events<C> { }

export interface Types extends Minato.Types { }
export interface Tables extends Minato.Tables {
  message: AppMessage
  contact: AppContact
}

export interface Context extends Cordis.Context {
  [Context.events]: Events<this>
  [Minato.Types]: Types,
  [Minato.Tables]: Tables
}

export namespace Context {
  export interface Config { }
}

export class Context extends Cordis.Context {
  app: Electron.App
  electron: typeof Electron
  appImage: Electron.NativeImage
  dataDir: string

  constructor() {
    super()

    const logger = new Cordis.Logger('main')
    logger.info('Starting application [', process.platform, ']')

    this.app = Electron.app
    this.electron = Electron
    this.appImage = Electron.nativeImage.createFromPath(`../shared/assets/icon.png`)
    this.dataDir = resolve(this.app.getPath('userData'))

    logger.info('Data directory:', this.dataDir)

    this.on('dispose', () => {
      logger.info('Disposing application')
      if (process.platform !== 'darwin') {
        this.app.quit()
      }
    })
  }
}

//eslint-disable-next-line
export abstract class Service<T = any, C extends Context = Context> extends Cordis.Service<T, C> { }
