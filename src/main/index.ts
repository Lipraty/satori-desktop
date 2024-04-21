export * from './context'

import { Context } from './context'
import { WindowService } from './windowManager'
import * as path from 'node:path'

const app = new Context()

app.plugin(WindowService, {
  width: 800,
  height: 600,
  titleBarStyle: 'hidden',
  titleBarOverlay: true,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
  },
})

app.start()
