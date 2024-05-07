export * from './context'

import * as path from 'node:path'

import { Context } from './context'
import { WindowService } from './windowManager'

const app = new Context()

app.plugin<WindowService.Config>(WindowService, {
  width: 1076,
  height: 653,
  titleBarStyle: 'hidden',
  titleBarOverlay: {
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
