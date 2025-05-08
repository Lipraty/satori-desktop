import * as electorn from 'electron'
import { fileURLToPath } from 'url'
import { Context } from 'cordis'

import SatoriApp from '@satoriapp/app'
import Loader from '@satoriapp/loader'

import icon from '../../resources/icon.png?asset'
import WindowService from './window'

import started from 'electron-squirrel-startup'

declare module 'cordis' {
  interface Context {
    electron: typeof electorn
    $env: { [key: string]: string }
  }
}

let isQuiting = false

if (started) {
  isQuiting = true
  electorn.app.quit()
}

const app = new Context()

app.provide('electorn', electorn, true)
app.provide('satori', undefined, true)
app.provide('bots', [], true)
app.provide('$env', {
  MAIN_WINDOW_ICON: icon,
  MAIN_DEV_SERVER_URL: process.env['ELECTRON_RENDERER_URL'],
  MAIN_PROD_FILE: fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
  PRELOAD_PATH: fileURLToPath(new URL('../preload/index.mjs', import.meta.url))
}, true)


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
  app.plugin(SatoriApp)
  app.plugin(Loader)
  app.plugin(WindowService, app.loader.config['$window'] || {
    theme: 'system',
    width: 1076,
    height: 653,
  })
  app.start()
})
