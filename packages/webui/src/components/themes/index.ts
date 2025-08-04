import type { BrandVariants, Theme as FluentTheme } from '@fluentui/tokens'
import { createDarkTheme, createLightTheme } from '@fluentui/tokens'

import { coffeeBrand } from './coffee'
import { koishiBrand } from './koishi'
import { satoriBrand } from './satori'

export class Theme {
  static _themes: Record<string, { light: FluentTheme, dark: FluentTheme }> = {}

  static defineTheme(name: string, brand: BrandVariants) {
    Theme._themes[name] = {
      light: createLightTheme(brand),
      dark: createDarkTheme(brand),
    }
  }

  static getTheme<N extends keyof typeof Theme._themes>(name: N, mode: Theme.Mode): FluentTheme {
    return Theme._themes[name][mode] || Theme._themes.koishi[mode]
  }
}

export namespace Theme {
  export type Mode = 'light' | 'dark'
  export type Token = keyof typeof Theme._themes
}

Theme.defineTheme('koishi', koishiBrand)
Theme.defineTheme('satori', satoriBrand)
Theme.defineTheme('coffee', coffeeBrand)
