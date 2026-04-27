import type { ElectronAPI } from '@electron-toolkit/preload'
import type { App, Component, InjectionKey } from 'vue'
import * as cordis from 'cordis'
import { createApp, defineComponent, h, inject, markRaw, onScopeDispose, provide, resolveComponent } from 'vue'

import { form } from '@satoriapp/schemastery'
import { install } from './components'
import DefaultLayout from './components/layout.vue'
import I18nService from './plugins/i18n'
import LoaderService from './plugins/loader'
import RouterService from './plugins/router'
import SettingService from './plugins/setting'
import SlotService from './plugins/slot'
import ThemeService from './plugins/theme'
import { FrontendStateService } from './plugins/state'

const rootContext = Symbol('context') as InjectionKey<Context>
const osMap = {
  macos: ['macOS', 'darwin', 'Mac OS X'],
  win: ['windows', 'win32', 'Windows'],
  linux: ['linux', 'Linux'],
}

export type PlatformType = 'electron' | 'cirno' | 'web'

export interface CirnoAPI {
  version?: string
  chromium?: string
}

export interface Versions {
  Electron?: string
  Cirno?: string
  Chromium: string
  Node?: string
  V8?: string
}

export interface System {
  platform: PlatformType
  versions: Versions
  electron?: ElectronAPI
  cirno?: CirnoAPI
}

export function useContext() {
  const parent = inject(rootContext)!
  const scope = Object.assign(() => {}, { inject: ['link', 'stater', 'router'] })
  const fork = parent.plugin(scope)
  onScopeDispose(fork.dispose)
  return fork.ctx
}

export interface Events<C extends Context = Context> extends cordis.Events<C> {}

export interface Context {
  [Context.events]: Events<this>
}

export class Context extends cordis.Context {
  app: App

  constructor() {
    super()
    this.app = createApp(this.component(defineComponent({
      setup: () => () => h(resolveComponent('satori-root')),
    })))
    this.app.provide(rootContext, this)

    this.plugin(FrontendStateService)
    this.plugin(LoaderService)
    this.plugin(RouterService)
    this.plugin(I18nService)
    this.plugin(SettingService)
    this.plugin(ThemeService)
    this.plugin(SlotService)

    this.on('ready', () => {
      this.slot({ type: 'root', component: DefaultLayout, order: 0 })

      this.app
        .use(form)
        .use(this.$i18n.i18n)
        .use(this.$router.router)
        .use(install)
        .mount('#app')
    })
  }

  get os(): keyof typeof osMap | 'unknown' {
    return this.getOS()
  }

  get versions(): Versions {
    const win = window as Window & {
      electron?: ElectronAPI
      cirno?: CirnoAPI
    }

    return {
      Electron: win.electron?.process?.versions?.electron || undefined,
      Cirno: win.cirno?.version || undefined,
      Chromium: win.electron?.process?.versions?.chrome || win.cirno?.chromium || navigator.userAgent,
      Node: win.electron?.process?.versions?.node || undefined,
    }
  }

  get platform(): PlatformType {
    return 'electron' in window ? 'electron' : 'cirno' in window ? 'cirno' : 'web'
  }

  get system(): System {
    const win = window as Window & { electron?: ElectronAPI, cirno?: CirnoAPI }
    return {
      platform: this.platform,
      versions: this.versions,
      electron: 'electron' in window ? win.electron : undefined,
      cirno: 'cirno' in window ? win.cirno : undefined,
    }
  }

  component(component: Component) {
    return defineComponent((props, { slots }) => {
      provide(rootContext, this)
      return () => h(component, props, slots)
    })
  }

  private getOS(): keyof typeof osMap | 'unknown' {
    if ('userAgentData' in navigator) {
      const uad = navigator.userAgentData as { platform?: string } | undefined
      const platform = uad?.platform
      if (platform) {
        for (const [key, values] of Object.entries(osMap)) {
          if (values.some(v => platform.includes(v))) {
            return key as keyof typeof osMap
          }
        }
      }
      return 'unknown'
    }
    const ua = navigator.userAgent
    for (const [key, values] of Object.entries(osMap)) {
      if (values.some(v => ua.includes(v))) {
        return key as keyof typeof osMap
      }
    }
    return 'unknown'
  }
}

markRaw(cordis.Context.prototype)
