import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { ElectronLoader } from '@satoriapp/electron-loader'
import SatoriAdapter from '@satorijs/adapter-satori'
import { Context, Logger } from 'cordis'
import * as electorn from 'electron'
import started from 'electron-squirrel-startup'

import icon from '../../resources/icon.png?asset'
import { plugins } from './internals'
import WindowService from './window'

Logger.levels.base = 3

declare module 'cordis' {
  interface Context {
    app: electorn.App
    $version: string
    $env: { [key: string]: string }
    loaderRuntime: ElectronLoader<Context>
  }
}

let isQuiting = false

if (started) {
  isQuiting = true
  electorn.app.quit()
}

const app = new Context()
const loader = new ElectronLoader<Context>(app)
app.provide('loaderRuntime', loader, true)

app.provide('satori', undefined, true)
app.provide('bots', [], true)
app.provide('app', electorn.app, true)
app.set('$env', {
  MAIN_WINDOW_ICON: icon,
  MAIN_DEV_SERVER_URL: process.env.ELECTRON_RENDERER_URL,
  MAIN_PROD_FILE: fileURLToPath(new URL('../renderer/index.html', import.meta.url)),
  PRELOAD_PATH: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
})
app.set('$version', '0.1.0')

loader.registerMany(plugins.map(item => [{
  name: item.name,
  requires: item.meta?.service?.required,
  provides: item.meta?.service?.implements,
  capabilities: item.meta?.service?.optional,
  setup: (ctx, config) => {
    return ctx.plugin(item.plugin, config)
  },
}, undefined]))

loader.register(
  { name: 'adapter-satori', setup: (ctx, config) => ctx.plugin(SatoriAdapter, config) },
  undefined,
  'internal',
  '@satorijs/adapter-satori',
  'default',
)

const loaderConfigPath = resolve(electorn.app.getPath('home'), '.satori', 'config.json')
const externalPluginRoot = resolve(process.resourcesPath, 'plugin')

app.on('dispose', () => {
  isQuiting = true
  void loader.stop().catch((error) => {
    app.logger('loader').warn('failed to stop runtime plugins: %s', error instanceof Error ? error.message : String(error))
  })
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

electorn.app.on('ready', async () => {
  await loader.boot({
    configPath: loaderConfigPath,
    externalPluginRoot,
  })

  const rootConfig = loader.getRootConfig()
  app.plugin(WindowService, (rootConfig.window ?? rootConfig.$window ?? {
    theme: 'system',
    width: 1076,
    height: 653,
  }) as WindowService.Config)
  app.start()
})
