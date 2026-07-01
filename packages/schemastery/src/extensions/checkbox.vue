<script lang="ts" setup>
import { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { Schema, useI18nText, useMultiSelect } from '../utils'
import SchemaBase from '../base.vue'
import zhCN from '../locales/zh-CN.yml'
import enUS from '../locales/en-US.yml'
import { IconSquareCheck, IconSquareEmpty } from '../icons'

defineProps({
  schema: { type: Object as PropType<Schema> },
  modelValue: { type: Object as PropType<number> },
  disabled: { type: Object as PropType<boolean> },
  prefix: { type: Object as PropType<string> },
  initial: { type: Object as PropType<{}> },
})

defineEmits(['update:modelValue'])

const tt = useI18nText()

const { values, items, toggle, selectAll, selectNone } = useMultiSelect()

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
      <div class="k-menu-separator" />
      <div class="k-menu-item" :class="{ disabled }" @click="selectAll">
        <span class="k-menu-icon"><IconSquareCheck /></span>
        {{ t('select.all') }}
      </div>
      <div class="k-menu-item" :class="{ disabled }" @click="selectNone">
        <span class="k-menu-icon"><IconSquareEmpty /></span>
        {{ t('select.none') }}
      </div>
    </template>
    <template #prefix>
      <slot name="prefix" />
    </template>
    <template #suffix>
      <slot name="suffix" />
    </template>
    <ul class="bottom">
      <li v-for="item in items" :key="item.value">
        <fluent-checkbox
          :disabled="disabled || item.meta.disabled || undefined"
          :checked="values.includes(item.value) || undefined"
          @change="toggle(item.value)"
        >
          {{ tt(item.meta.description) || item.value }}
          <k-badge v-for="{ text, type: btype } in item.meta.badges || []" :key="text" :type="btype">
            {{ t(`badge.${text}`) }}
          </k-badge>
        </fluent-checkbox>
      </li>
    </ul>
  </SchemaBase>
</template>
