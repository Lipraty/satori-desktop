import type { Context } from '@satoriapp/webui'
import { setTheme } from '@fluentui/web-components'
import { Service } from 'cordis'
import { Theme } from '../components/themes'

declare module '@satoriapp/webui' {
  interface Context {
    $theme: ThemeService
    theme: ThemeService['theme']
  }
}

export namespace ThemeService {
  export interface ThemeOptions {
    id: string
    name: string
  }
}

export default class ThemeService extends Service<never, Context> {
  private _mode: Theme.Mode = 'light'
  private _token: Theme.Token = 'koishi'
  private _cleanup: (() => void) | null = null

  constructor(ctx: Context) {
    super(ctx, '$theme', true)
    ctx.mixin('$theme', ['theme'])
  }

  async start(): Promise<void> {
    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
    this._mode = themeMedia.matches ? 'dark' : 'light'

    const onThemeChange = (e: MediaQueryListEvent) => {
      this._mode = e.matches ? 'dark' : 'light'
      this._apply()
    }

    themeMedia.addEventListener('change', onThemeChange)
    this._cleanup = () => themeMedia.removeEventListener('change', onThemeChange)

    this.ctx.on('ready', () => this._apply())
  }

  async stop(): Promise<void> {
    this._cleanup?.()
    this._cleanup = null
  }

  get mode(): Theme.Mode {
    return this._mode
  }

  get token(): Theme.Token {
    return this._token
  }

  switch(id: string): void {
    this._token = id as Theme.Token
    this._apply()
  }

  theme(_options: ThemeService.ThemeOptions): () => void {
    return this.ctx.effect(() => () => {})
  }

  private _apply(): void {
    setTheme(Theme.getTheme(this._token, this._mode))
  }
}
