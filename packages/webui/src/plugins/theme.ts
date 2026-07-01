import type { Context } from 'cordis'
import type { Component } from 'vue'
import { Service } from 'cordis'
import { defineProperty, Dict } from 'cosmokit'
import { computed, markRaw, reactive, watchEffect } from 'vue'
import { useConfig } from './setting'
import { usePreferredDark } from '@vueuse/core'
import { setTheme } from '@fluentui/web-components'
import { Theme } from '../components/themes'

export interface ThemeOptions {
  id: string
  name: string | Dict<string>
  components?: Dict<Component>
}

const preferDark = usePreferredDark()

const config = useConfig()

export const colorMode = computed(() => {
  const mode = config.value.theme?.mode
  if (mode !== 'auto')
    return mode ?? 'light'
  return preferDark.value ? 'dark' : 'light'
})

export const useColorMode = () => colorMode

export default class ThemeService {
  _themes: Dict<ThemeOptions> = reactive({})

  constructor(public ctx: Context) {
    defineProperty(this, Service.tracker, { property: 'ctx' })

    ctx.effect(() => watchEffect(() => {
      if (!config.value.theme)
        return
      const root = window.document.querySelector('html')!
      root.setAttribute('theme', config.value.theme[colorMode.value])
      if (colorMode.value === 'dark') {
        root.classList.add('dark')
      }
      else {
        root.classList.remove('dark')
      }
    }, { flush: 'post' }))

    ctx.effect(() => watchEffect(() => {
      const mode = colorMode.value
      const token = config.value.theme?.[mode] as Theme.Token | undefined
      if (token)
        setTheme(Theme.getTheme(token, mode))
    }, { flush: 'post' }))
  }

  theme(options: ThemeOptions) {
    markRaw(options)
    return this.ctx.effect(() => {
      this._themes[options.id] = options
      return () => delete this._themes[options.id]
    })
  }

  switch(id: string): void {
    const config = this.ctx.stater
    if (!config)
      return
    config.mutate((d) => {
      d.app.theme = id as 'light' | 'dark'
    })
  }
}
