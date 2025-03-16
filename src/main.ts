import { Context } from 'cordis'
import { app, App, nativeImage } from 'electron'
import stared from 'electron-squirrel-startup'
import { resolve } from 'node:path'
import fs from 'node:fs'

import Loader from './loader'
import pakcage from '../package.json'

declare module 'cordis' {
  interface Context {
    app: ElectronApp
    package: typeof pakcage
  }
}

export interface ElectronApp extends App {
  nativeImage: typeof nativeImage
}

let isQuiting = false

// If the app is started by Squirrel, quit the app
if (stared) {
  isQuiting = true
  app.quit()
}

// Load the app config
const appDataDir = resolve(app.getPath('userData'))
const configPath = resolve(appDataDir, 'config.json')
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({
    window: {
      theme: 'system',
      width: 800,
      height: 600
    }
  }, null, 2))
}

// Create the Cordis context
const ctx = new Context()
ctx.set('app', app)
ctx.provide('$package', pakcage, true)

// provide to the context.app
Object.defineProperty(ctx.app, 'nativeImage', nativeImage)

ctx.plugin(Loader)

// Lifecycle of Cordis
ctx.on('dispose', () => {
  isQuiting = true
  app.quit()
})

// Lifecycle of Electron
app.on('before-quit', (e) => {
  if (!isQuiting) {
    e.preventDefault()
    ctx.stop()
  }
})
app.on('ready', () => {
  ctx.start()
})
