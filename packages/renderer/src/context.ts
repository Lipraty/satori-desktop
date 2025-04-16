import * as cordis from 'cordis'
import { App, createApp, defineComponent, h, inject, InjectionKey, markRaw, onScopeDispose } from 'vue'
import { webUtils } from 'electron'

const rootContext = Symbol('context') as InjectionKey<Context>

export function useContext() {
  const parent = inject(rootContext)!
  const fork = parent.plugin(() => { })
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export class Context extends cordis.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(defineComponent({
      setup() {
        return () => {
          h('div', null, 'foo')
        }
      }
    }))
    this.app.provide(rootContext, this)
    this.on('ready', () => {
      this.app.mount('#app')
    })
  }

  getPathForFile(file: File) {
    return webUtils.getPathForFile(file)
  }
}

markRaw(cordis.Context.prototype)
