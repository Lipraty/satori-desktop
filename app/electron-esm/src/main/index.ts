import * as electorn from 'electron'
import { fileURLToPath } from 'url'
import { Context } from '@satoriapp/main'
import Loader from '@satoriapp/loader'
import Satori from '@satorijs/core'
import icon from '../../resources/icon.png?asset'

import started from 'electron-squirrel-startup'

let isQuiting = false

if (started) {
  isQuiting = true
  electorn.app.quit()
}
console.log(fileURLToPath(new URL('../preload/index.mjs', import.meta.url)))
const app = new Context({
  env: {
    MAIN_WINDOW_ICON: icon,
    MAIN_DEV_SERVER_URL: process.env['ELECTRON_RENDERER_URL'],
    MAIN_PROD_FILE: fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
    PRELOAD_PATH: fileURLToPath(new URL('../preload/index.mjs', import.meta.url))
  }
})

app.provide('satori', undefined, true)
app.provide('bots', [], true)

app.plugin(Loader)
app.plugin(Satori)

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
  app.start()
})
