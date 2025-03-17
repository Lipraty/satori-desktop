import * as cordis from 'cordis'
import { App, createApp } from 'vue'
import Root from './App.vue'

export class Context extends cordis.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(Root)

    this.on('ready', () => {
      this.app.mount('#app')
    })
  }
}
