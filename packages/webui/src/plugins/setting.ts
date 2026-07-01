import type { Component, Ref, WritableComputedRef } from 'vue'
import type { Dict } from 'cosmokit'
import Schema from 'schemastery'
import type { StateService } from '@satoriapp/state'
import type { Ordered } from '../utils'
import { Context, Service } from 'cordis'
import { defineProperty, remove } from 'cosmokit'
import { computed, markRaw, reactive, ref, watch } from 'vue'
import { insert } from '../utils'

export interface SettingOptions extends Ordered {
  id: string
  title?: string
  disabled?: () => boolean
  schema?: Schema
  component?: Component
}

export interface Config {
  theme?: {
    mode: 'auto' | 'dark' | 'light'
    dark: string
    light: string
  }
  locale?: string
  [key: string]: any
}

export type StorageRef<T> = WritableComputedRef<T> | Ref<T>
export type StorageFactory = <T extends object>(key: string, version?: number, fallback?: () => T) => StorageRef<T>

let activeStater: StateService | undefined

const defaultFactory: StorageFactory = <T extends object>(key: string, version?: number, fallback?: () => T): StorageRef<T> => {
  const initial = (fallback ? fallback() : {}) as T & { __version__?: number }
  if (version !== undefined)
    initial.__version__ = version
  const localFallback = ref(initial) as Ref<T>
  return computed({
    get(): T {
      if (!activeStater)
        return localFallback.value
      const ns = activeStater.data[key] as (T & { __version__?: number }) | undefined
      if (!ns || (version !== undefined && ns.__version__ !== version)) {
        activeStater.mutate((d) => {
          d[key] = initial
        })
        return initial
      }
      return ns
    },
    set(value: T) {
      if (!activeStater) {
        localFallback.value = value
        return
      }
      activeStater.mutate((d) => {
        d[key] = value
      })
    },
  })
}

let storageFactory: StorageFactory = defaultFactory

export function provideStorage(factory: StorageFactory) {
  storageFactory = factory
}

export function useStorage<T extends object>(key: string, version?: number, fallback?: () => T): StorageRef<T> {
  return storageFactory(key, version, fallback)
}

export const original = useStorage<Config>('config', undefined, () => ({
  theme: { mode: 'auto', dark: 'default-dark', light: 'default-light' },
  locale: 'zh-CN',
}))

export const resolved = ref({} as Config)

export const useConfig = (useOriginal = false) => useOriginal ? original : resolved

export default class SettingService {
  _settings: Dict<SettingOptions[]> = reactive({})

  constructor(public ctx: Context) {
    defineProperty(this, Service.tracker, { property: 'ctx' })
    activeStater = ctx.stater

    this.settings({
      id: '',
      title: '通用设置',
      order: 1000,
      schema: Schema.object({
        locale: Schema.union(['zh-CN', 'en-US']).description('语言设置。'),
      }).description('通用设置'),
    })

    const schema = computed(() => {
      const list: Schema[] = []
      for (const settings of Object.values(this._settings)) {
        for (const options of settings) {
          if (options.schema) {
            list.push(options.schema)
          }
        }
      }
      return Schema.intersect(list)
    })

    const doWatch = () => watch(resolved, (value) => {
      original.value = JSON.parse(JSON.stringify(value))
    }, { deep: true })

    let stop = doWatch()

    const update = () => {
      stop?.()
      try {
        resolved.value = schema.value(original.value)
      }
      catch (error) {
        console.error(error)
      }
      stop = doWatch()
    }

    ctx.effect(() => () => stop?.())

    ctx.effect(() => watch(original, update, { deep: true }))
    ctx.effect(() => watch(schema, update))
  }

  get entries() { return this._settings }

  settings(options: SettingOptions) {
    markRaw(options)
    options.order ??= 0
    options.component = this.ctx.client.wrapComponent(options.component)
    return this.ctx.effect(() => {
      const list = this._settings[options.id] ||= []
      insert(list, options)
      return () => {
        remove(list, options)
        if (!list.length)
          delete this._settings[options.id]
      }
    })
  }
}
