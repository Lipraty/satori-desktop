/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as cordis from 'cordis'
import { App, Component, createApp, defineComponent, h, inject, InjectionKey, markRaw, onScopeDispose, provide, resolveComponent } from 'vue'
import { Events as SharedEvents } from '@satoriapp/common'
import { setTheme } from '@fluentui/web-components'
import { webLightTheme, webDarkTheme } from '@fluentui/tokens'

import RouterService from './plugins/router'
import { install } from './components'

const rootContext = Symbol('context') as InjectionKey<Context>
const platformMap = {
  macos: ['macOS', 'darwin', 'Mac OS X'],
  win: ['windows', 'win32', 'Windows'],
  linux: ['linux', 'Linux'],
}

export function useContext() {
  const parent = inject(rootContext)!
  const fork = parent.plugin(() => { })
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export interface Context {
  [Context.events]: Events
}

export interface Events<C extends Context = Context> extends SharedEvents<C> {
  'internal/theme': (theme: 'light' | 'dark') => void
}

export class Context extends cordis.Context {
  app: App
  theme: 'light' | 'dark' = 'light'

  constructor() {
    super()
    this.app = createApp(this.component(defineComponent({
      setup: () => () => h(resolveComponent('satori-root')),
    })))
    this.app.provide(rootContext, this)

    this.plugin(RouterService)

    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
    this.theme = themeMedia.matches ? 'dark' : 'light'
    // @ts-ignore
    this.emit('internal/theme', this.theme)
    this.effect(() => {
      themeMedia.addEventListener('change', e => {
        this.theme = e.matches ? 'dark' : 'light'
        // @ts-ignore
        this.emit('internal/theme', this.theme)
      })
      return () => themeMedia.removeEventListener('change', () => { })
    })

    this.on('ready', () => {
      this.app
        .use(this.$router.router)
        .use(install)
        .mount('#app')

      setTheme(this.theme === 'dark' ? webDarkTheme : webLightTheme)
    })

    this.on('internal/theme', (theme) => {
      setTheme(theme === 'dark' ? webDarkTheme : webLightTheme)
    })
  }

  component(component: Component) {
    return defineComponent((props, { slots }) => {
      provide(rootContext, this)
      return () => h(component, props, slots)
    })
  }

  getPlatform(): keyof typeof platformMap | 'unknown' {
    if ('userAgentData' in navigator) {
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
