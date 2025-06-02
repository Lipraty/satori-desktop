import * as cordis from 'cordis'
import { App, Component, createApp, defineComponent, h, inject, InjectionKey, markRaw, onScopeDispose, provide, resolveComponent } from 'vue'
import { setTheme } from '@fluentui/web-components'

import RouterService from './plugins/router'
import { install } from './components'
import { Theme } from './components/themes'

const rootContext = Symbol('context') as InjectionKey<Context>
const platformMap = {
  macos: ['macOS', 'darwin', 'Mac OS X'],
  win: ['windows', 'win32', 'Windows'],
  linux: ['linux', 'Linux'],
}

export interface Versions {
  Runtime: 'electron' | 'cirno' | 'web'
  Electorn?: string
  Cirno?: string
  Chromium: string
  Node?: string
  V8?: string
}

export function useContext() {
  const parent = inject(rootContext)!
  const fork = parent.plugin(() => { })
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export interface Events<C extends Context = Context> extends cordis.Events<C> {
  'internal/theme': (theme: Theme.Mode) => void
}

export interface Context {
  [Context.events]: Events<this>
}

export class Context extends cordis.Context {
  app: App
  theme: Theme.Mode = 'light'
  token: Theme.Token = 'koishi'

  constructor() {
    super()
    this.app = createApp(this.component(defineComponent({
      setup: () => () => h(resolveComponent('satori-root')),
    })))
    this.app.provide(rootContext, this)

    this.plugin(RouterService)

    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
    this.theme = themeMedia.matches ? 'dark' : 'light';
    (this as Context).emit('internal/theme', this.theme)
    this.effect(() => {
      themeMedia.addEventListener('change', e => {
        this.theme = e.matches ? 'dark' : 'light';
        (this as Context).emit('internal/theme', this.theme)
      })
      return () => themeMedia.removeEventListener('change', () => { })
    })

    this.on('ready', () => {
      this.app
        .use(this.$router.router)
        .use(install)
        .mount('#app')

      setTheme(Theme.getTheme(this.token, this.theme))
    })

    this.on('internal/theme', (theme) => {
      setTheme(Theme.getTheme(this.token, theme))
    })
  }

  get versions(): Versions {
    return {
      Runtime: 'electron' in window ? 'electron' : 'cirno' in window ? 'cirno' : 'web',
      Electorn: window?.electron?.process.versions.electron || undefined,
      Cirno: window?.cirno?.version || undefined,
      Chromium: window?.electron?.process.versions.chrome || window?.cirno?.chromium || navigator.userAgent,
      Node: window?.electron?.process.versions.node || undefined,
    }
  }

  component(component: Component) {
    return defineComponent((props, { slots }) => {
      provide(rootContext, this)
      return () => h(component, props, slots)
    })
  }

  getPlatform(): keyof typeof platformMap | 'unknown' {
    if ('userAgentData' in navigator) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const { platform } = navigator.userAgentData
      if (platform) {
        for (const [key, values] of Object.entries(platformMap)) {
          if (values.some((v) => platform.includes(v))) {
            return key as keyof typeof platformMap
          }
        }
        return 'unknown'
      } else {
        return 'unknown'
      }
    } else {
      const ua = navigator.userAgent
      for (const [key, values] of Object.entries(platformMap)) {
        if (values.some((v) => ua.includes(v))) {
          return key as keyof typeof platformMap
        }
      }
      return 'unknown'
    }
  }
}

markRaw(cordis.Context.prototype)
