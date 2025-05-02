import { Context, ForkScope, Plugin, Schema } from '@satoriapp/main'

import Loader from '.'

declare module '@satoriapp/main' {
  interface Events {
  }
}

export class Entry<C extends Context = Context> {
  public ctx!: C
  public id!: string
  public fork?: ForkScope
  public options!: Entry.Options

  constructor(ctx: Context) { }

  get plugin() {
    return this.options.plugin
  }

  get schema() {
    return this.options.validate
  }

  get config() {
    if (!this.options.validate) return null
    return this.reverseSchema(this.options.validate!)
  }

  private reverseSchema(schema: Schema) {
    const { type, meta } = schema
    const result: Entry.SchemaRaw = { type, meta, children: {} }
    if (type === 'const') result.children = schema.value
    if (type === 'transform') result.children = this.reverseSchema(schema.inner!)
    if (type === 'object') {
      Object.keys(schema.dict!).forEach(key => {
        result.children[key] = this.reverseSchema(schema.dict![key])
      })
    } else if (['tuple', 'intersect', 'union'].includes(type)) {
      result.children = schema.list!.map(this.reverseSchema.bind(this))
    } else if (type === 'dict') {
      result.children = this.reverseSchema(schema.inner!)
    } else if (type === 'array') {
      result.children = this.reverseSchema(schema.inner!)
    } else if (['string', 'number', 'boolean'].includes(type)) {
      result.children = null
    }
    return result
  }
}

export namespace Entry {
  export interface Options {
    name: string
    internal?: boolean
    validate?: Schema
    schema?: SchemaRaw
    plugin: Plugin
  }

  export type SchemaRaw = {
    type: Schema['type']
    meta: Schema['meta']
    children: SchemaRaw | any
  }
}

export class EntryTree<C extends Context = Context> {
  public entries: Map<string, Entry<C>> = new Map()
  public root: Entry<C> | null = null

  constructor(public ctx: C) {
    const entry = ctx.scope

  }

  async init() { }
}
