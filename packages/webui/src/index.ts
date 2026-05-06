import type { ElectronAPI } from '@electron-toolkit/preload'
import type { App, Component, Ref } from 'vue'
import * as cordis from 'cordis'
import { Service } from 'cordis'
import Logger from '@cordisjs/plugin-logger'
import { createApp, customRef, defineComponent, h, markRaw, onErrorCaptured, provide, resolveComponent } from 'vue'

import { form } from '@satoriapp/schemastery'
import { install } from './components'
import { kContext } from './context'
import I18nService from './plugins/i18n'
import LoaderService from './plugins/loader'
import RouterService from './plugins/router'
import SettingService from './plugins/setting'
import ThemeService from './plugins/theme'
import { FrontendStateService } from './plugins/state'

export { Theme } from './components/themes'
export * from './context'
export * from './data'
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
    readonly os: OSKey
    readonly versions: Versions
    readonly platform: PlatformType
  }
}

interface NavigatorUAData {
  platform?: string
}

interface NavigatorWithUAData extends Navigator {
  userAgentData?: NavigatorUAData
}

export class ClientService extends Service {
  public app: App

  public router: RouterService
  public setting: SettingService
  public theme: ThemeService
  public i18n: I18nService
  public loader: LoaderService

  private _store: Record<string | symbol, Ref<unknown>> = Object.create(null)

  constructor(ctx: cordis.Context) {
    super(ctx, 'client')

    this.app = createApp(defineComponent({
      setup: () => () => h(resolveComponent('satori-root')),
    }))
    this.app.provide(kContext, ctx)
    this.app.use(install)

    this.router = new RouterService(ctx)
    this.setting = new SettingService(ctx)
    this.theme = new ThemeService(ctx)
    this.i18n = new I18nService(ctx)
    this.loader = new LoaderService(ctx)

    this.app
      .use(form)
      .use(this.i18n.i18n)
      .use(this.router.router)

    const store = this._store
    // eslint-disable-next-line prefer-arrow-callback
    ctx.on('internal/service', function (this: cordis.Context, name: string) {
      const ref = store[name]
      if (ref)
        ref.value = Symbol(name)
    }, { global: true })

    ctx.on('internal/get', (childCtx, name, _error, next) => {
      const ref = store[name] ??= customRef((get, set) => ({ get, set }))
      void ref.value
      const value = childCtx.reflect.get(name, false)
      if (value !== undefined)
        return value
      return next()
    }, { prepend: true })
  }

  mount(selector = '#app') {
    this.app.mount(selector)
  }

  wrapComponent(component?: Component): Component | undefined {
    if (!component)
      return undefined
    const ctx = this.ctx
    return markRaw(defineComponent((props, { slots }) => {
      provide(kContext, ctx)
      onErrorCaptured(() => ctx.fiber.uid !== null)
      return () => h(component, props, slots)
    }))
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

markRaw(cordis.Context.prototype)
markRaw(cordis.Service.prototype)

export const root = new Context()
root.plugin(Logger)
root.plugin(FrontendStateService)
const client = new ClientService(root)
export { client }
