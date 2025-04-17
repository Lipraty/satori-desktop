import * as electorn from 'electron'
import stared from 'electron-squirrel-startup'
import { Context } from '@satoriapp/main'
import Loader from '@satoriapp/loader'
import Satori from '@satorijs/core'

let isQuiting = false

// If the app is started by Squirrel, quit the app
if (stared) {
  isQuiting = true
  electorn.app.quit()
}

// Create the Cordis context
const app = new Context({
  env: {
    MAIN_WINDOW_VITE_DEV_SERVER_URL,
    MAIN_WINDOW_VITE_NAME,
  }
})

app.provide('satori', undefined, true)
app.provide('bots', [], true)

// @ts-ignore
app.plugin(Loader?.default || Loader)
// @ts-ignore
app.plugin(Satori?.default || Satori)

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
  app.start()
})
