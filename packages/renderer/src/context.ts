import * as cordis from 'cordis'
import { App, createApp, defineComponent, h, inject, InjectionKey, markRaw, onScopeDispose } from 'vue'
import { Events as SharedEvents } from '@satoriapp/common'
import Root from './client/App.vue'

const rootContext = Symbol('context') as InjectionKey<Context>

export function useContext() {
  const parent = inject(rootContext)!
  const fork = parent.plugin(() => { })
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export interface Events<C extends Context = Context> extends SharedEvents<C> { }

export class Context extends cordis.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(Root)
    this.app.provide(rootContext, this)
    this.on('ready', () => {
      this.app.mount('#app')
    })
  }
}

markRaw(cordis.Context.prototype)
