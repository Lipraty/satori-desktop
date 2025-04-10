import * as core from '@satoriapp/core'
import { App, createApp, inject, InjectionKey, markRaw, onScopeDispose } from 'vue'
import Root from './client/App.vue'

const RootContext = Symbol('context') as InjectionKey<Context>

export function useContext() {
  const parent = inject(RootContext)!
  const fork = parent.plugin(()=>{})
  console.log('fork', fork)
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export class Context extends core.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(Root)
    this.app.provide(RootContext, this)
    this.on('ready', () => {
      this.app.mount('#app')
    })
  }
}

markRaw(core.Context.prototype)
