import type { Context } from 'cordis'
import type { Component, MaybeRefOrGetter } from 'vue'
import type { Dict } from 'cosmokit'
import { Service } from 'cordis'
import { defineProperty, omit, remove } from 'cosmokit'
import { isRef, markRaw, reactive, toValue } from 'vue'
import { createMemoryHistory, createRouter, createWebHashHistory } from 'vue-router'
import { insert } from '../utils'

export namespace Activity {
  export interface Options {
    id?: string
    path: string
    name: MaybeRefOrGetter<string>
    desc?: MaybeRefOrGetter<string>
    icon?: MaybeRefOrGetter<string | Component | undefined>
    component: Component
    order?: number
    position?: 'top' | 'bottom'
    disabled?: () => boolean | undefined
  }
}

export interface Activity extends Activity.Options {}

function getActivityId(path: string) {
  return path.replace(/^\//, '') || 'home'
}

export class Activity {
  id!: string

  constructor(public ctx: Context, public options: Activity.Options) {
    options.order ??= 0
    options.position ??= 'top'
    Object.assign(this, omit(options, ['icon', 'name', 'desc', 'disabled']))
  }

  *setup() {
    const { path, id = getActivityId(path), component } = this.options
    const router = this.ctx.client.router
    yield router.router.addRoute({ path, name: id, component, meta: { activity: this } })
    this.id ??= id
    router.pages[this.id] = this
    yield () => delete router.pages[this.id]
  }

  get icon() {
    return toValue(this.options.icon) ?? 'default'
  }

  get name() {
    return toValue(this.options.name ?? this.id)
  }

  get desc() {
    return toValue(this.options.desc)
  }

  disabled() {
    return !!this.options.disabled?.()
  }
}

export interface SlotOptions {
  type: string
  component?: Component
  order?: number
  disabled?: () => boolean
}

export type Platform = 'electron' | 'cirno' | 'web'

export default class RouterService {
  public views = reactive<Dict<SlotOptions[]>>({})
  public pages = reactive<Dict<Activity>>({})
  public router = createRouter({
    history: this.platform !== 'web' ? createMemoryHistory() : createWebHashHistory(),
    linkActiveClass: 'active',
    routes: [],
  })

  constructor(public ctx: Context) {
    defineProperty(this, Service.tracker, { property: 'ctx' })
  }

  get platform(): Platform {
    if (typeof window === 'undefined') return 'web'
    if ('electron' in window) return 'electron'
    if ('cirno' in window) return 'cirno'
    return 'web'
  }

  slot(options: SlotOptions) {
    options.order ??= 0
    options.component = this.ctx.client.wrapComponent(options.component)
    return this.ctx.effect(() => {
      const list = this.views[options.type] ||= []
      insert(list, options)
      return () => {
        remove(list, options)
        if (!list.length) delete this.views[options.type]
      }
    })
  }

  page(options: Activity.Options) {
    const wrapped = this.ctx.client.wrapComponent(options.component)
    if (wrapped) options.component = wrapped
    if (options.icon && typeof options.icon === 'object' && !isRef(options.icon)) {
      markRaw(options.icon)
    }
    return this.ctx.effect(() => {
      const activity = new Activity(this.ctx, options)
      return activity.setup()
    })
  }
}
