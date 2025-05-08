import * as electorn from 'electron'
import stared from 'electron-squirrel-startup'
import { Context } from 'cordis'

import SatoriApp from '@satoriapp/app'
import Loader from '@satoriapp/loader'

declare module 'cordis' {
  interface Context {
    electron: typeof electorn
    $env: {
      PRELOAD_PATH: string
      MAIN_DEV_SERVER_URL: string
      MAIN_PROD_FILE: string
    }
  }
}

let isQuiting = false

// If the app is started by Squirrel, quit the app
if (stared) {
  isQuiting = true
  electorn.app.quit()
}

// Create the Cordis context
const app = new Context()

app.provide('electorn', electorn, true)
app.provide('satori', undefined, true)
app.provide('bots', [], true)
app.provide('$env', {
  PRELOAD_PATH: `${__dirname}/preload.js`,
  MAIN_DEV_SERVER_URL: MAIN_WINDOW_VITE_DEV_SERVER_URL,
  MAIN_PROD_FILE: MAIN_WINDOW_VITE_NAME,
})

// Lifecycle of Cordis
app.on('dispose', () => {
  isQuiting = true
  electorn.app.quit()
})

// Lifecycle of Electron
electorn.app.on('before-quit', (e) => {
  if (!isQuiting) {
    e.preventDefault()
    app.stop()
  }
})
electorn.app.on('ready', () => {
  app.plugin(SatoriApp)
  app.plugin(Loader)
  app.start()
})
