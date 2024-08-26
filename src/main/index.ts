export * from './context'

import * as path from 'node:path'

// Cordis plugin
import { default as CordisHTTP } from '@cordisjs/plugin-http'
// Satori
import { default as Satori } from '@satorijs/core'
import { default as AdapterSatori } from '@satorijs/adapter-satori'

import { Context } from './context'
import { WindowService, isDarkTheme } from './external/windowManager'
import { SettingsManager } from './external/settingsManager'
import { IPCManager } from './external/ipcManager'
import { SystemManager } from './external/systemManager'
import { DevToolsManager } from './external/devToolsManager'
import { SatoriBridge } from './external/satoriBridge'

const app = new Context()

// TODO: loader
app.plugin<SettingsManager.Config>(SettingsManager, {})
app.plugin<IPCManager.Config>(IPCManager, {})
app.plugin<SystemManager.Config>(SystemManager, {})
app.plugin<WindowService.Config>(WindowService, {
  width: 1076,
  height: 653,
  titleBarStyle: 'hidden',
  maximizable: false, // https://github.com/electron/electron/issues/42393
  titleBarOverlay: {
    symbolColor: isDarkTheme() ? '#ffffff' : '#000000',
    color: '#00000000',
    height: 44,
  },
  backgroundMaterial: 'mica',
  backgroundColor: '#00000000',
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
})
app.plugin(DevToolsManager, {})
app.plugin(Satori)
app.plugin(CordisHTTP, {})
app.inject(['satori'], satori => {
  satori.plugin(AdapterSatori, {
    endpoint: 'http://localhost:5500',
    token: '8f69490142b1da3ed0968e8658aa12af49a3774fc5c9ccc65f1b31b0cb152f3b'
  })
})
app.plugin(SatoriBridge, {})

app.start()
