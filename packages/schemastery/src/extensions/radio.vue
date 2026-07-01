<script lang="ts" setup>
import { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { getChoices, Schema, useI18nText, useModel } from '../utils'
import SchemaBase from '../base.vue'
import zhCN from '../locales/zh-CN.yml'
import enUS from '../locales/en-US.yml'

defineProps({
  schema: { type: Object as PropType<Schema> },
  modelValue: { type: Object as PropType<any> },
  disabled: { type: Object as PropType<boolean> },
  prefix: { type: Object as PropType<string> },
  initial: { type: Object as PropType<{}> },
})

defineEmits(['update:modelValue'])

const tt = useI18nText()

const config = useModel()

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
    <fluent-radio-group
      class="bottom"
      orientation="vertical"
      :value="String(config ?? '')"
      :disabled="disabled || undefined"
      @change="config = ($event.target as HTMLInputElement).value"
    >
      <fluent-radio
        v-for="item in getChoices(schema)"
        :key="item.value"
        :value="item.value"
        :disabled="item.meta.disabled || undefined"
      >
        {{ tt(item.meta.description) || item.value }}
        <k-badge v-for="{ text, type: btype } in item.meta.badges || []" :key="text" :type="btype">
          {{ t(`badge.${text}`) }}
        </k-badge>
      </fluent-radio>
    </fluent-radio-group>
  </SchemaBase>
</template>
