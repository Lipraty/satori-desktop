import type * as electron from 'electron'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ElectronLoader, PluginStore } from '@satoriapp/electron-loader'
import { Context } from 'cordis'
import * as electronModule from 'electron'
import started from 'electron-squirrel-startup'

import icon from '../../resources/icon.png?asset'
import { buildDefaultEntries, plugins } from './internals'

declare module 'cordis' {
  interface Context {
    app: electron.App
    baseDir: string
    version: string
    env: { [key: string]: string }
  }
}

if (started) {
  electronModule.app.exit(0)
}

const baseDir = resolve(electronModule.app.getPath('home'), '.satori-desktop')
const dbPath = resolve(baseDir, 'data.db')

const app = new Context()
app.baseUrl = pathToFileURL(`${baseDir}/`).href

app.provide('app', electronModule.app)
app.provide('env', {
  MAIN_WINDOW_ICON: icon,
  MAIN_DEV_SERVER_URL: process.env.ELECTRON_RENDERER_URL,
  MAIN_PROD_FILE: fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
  PRELOAD_PATH: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
})
app.provide('version', '0.1.0')
app.provide('baseDir', baseDir)

app.plugin(ElectronLoader, {
  baseDir,
  internals: plugins,
  defaultEntries: buildDefaultEntries(plugins, dbPath),
})
app.plugin(PluginStore, { baseDir })

let isShuttingDown = false

async function shutdown() {
  if (isShuttingDown)
    return
  isShuttingDown = true
  try {
    await app.fiber.dispose()
  }
  catch {}
  electronModule.app.exit(0)
}

electronModule.app.on('window-all-closed', () => {
  void shutdown()
})

electronModule.app.on('before-quit', (e) => {
  if (isShuttingDown)
    return
  e.preventDefault()
  void shutdown()
})

process.on('SIGINT', () => void shutdown())
process.on('SIGTERM', () => void shutdown())
process.on('SIGHUP', () => void shutdown())

electronModule.app.whenReady().then(() => app.fiber.await())
