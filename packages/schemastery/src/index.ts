import { App, Component } from 'vue'
import {
  accordionDefinition,
  accordionItemDefinition,
  BadgeDefinition,
  ButtonDefinition,
  CheckboxDefinition,
  DialogBodyDefinition,
  DialogDefinition,
  DividerDefinition,
  DropdownDefinition,
  DropdownOptionDefinition,
  FluentDesignSystem,
  ListboxDefinition,
  RadioDefinition,
  RadioGroupDefinition,
  SliderDefinition,
  SwitchDefinition,
  TextAreaDefinition,
  TextInputDefinition,
  TooltipDefinition,
} from '@fluentui/web-components'
import { getFallback, Schema, toColumns, useDisabled, useEntries, useModel } from './utils'
import SchemaBase from './base.vue'
import Primitive from './primitive.vue'
import SchemaCheckbox from './extensions/checkbox.vue'
import SchemaGroup from './extensions/group.vue'
import SchemaIntersect from './extensions/intersect.vue'
import SchemaObject from './extensions/object.vue'
import SchemaRadio from './extensions/radio.vue'
import SchemaMultiSelect from './extensions/multiselect.vue'
import SchemaTable from './extensions/table.vue'
import SchemaTextarea from './extensions/textarea.vue'
import SchemaTuple from './extensions/tuple.vue'
import SchemaUnion from './extensions/union.vue'
import KBadge from './badge.vue'
import KMarkdown from './markdown.vue'
import KSchema from './schema.vue'
import KForm from './form.vue'

import './styles/index.scss'

const extensions = new Set<form.Extension>()

export * from './icons'

export { Primitive }
export { Schema, useI18nText } from './utils'

export * from 'cosmokit'

export const form = Object.assign(SchemaBase, {
  Form: KForm,
  Badge: KBadge,
  Schema: KSchema,
  useModel,
  useEntries,
  useDisabled,
  getFallback,
  extensions,
  install(app: App) {
    const reg = FluentDesignSystem.registry
    ;[
      accordionDefinition,
      accordionItemDefinition,
      BadgeDefinition,
      ButtonDefinition,
      CheckboxDefinition,
      DialogBodyDefinition,
      DialogDefinition,
      DividerDefinition,
      DropdownDefinition,
      DropdownOptionDefinition,
      ListboxDefinition,
      RadioDefinition,
      RadioGroupDefinition,
      SliderDefinition,
      SwitchDefinition,
      TextAreaDefinition,
      TextInputDefinition,
      TooltipDefinition,
    ].forEach(d => d.define(reg))
    app.provide('__SCHEMASTERY_EXTENSIONS__', extensions)
    app.component('k-form', KForm)
    app.component('k-badge', KBadge)
    app.component('k-schema', KSchema)
    app.component('k-markdown', KMarkdown)
  },
}) as typeof SchemaBase & {
  Form: typeof KForm
  Badge: typeof KBadge
  Schema: typeof KSchema
  useModel: typeof useModel
  useEntries: typeof useEntries
  useDisabled: typeof useDisabled
  getFallback: typeof getFallback
  extensions: Set<form.Extension>
  install: (app: App) => void
}

export namespace form {
  export interface Extension {
    type?: string
    role?: string
    validate?: (value: any, schema: Schema) => boolean
    component: Component
    important?: boolean
  }
}

form.extensions.add({
  type: 'bitset',
  role: 'select',
  component: SchemaMultiSelect,
  validate: (value: any) => typeof value === 'number' || Array.isArray(value) && value.every((v: any) => typeof v === 'string'),
})

form.extensions.add({
  type: 'array',
  role: 'select',
  component: SchemaMultiSelect,
  validate: (value: any) => Array.isArray(value) && value.every((v: any) => typeof v === 'string'),
})

form.extensions.add({
  type: 'bitset',
  component: SchemaCheckbox,
  validate: (value: any) => typeof value === 'number' || Array.isArray(value) && value.every((v: any) => typeof v === 'string'),
})

form.extensions.add({
  type: 'array',
  role: 'checkbox',
  component: SchemaCheckbox,
  validate: (value: any) => Array.isArray(value) && value.every((v: any) => typeof v === 'string'),
})

form.extensions.add({
  type: 'array',
  component: SchemaGroup,
  validate: (value: any) => Array.isArray(value),
})

form.extensions.add({
  type: 'dict',
  component: SchemaGroup,
  validate: (value: any) => typeof value === 'object',
})

form.extensions.add({
  type: 'object',
  component: SchemaObject,
  validate: (value: any) => typeof value === 'object',
})

form.extensions.add({
  type: 'intersect',
  component: SchemaIntersect,
  validate: (value: any) => typeof value === 'object',
})

form.extensions.add({
  type: 'union',
  role: 'radio',
  component: SchemaRadio,
})

form.extensions.add({
  type: 'array',
  role: 'table',
  component: SchemaTable,
  validate: (value: any, schema: Schema) => Array.isArray(value) && !!toColumns(schema.inner),
})

form.extensions.add({
  type: 'dict',
  role: 'table',
  component: SchemaTable,
  validate: (value: any, schema: Schema) => typeof value === 'object' && !!toColumns(schema.inner),
})

form.extensions.add({
  type: 'string',
  role: 'textarea',
  component: SchemaTextarea,
  validate: (value: any) => typeof value === 'string',
})

form.extensions.add({
  type: 'tuple',
  component: SchemaTuple,
  validate: (value: any) => Array.isArray(value),
})

form.extensions.add({
  type: 'union',
  component: SchemaUnion,
})

export default form
