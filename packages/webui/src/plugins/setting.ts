import type { Context } from '@satoriapp/webui'
import type { Component } from 'vue'
import { Service } from 'cordis'
import Schema from 'schemastery'
import { markRaw, reactive } from 'vue'

declare module '@satoriapp/webui' {
  interface Context {
    $setting: SettingService
    settings: SettingService['settings']
    internal: {
      settings: SettingRecord
      [key: string]: unknown
    }
  }
}

export interface SettingOptions {
  id: string
  title?: string
  order?: number
  disabled?: () => boolean
  schema?: Schema
  component?: Component
}

type SettingRecord = Record<string, SettingOptions[]>

function insertOrdered(list: SettingOptions[], options: SettingOptions) {
  const order = options.order ?? 0
  const index = list.findIndex(item => (item.order ?? 0) > order)
  if (index < 0)
    list.push(options)
  else
    list.splice(index, 0, options)
}

export default class SettingService extends Service<never, Context> {
  private readonly entriesMap = reactive<SettingRecord>({})

  constructor(ctx: Context) {
    super(ctx, '$setting', true)
    ctx.mixin('$setting', ['settings'])
    ctx.provide('internal', { settings: this.entriesMap })
  }

  get entries() {
    return this.entriesMap
  }

  settings(options: SettingOptions): () => void {
    markRaw(options)
    options.order ??= 0
    if (options.component) {
      options.component = this.ctx.component(options.component)
    }

    return this.ctx.effect(() => {
      const list = (this.entriesMap[options.id] ??= [])
      insertOrdered(list, options)

      return () => {
        const index = list.indexOf(options)
        if (index >= 0)
          list.splice(index, 1)
        if (!list.length)
          delete this.entriesMap[options.id]
      }
    })
  }
}
