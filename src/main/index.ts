export * from './context'

import * as path from 'node:path'

import { Context } from './context'
import { WindowService, isDarkTheme } from './windowManager'
import { SettingsManager } from './settingsManager'
import { IPCManager } from './ipcManager'
import { SystemManager } from './systemManager'

const app = new Context()

// TODO: loader
app.plugin<SettingsManager.Config>(SettingsManager, {})
app.plugin<IPCManager.Config>(IPCManager, {})
app.plugin<SystemManager.Config>(SystemManager, {})
app.plugin<WindowService.Config>(WindowService, {
  width: 1076,
  height: 653,
  titleBarStyle: 'hidden',
  titleBarOverlay: {
    symbolColor: isDarkTheme() ? '#ffffff' : '#000000',
    color: '#00000000',
    height: 44,
  },
  backgroundMaterial: 'mica',
  backgroundColor: '#00000000',
  maximizable: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
})

app.start()
