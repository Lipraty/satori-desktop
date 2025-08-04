import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { APP_VERSION } from '@satoriapp/app'
import Loader from '@satoriapp/loader'
import { Context } from 'cordis'
import * as electorn from 'electron'
import started from 'electron-squirrel-startup'

import icon from '../../resources/icon.png?asset'
import { plugins } from './internals'
import WindowService from './window'

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
  MAIN_DEV_SERVER_URL: process.env.ELECTRON_RENDERER_URL,
  MAIN_PROD_FILE: fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
  PRELOAD_PATH: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
})
app.set('$version', APP_VERSION)

app.dataDir = resolve(electorn.app.getPath('home'), '.sapp')
app.plugin(Loader)
app.inject(['loader', 'app'], (ctx) => {
  ctx.loader._mixins(plugins)
  ctx.loader.init()
})

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
  app.plugin(WindowService, app.loader.config.$window || {
    theme: 'system',
    width: 1076,
    height: 653,
  })
  app.start()
})
