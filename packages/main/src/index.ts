import { Context } from '@satoriapp/core'
//? 
import { } from 'electron'
import * as electron from 'electron/main'
import started from 'electron-squirrel-startup'
import SatoriCore from '@satorijs/core'

declare module '@satoriapp/core' {
  interface Context {
    electron: typeof electron
  }
}

let isQuitting = false

// If the app is started by Squirrel, quit the app
if (started) {
  isQuitting = true
  electron.app.quit()
}

const root = new Context()
root.provide('satori', undefined, true)
root.provide('bots', [], true)
root.provide('electron', electron, true)
root.plugin(SatoriCore)

root.on('dispose', () => {
  isQuitting = true
  root.electron.app.quit()
})

// Lifecycle of Electron
electron.app.on('before-quit', (e) => {
  if (!isQuitting) {
    e.preventDefault()
    root.stop()
  }
})
electron.app.on('ready', () => {
  root.start()
})
