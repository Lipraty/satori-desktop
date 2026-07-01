import type { ElectronAPI } from '@electron-toolkit/preload'
import type { App, Component, DefineComponent, Ref } from 'vue'
import * as cordis from 'cordis'
import { Service } from 'cordis'
import Logger from '@cordisjs/plugin-logger'
import { createApp, customRef, defineComponent, h, markRaw, onErrorCaptured, provide, resolveComponent, watchEffect } from 'vue'

import { form } from '@satoriapp/schemastery'
import { install } from './components'
import { kContext } from './context'
import ActionService from './plugins/action'
import I18nService from './plugins/i18n'
import LoaderService from './plugins/loader'
import type { LoadState } from './plugins/loader'
import RouterService from './plugins/router'
import SettingService, { useConfig } from './plugins/setting'
import ThemeService from './plugins/theme'
import { FrontendStateService } from './plugins/state'

export { Theme } from './components/themes'
export * from './context'
export * from './data'
export * from './plugins/action'
export * from './plugins/i18n'
export * from './plugins/loader'
export * from './plugins/router'
export * from './plugins/setting'
export { FrontendStateService } from './plugins/state'
export * from './plugins/theme'
export * from './utils'

const osMap = {
  macos: ['macOS', 'darwin', 'Mac OS X'],
  win: ['windows', 'win32', 'Windows'],
  linux: ['linux', 'Linux'],
} satisfies Record<string, string[]>

export type OSKey = keyof typeof osMap | 'unknown'
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

declare module 'cordis' {
  interface Context {
    client: ClientService
    $entry?: LoadState
    readonly os: OSKey
    readonly versions: Versions
    readonly platform: PlatformType
  }
}

export interface ActionContext {}

export interface Config {
  locale?: string
}

interface NavigatorUAData {
  platform?: string
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: NavigatorUAData
}

export class ClientService extends Service {
  public app: App

  public action: ActionService
  public loader: LoaderService
  public router: RouterService
  public setting: SettingService
  public theme: ThemeService
  public i18n: I18nService

  private _store: Record<string | symbol, Ref<unknown>> = Object.create(null)

  constructor(ctx: cordis.Context) {
    super(ctx, 'client')

    ctx.root.$entry = undefined as LoadState | undefined

    this.app = createApp(defineComponent({
      setup: () => () => [
        h(resolveComponent('k-slot'), { name: 'root', single: true }),
        h(resolveComponent('k-slot'), { name: 'global' }),
      ],
    }))
    this.app.provide(kContext, ctx as cordis.Context)
    this.app.use(install)

    this.action = new ActionService(ctx)
    this.loader = new LoaderService(ctx)
    this.router = new RouterService(ctx)
    this.setting = new SettingService(ctx)
    this.theme = new ThemeService(ctx)
    this.i18n = new I18nService(ctx)

    const store = this._store

    ctx.on('internal/service', function (this: cordis.Context, name: string) {
      // eslint-disable-next-line no-restricted-syntax
      const ref1 = store[(this as any)[cordis.Context.isolate][name]]
      if (ref1)
        ref1.value = Symbol(name)
      const ref2 = store[name]
      if (ref2)
        ref2.value = Symbol(name)
    }, { global: true })

    ctx.on('internal/get', (childCtx, name, _error, next) => {
      const ref = store[childCtx.reflect.store[name] ?? name] ??= customRef((get, set) => ({ get, set }))
      void ref.value
      return next()
    }, { prepend: true })

    const _config = useConfig()
    ctx.effect(() => watchEffect(() => {
      // locale sync handled by i18n plugin
    }, { flush: 'post' }))

    this.loader.initTask.then(() => {
      this.app.use(form)
      this.app.use(this.i18n.i18n)
      this.app.use(this.router.router)
      this.app.mount('#app')
    })
  }

  addEventListener<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ) {
    return this.ctx.effect(() => {
      window.addEventListener(type, listener, options)
      return () => window.removeEventListener(type, listener, options)
    })
  }

  wrapComponent(component: Component): DefineComponent
  wrapComponent(component?: Component): DefineComponent | undefined
  wrapComponent(component: Component) {
    if (!component)
      return undefined
    if (!this.ctx.$entry)
      return component
    return markRaw(defineComponent((props, { slots }) => {
      provide(kContext, this.ctx as cordis.Context)
      onErrorCaptured(() => {
        return this.ctx.fiber.uid !== null
      })
      return () => h(component, props, slots)
    }))
  }

  mount(selector = '#app') {
    this.app.mount(selector)
  }
}

export class Context extends cordis.Context {
  get os(): OSKey {
    return getOS()
  }

  get versions(): Versions {
    const win = window as Window & { electron?: ElectronAPI, cirno?: CirnoAPI }
    return {
      Electron: win.electron?.process?.versions?.electron,
      Cirno: win.cirno?.version,
      Chromium: win.electron?.process?.versions?.chrome || win.cirno?.chromium || navigator.userAgent,
      Node: win.electron?.process?.versions?.node,
    }
  }

  get platform(): PlatformType {
    return 'electron' in window ? 'electron' : 'cirno' in window ? 'cirno' : 'web'
  }
}

function getOS(): OSKey {
  if (typeof navigator === 'undefined')
    return 'unknown'
  const nav: NavigatorWithUAData = navigator
  const uadPlatform = nav.userAgentData?.platform
  if (uadPlatform) {
    for (const [key, values] of Object.entries(osMap)) {
      if (values.some(v => uadPlatform.includes(v)))
        return key as OSKey
    }
  }
  const ua = navigator.userAgent
  for (const [key, values] of Object.entries(osMap)) {
    if (values.some(v => ua.includes(v)))
      return key as OSKey
  }
  return 'unknown'
}

export const root = new Context()
root.plugin(Logger)
root.plugin(FrontendStateService)
const client = new ClientService(root)
export { client }

root.on('activity', data => !data)
