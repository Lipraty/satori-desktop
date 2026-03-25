<script lang="ts" setup>
import { computed, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNullable } from 'cosmokit'
import { IconArrowDown, IconArrowUp, IconDelete, IconInvalid } from '../icons'
import { explain, Schema, toColumns, useEntries, useI18nText } from '../utils'
import SchemaBase from '../base.vue'
import SchemaPrimitive from '../primitive.vue'
import zhCN from '../locales/zh-CN.yml'
import enUS from '../locales/en-US.yml'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<{}>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
})

defineEmits(['update:modelValue'])

const columns = computed(() => toColumns(props.schema.inner))

const { entries, insert, del, up, down, isMax, isMin, isFixedLength } = useEntries()

interface Rect {
  el: HTMLElement
  top: number
  left: number
  width: number
  height: number
  invalid: boolean
}

const container = ref<HTMLElement>()
const hover = ref<Rect>()
const focus = ref<Rect>()

function getRelative(el: HTMLElement, invalid: any) {
  const target = el.getBoundingClientRect()
  const reference = container.value.getBoundingClientRect()
  return {
    el,
    invalid: !!invalid,
    top: target.top - reference.top,
    left: target.left - reference.left,
    width: target.width,
    height: target.height,
  }
}

function validateCell(i?: number, j?: number) {
  if (i === null)
    return
  if (j >= 0)
    return explain(columns.value[j][1], entries.value[i][1])
  const result = explain(props.schema.sKey, entries.value[i][0])
  if (result)
    return result
  if (j === -1 && entries.value.filter(([key]) => key === entries.value[i][0]).length > 1) {
    return ['errors.duplicate-key'] as const
  }
}

function handleMouseEnter(event: MouseEvent, i?: number, j?: number) {
  const el = event.target as HTMLElement
  if (el === hover.value?.el)
    return
  if (columns.value[j]?.[1].meta.disabled)
    return
  hover.value = getRelative(el, validateCell(i, j))
}

function handleMouseLeave(_event: MouseEvent, _i?: number, _j?: number) {
  hover.value = undefined
}

function handleFocus(event: MouseEvent, i?: number, j?: number) {
  let el = event.target as HTMLElement
  while (el && el.tagName !== 'TD') {
    el = el.parentElement
  }
  if (!el || el === focus.value?.el)
    return
  focus.value = getRelative(el, validateCell(i, j))
}

function handleBlur(_event: MouseEvent, _i?: number, _j?: number) {
  focus.value = undefined
}

function handleUpdate(value: any, i: number, j: number) {
  const [key] = columns.value[j]
  if (key === null) {
    entries.value[i][1] = value
    return
  }
  if (props.schema.inner.type === 'tuple') {
    const tuple = entries.value[i][1] ||= []
    tuple[key] = value
    let length = tuple.length
    while (length > 0 && isNullable(tuple[length - 1])) {
      length--
    }
    tuple.length = length
    entries.value[i][1] = tuple
  }
  else if (props.schema.inner.type === 'object') {
    if (isNullable(value)) {
      delete entries.value[i][1]?.[key]
    }
    else {
      (entries.value[i][1] ||= {})[key] = value
    }
  }
}

function getComponentType(schema: Schema) {
  if (schema.type === 'boolean')
    return 'checkbox'
  if (schema.type === 'number')
    return 'input-number'
  if (schema.type === 'string')
    return 'input'
  return 'select'
}

const tt = useI18nText()

