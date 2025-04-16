import * as electorn from 'electron'
import started from 'electron-squirrel-startup'
import { Context } from '@satoriapp/main'
import Loader from '@satoriapp/loader'
import Satori from '@satorijs/core'

let isQuitting = false

if (started) {
  isQuitting = true
  electorn.app.quit()
}

const app = new Context()
app.provide('satori', undefined, true)
app.provide('bots', [], true)
// @ts-ignore
app.plugin(Loader?.default || Loader)
// @ts-ignore
app.plugin(Satori?.default || Satori)

app.on('dispose', () => {
  isQuitting = true
  electorn.app.quit()
})

electorn.app.whenReady().then(() => {
  app.start()
})

electorn.app.on('before-quit', (e) => {
  if (!isQuitting) {
    e.preventDefault()
    app.stop()
  }
})
