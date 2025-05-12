import * as electorn from 'electron'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { Context } from 'cordis'
import started from 'electron-squirrel-startup'
import Loader from '@satoriapp/loader'
import { APP_VERSION } from '@satoriapp/app'

import icon from '../../resources/icon.png?asset'
import WindowService from './window'
import { plugins } from './internals'

declare module 'cordis' {
  interface Context {
    app: electorn.App
    $version: string
    $env: { [key: string]: string }
  }
}

let isQuiting = false

if (started) {
  isQuiting = true
  electorn.app.quit()
}

const app = new Context()

app.provide('satori', undefined, true)
app.provide('bots', [], true)
app.provide('app', electorn.app, true)
app.set('$env', {
  MAIN_WINDOW_ICON: icon,
  MAIN_DEV_SERVER_URL: process.env['ELECTRON_RENDERER_URL'],
  MAIN_PROD_FILE: fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
  PRELOAD_PATH: fileURLToPath(new URL('../preload/index.mjs', import.meta.url))
})
app.set('$version', APP_VERSION)

app.dataDir = resolve(electorn.app.getPath('home'), '.sapp')
app.plugin(Loader)
app.loader._mixins(plugins)

app.on('dispose', () => {
  isQuiting = true
  electorn.app.quit()
})

electorn.app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    electorn.app.quit()
  }
})

electorn.app.on('before-quit', (e) => {
  if (!isQuiting) {
    e.preventDefault()
    app.stop()
  }
})

electorn.app.on('ready', () => {
  app.plugin(WindowService, app.loader.config['$window'] || {
    theme: 'system',
    width: 1076,
    height: 653,
  })
  app.start()
})
