import * as cordis from 'cordis'
import { App, Component, createApp, defineComponent, h, inject, InjectionKey, markRaw, onScopeDispose, provide } from 'vue'
import { Events as SharedEvents } from '@satoriapp/common'
import Root from './client/App.vue'

import RouterService from './plugins/router'

const rootContext = Symbol('context') as InjectionKey<Context>

export function useContext() {
  const parent = inject(rootContext)!
  const fork = parent.plugin(() => { })
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export interface Events<C extends Context = Context> extends SharedEvents<C> { }
export abstract class Service<T = any, C extends Context = Context> extends cordis.Service<T, C> { }

export class Context extends cordis.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(Root)
    this.app.provide(rootContext, this)
    this.plugin(RouterService)
    this.on('ready', () => {
      this.app.use(this.$router.router)
      this.app.mount('#app')
    })
  }

  component(component: Component) {
    return defineComponent((props, { slots }) => {
      provide(rootContext, this)
      return () => h(component, props, slots)
    })
  }
}

markRaw(cordis.Context.prototype)
