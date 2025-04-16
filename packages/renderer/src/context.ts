import * as core from '@satoriapp/core'
import { App, createApp, inject, InjectionKey, markRaw, onScopeDispose } from 'vue'
import { webUtils } from 'electron/renderer'

import Root from './client/App.vue'

const rootContext = Symbol('context') as InjectionKey<Context>

export function useContext() {
  const parent = inject(rootContext)!
  const fork = parent.plugin(() => { })
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export class Context extends core.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(Root)
    this.app.provide(rootContext, this)
    this.on('ready', () => {
      this.app.mount('#app')
    })
  }

  getPathForFile(file: File) {
    return webUtils.getPathForFile(file)
  }
}

markRaw(core.Context.prototype)
