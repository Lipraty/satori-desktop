import { existsSync, readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { app } from 'electron'

import { Context, Service } from '../context'

declare module '..' {
  interface Context {
    settings: SettingsManager
  }

  interface Events {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'settings/changed': (key: keyof Settings, value: any, oldValue?: any) => void
  }
}

export type ThemeKey = 'light' | 'dark' | 'system'

export interface Settings {
  theme: ThemeKey
}

export namespace SettingsManager {
  export interface Config {}
}

export class SettingsManager extends Service {
  settingsFilePath: string
  settings: Settings
  settingsObj?: Settings

  saveTimer?: NodeJS.Timeout

  constructor(ctx: Context, public config: SettingsManager.Config) {
    super(ctx, 'settings')

    this.settingsFilePath = resolve(app.getPath('userData'), 'settings.json')

    this.settings = new Proxy<Settings>({} as Settings, {
      get: (_, key) => {
        if (!this.settingsObj) this.readSettings()
        return this.settingsObj![key as keyof Settings]
      },
      set: (_, key, value) => {
        this.settingsObj![key as keyof Settings] = value
        this.saveSettings()
        return true
      },
    })

    this.ctx.on('settings/changed', (k, v, ov) => {
      if (ov === v) return
      this.settings[k] = v
    })
  }

  getDefaultSettings(): Settings {
    return {
      theme: 'system',
    }
  }

  readSettings() {
    if (!existsSync(this.settingsFilePath)) {
      this.settingsObj = this.getDefaultSettings()
      this.saveSettings()
      return
    }

    this.settingsObj = JSON.parse(readFileSync(this.settingsFilePath, 'utf-8'))
  }

  /** Save settings in next tick, set a timer to avoid multiple calls */
  saveSettings() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = undefined
    }

    this.saveTimer = setTimeout(() => {
      writeFile(this.settingsFilePath, JSON.stringify(this.settingsObj ?? this.getDefaultSettings(), null, 2), 'utf-8')
      this.saveTimer = undefined
    }, 0)
  }
}
