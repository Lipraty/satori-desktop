<script lang="ts" setup>
import { computed, PropType, ref, watch } from 'vue'
import { deepEqual, isNullable } from 'cosmokit'
import { useI18n } from 'vue-i18n'
import { check, getChoices, getFallback, Schema, useI18nText, useModel } from '../utils'
import zhCN from '../locales/zh-CN.yml'
import enUS from '../locales/en-US.yml'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<any>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<any>,
  extra: {} as PropType<any>,
})

defineEmits(['update:modelValue'])

const tt = useI18nText()

const options = ref<[Schema, number][]>()
const choices = ref<Schema[]>()
const cache = ref<any[]>()
const active = ref<Schema>()

watch(() => props.schema, (_) => {
  choices.value = getChoices(props.schema)
  cache.value = choices.value.map((item) => {
    if (item.type === 'const')
      return item.value
    return getFallback(item, true)
  })
  options.value = choices.value.map((item, i) => [item, i] as [Schema, number])
}, { immediate: true })

const config = useModel({
  input(value) {
    active.value = null
    let hasTransform = true
    let depth = 0
    while (!active.value && hasTransform && ++depth < 10) {
      hasTransform = false
      for (const [index, item] of props.schema.list.entries()) {
        if (item.meta.hidden)
          continue
        if (!check(item, value))
          continue
        if (item.type === 'transform') {
          if (!item.callback)
            continue
          try {
            value = item.callback(value)
          }
          catch (error) {
            console.error(error)
            continue
          }
          hasTransform = true
          value ??= getFallback(props.schema)
        }
        else {
          active.value = item
          cache.value[index] = value
        }
        break
      }
    }
    if (deepEqual(value, getFallback(props.schema)))
      value = null
    return value
  },
})

const selectModel = computed(() => {
  if (active.value === props.schema)
    return
  const index = choices.value?.indexOf(active.value)
  if (index == null || index < 0)
    return
  return String(index)
})

function onSelectChange(event: Event) {
  const index = Number.parseInt((event.target as HTMLSelectElement).value)
  if (!Number.isNaN(index) && active.value !== choices.value[index]) {
    config.value = cache.value[index]
    active.value = choices.value[index]
  }
}

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
  <k-schema
    v-model="config"
    :schema="active"
    :initial="initial"
    :disabled="disabled"
    :prefix="prefix"
    :extra="{
      foldable: extra?.foldable ?? true,
      required: !!schema.meta.required && isNullable(schema.meta.default) && isNullable(modelValue),
    }"
  >
    <template #title>
      <slot name="title" />
    </template>
    <template #desc>
      <slot name="desc">
        <k-markdown :source="tt(schema.meta.description)" />
      </slot>
    </template>
    <template #prefix>
      <fluent-dropdown
        v-if="choices.length > 1"
        :disabled="disabled || undefined"
        @change="onSelectChange($event)"
      >
        <fluent-listbox>
          <fluent-option
            v-for="([item, index]) in options"
            :key="index"
            :value="String(index)"
            :selected="selectModel === String(index) || undefined"
            :disabled="item.meta.disabled || undefined"
          >
            {{ tt(item.meta.description) || item.value }}
            <k-badge v-for="{ text, type: btype } in item.meta.badges || []" :key="text" :type="btype">
              {{ t(`badge.${text}`) }}
            </k-badge>
          </fluent-option>
        </fluent-listbox>
      </fluent-dropdown>
    </template>
    <template #suffix>
      <slot name="suffix" />
    </template>
  </k-schema>
</template>
