import type { Context } from 'cordis'
import { setTheme } from '@fluentui/web-components'
import { Service } from 'cordis'
import { defineProperty } from 'cosmokit'
import { watch } from 'vue'
import { Theme } from '../components/themes'
import type {} from '@satoriapp/state'

export interface ThemeOptions {
  id: string
  name: string
}

export default class ThemeService {
  private _mode: Theme.Mode = 'light'
  private _token: Theme.Token = 'koishi'

  constructor(public ctx: Context) {
    defineProperty(this, Service.tracker, { property: 'ctx' })

    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)')
    this._mode = themeMedia.matches ? 'dark' : 'light'
    const onChange = (e: MediaQueryListEvent) => {
      this._mode = e.matches ? 'dark' : 'light'
      this._apply()
    }
    themeMedia.addEventListener('change', onChange)
    ctx.effect(() => () => themeMedia.removeEventListener('change', onChange))

    ctx.effect(() => watch(
      () => ctx.stater?.data?.app?.theme,
      (next) => {
        if (next === 'dark' || next === 'light') {
          this._mode = next
          this._apply()
        }
      },
      { immediate: true },
    ))

    this._apply()
  }

  get mode(): Theme.Mode { return this._mode }
  get token(): Theme.Token { return this._token }

  switch(id: string): void {
    this._token = id as Theme.Token
    this._apply()
  }

  theme(_options: ThemeOptions): () => void {
    return () => {}
  }

  private _apply(): void {
    setTheme(Theme.getTheme(this._token, this._mode))
  }
}
