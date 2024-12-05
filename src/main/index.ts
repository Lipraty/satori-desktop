export * from './context'

import * as path from 'node:path'

// Cordis plugin
import { HTTP as CordisHTTP } from '@cordisjs/plugin-http'
import { SQLiteDriver as Driver } from '@minatojs/driver-sqlite'
// Satori
import { Satori } from '@satorijs/core'

import { Context } from './context'
import { WindowService, isDarkTheme } from './external/windowManager'
import { SettingsManager } from './external/settingsManager'
import { IPCManager } from './external/ipcManager'
import { SystemManager } from './external/systemManager'
import { DevToolsManager } from './external/devToolsManager'
import { SatoriAppServer } from './external/satoriAppServer'
import { SnowflakeService } from './external/snowflakeService'

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
app.plugin(SnowflakeService, { machineId: 1 })
app.plugin(SatoriAppServer, {})
app.plugin(Driver, { path: path.join(app.dataDir, 'database.sqlite') })

app.start()
