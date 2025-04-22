import { Component } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { Disposable } from 'cordis'

import { Context, Service } from '../context'
import { generateId } from '../utils'

declare module '../context' {
  interface Context {
    $router: RouterService
    page: (options: Pager.Options) => void
  }
}

export namespace Pager {
  export interface Options {
    id?: string
    path: string
    icon?: string
    name: string
    tooltip?: string
    component: Component
    position?: 'top' | 'bottom'
  }
}

export class Pager {
  private fibers: Disposable[] = []

  constructor(private ctx: Context, private options: Pager.Options) {
    options.id ??= generateId(options.path)
    options.position ??= 'top'
    const { id, path, name, component } = options
    this.fibers.push(this.ctx.$router.router.addRoute({
      path,
      name,
      component,
      meta: { activity: this }
    }))
    ctx.$router.pages[id] = this
  }

  get id() {
    return this.options.id!
  }

  get path() {
    return this.options.path
  }

  get name() {
    return this.options.name
  }

  get icon() {
    return this.options.icon
  }

  get tooltip() {
    return this.options.tooltip
  }

  dispose() {
    this.fibers.forEach(dispose => dispose())
  }
}

export default class RouterService extends Service {
  public pages: Record<string, Pager> = {}
  public router = createRouter({
    // in electron app, since there is no address bar, using memory is better.
    history: createMemoryHistory(),
    routes: [],
  })

  constructor(ctx: Context) {
    super(ctx, '$router', true)
    ctx.mixin('$router', ['page'])
  }

  page(options: Pager.Options) {
    options.component = this.ctx.component(options.component)
    return this.ctx.effect(() => {
      const page = new Pager(this.ctx, options)
      return () => page.dispose()
    })
  }
}