const { t, setLocaleMessage } = useI18n({
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept('../locales/zh-CN.yml', (module) => {
    setLocaleMessage('zh-CN', module.default)
  })
  import.meta.hot.accept('../locales/en-US.yml', (module) => {
    setLocaleMessage('en-US', module.default)
  })
}
</script>

<template>
  <SchemaBase>
    <template #title>
      <slot name="title" />
    </template>
    <template #desc>
      <slot name="desc" />
    </template>
    <template #menu>
      <slot name="menu" />
    </template>
    <template #prefix>
      <slot name="prefix" />
    </template>
    <template #suffix>
      <slot name="suffix" />
    </template>
    <template #control>
      <fluent-button
        v-if="!isFixedLength"
        :disabled="disabled || isMax || undefined"
        @click="insert(entries.length)"
      >
        {{ t('entry.add-row') }}
      </fluent-button>
    </template>
    <div v-if="columns && entries.length" ref="container" class="bottom k-schema-table-container">
      <table class="k-schema-table">
        <tr v-if="schema.type === 'dict' || columns[0][0] !== null">
          <th v-if="schema.type === 'dict'">
            {{ tt(schema.sKey?.meta.description) || t('entry.key') }}
          </th>
          <th v-for="([key, schema]) in columns" :key="key">
            <span>{{ tt(schema.meta.description) || key || t('entry.value') }}</span>
            <k-badge v-for="{ text, type: btype } in schema.meta.badges || []" :key="text" :type="btype">
              {{ t(`badge.${text}`) }}
            </k-badge>
          </th>
          <th colspan="3" />
        </tr>

        <tr v-for="(_, i) in entries" :key="i">
          <td
            v-if="schema.type === 'dict'"
            class="k-schema-table-cell-input"
            @mouseenter="handleMouseEnter($event, i, -1)"
            @mouseleave="handleMouseLeave($event, i, -1)"
          >
            <fluent-text-input
              :value="entries[i][0]"
              :disabled="disabled || undefined"
              @change="entries[i][0] = ($event.target as HTMLInputElement).value"
              @focus="handleFocus($event, i, -1)"
              @blur="handleBlur($event, i, -1)"
            >
              <template v-if="validateCell(i, -1)">
                <span :id="`invalid-cell-${i}`" slot="end" class="suffix-icon">
                  <IconInvalid class="invalid" />
                </span>
                <fluent-tooltip :anchor="`invalid-cell-${i}`" positioning="above">
                  {{ t(...validateCell(i, -1)) }}
                </fluent-tooltip>
              </template>
            </fluent-text-input>
          </td>

          <td
            v-for="([key, schema], j) in columns"
            :key="key"
            class="k-schema-table-cell" :class="[`k-schema-table-cell-${getComponentType(schema)}`]"
            @mouseenter="handleMouseEnter($event, i, j)"
            @mouseleave="handleMouseLeave($event, i, j)"
          >
            <SchemaPrimitive
              minimal
              :schema="schema"
              :disabled="disabled || schema.meta.disabled"
              :model-value="key === null ? entries[i][1] : entries[i][1]?.[key]"
              @update:model-value="handleUpdate($event, i, j)"
              @focus="handleFocus($event, i, j)"
              @blur="handleBlur($event, i, j)"
            />
          </td>

          <td
            v-if="!disabled" class="k-schema-table-button"
            :class="{ disabled: !i }"
            @click.stop="up(i)"
            @mouseenter="handleMouseEnter($event, null)"
            @mouseleave="handleMouseLeave($event, null)"
          >
            <div class="inner">
              <IconArrowUp />
            </div>
          </td>
          <td
            v-if="!disabled" class="k-schema-table-button"
            :class="{ disabled: i === entries.length - 1 }"
            @click.stop="down(i)"
            @mouseenter="handleMouseEnter($event, null)"
            @mouseleave="handleMouseLeave($event, null)"
          >
            <div class="inner">
              <IconArrowDown />
            </div>
          </td>
          <td
            v-if="!disabled && !isFixedLength" class="k-schema-table-button"
            :class="{ disabled: isMin }"
            @click.stop="del(i), hover = undefined"
            @mouseenter="handleMouseEnter($event, null)"
            @mouseleave="handleMouseLeave($event, null)"
          >
            <div class="inner">
              <IconDelete />
            </div>
          </td>
        </tr>
      </table>

      <template v-for="rect in { hover, focus }" :key="rect ? 'focus' : 'hover'">
        <div
          v-if="rect"
          class="cell-outline" :class="[{ invalid: rect.invalid }]"
          :style="{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }"
        />
      </template>
    </div>
  </SchemaBase>
</template>

<style lang="scss">
.k-schema-table-container {
  position: relative;

  .cell-outline {
    position: absolute;
    box-sizing: border-box;
    border: 1px solid var(--k-color-active);
    pointer-events: none;

    &.invalid {
      border-color: var(--k-color-danger);
    }
  }
}

.k-schema-table {
  td, th {
    border: 1px solid var(--colorNeutralStroke1);
  }

  th {
    padding: 0.5rem 0.75rem;
    line-height: 1.25rem;
  }

  td {
    padding: 0;
  }

  td {
    transition: var(--color-transition);

    &:hover {
      background-color: var(--k-button-hover-bg);
    }
  }

  td.k-schema-table-button {
    width: 2rem;
    max-width: 2rem;
    color: var(--k-text-light);
    cursor: pointer;

    &:hover {
      color: var(--k-color-active);
    }

    .inner {
      height: 2rem;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .k-icon {
      height: 1rem;
    }

    &.disabled {
      color: var(--k-color-disabled);
      pointer-events: none;
    }
  }
}
</style>
