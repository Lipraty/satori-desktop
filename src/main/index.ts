export * from './context'

import * as path from 'node:path'

import { Context } from './context'
import { WindowService } from './windowManager'

const app = new Context()

app.plugin(WindowService, {
  width: 1076,
  height: 653,
  titleBarStyle: 'hidden',
  titleBarOverlay: true,
  backgroundMaterial: 'mica',
  backgroundColor: 'transparent',
  useContextSize: true,
  maximizable: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
})

app.start()
