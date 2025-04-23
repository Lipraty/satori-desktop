import * as cordis from 'cordis'
import { App, Component, createApp, defineComponent, h, inject, InjectionKey, markRaw, onScopeDispose, provide, resolveComponent } from 'vue'
import { Events as SharedEvents } from '@satoriapp/common'

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
    this.app = createApp(this.component(defineComponent({
      setup: () => () => h(resolveComponent('router-view'))
    })))
    this.app.provide(rootContext, this)
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
