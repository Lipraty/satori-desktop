import * as cordis from 'cordis'
import { App, createApp, inject, InjectionKey, markRaw, onScopeDispose } from 'vue'
import Root from './App.vue'

const SatoriContext = Symbol('context') as InjectionKey<Context>

export function useContext() {
  const parent = inject(SatoriContext)!
  const fork = parent.plugin(()=>{})
  console.log('fork', fork)
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export class Context extends cordis.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(Root)
    this.app.provide(SatoriContext, this)
    this.on('ready', () => {
      this.app.mount('#app')
    })
  }
}

markRaw(cordis.Context.prototype)
