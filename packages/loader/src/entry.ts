import { Dict } from '@satoriapp/common'
import { Context, ForkScope, Inject, Plugin, Schema } from 'cordis'

export class Entry {
  public parent?: Context
  public fork?: ForkScope

  constructor(public options: Entry.Options) { }

  get id() {
    return this.options.id
  }

  get plugin() {
    return this.options.plugin
  }

  get inject() {
    return this.options.inject
  }

  async reload(ctx: Context, newConfig?: Dict) {
    this.parent = ctx
    const config = newConfig || this.options.config
    if (this.options.meta?.schema && !this.options.meta.schema(config)) {
      ctx.logger('loader').error('invalid config', this.plugin.name)
      return
    }
    if (this.fork) {
      this.fork.update(config)
      ctx.emit('loader/update', this.plugin.name, config)
    } else {
      this.fork = await ctx.loader.import(this.options.name, config)
      if (!this.fork) return
      ctx.emit('loader/apply', this.plugin.name, this.fork)
      ctx.loader.entryTree.set(this.id, this)
    }
    return this.fork
  }

  unload() {
    if (this.fork && this.parent) {
      this.fork.dispose()
      this.options.meta.disabled = true
      this.parent.emit('loader/unload', this.plugin.name)
    }
  }

  private dictShecma(schema: Entry.SchemaRaw, config: Dict) {
    const isNestedType = (type: string) =>
      ['object', 'intersect', 'tuple', 'dict', 'array'].includes(type)

    const mergeObject = (s: Entry.SchemaRaw, c: Dict) => {
      const merged = { ...c };
      Object.entries(s.children || {}).forEach(([key, child]: [string, Entry.SchemaRaw]) => {
        const existingValue = merged[key];
        if (existingValue !== undefined && !isNestedType(child.type)) return
        if (child.meta?.default !== undefined) {
          if (existingValue === undefined) {
            merged[key] = getDefaultValue(child)
          } else if (isNestedType(child.type)) {
            merged[key] = this.dictShecma(child, existingValue).bind(this)
          }
        } else if (isNestedType(child.type)) {
          merged[key] = this.dictShecma(child, existingValue || {}).bind(this)
        }
      })
      return merged
    }

    const mergeIntersect = (s: Entry.SchemaRaw, c: Dict) => (s.children as Entry.SchemaRaw[])
      .filter((child: Entry.SchemaRaw) => child.type === 'object')
      .reduce((acc, child) => mergeObject(child, acc), { ...c })

    const getDefaultValue = (child: Entry.SchemaRaw) => {
      if (child.type === 'object') {
        return mergeObject(child, {})
      }
      if (child.type === 'intersect') {
        return mergeIntersect(child, {})
      }
      return child.meta?.default;
    };

    if (schema.type === 'object') {
      return mergeObject(schema, config)
    }
    if (schema.type === 'intersect') {
      return mergeIntersect(schema, config)
    }

    return config
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
    id: string
    name: string
    config?: Dict
    inject?: Inject | null
    plugin: Plugin
    meta: {
      disabled?: boolean
      internal?: boolean
      schema?: Schema
      reusable?: boolean
    }
  }

  export type SchemaRaw = {
    type: Schema['type']
    meta: Schema['meta']
    children: SchemaRaw | any
  }
}
