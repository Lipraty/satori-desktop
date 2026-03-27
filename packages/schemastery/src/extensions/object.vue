<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { isNullable } from 'cosmokit'
import { Schema, useI18nText, useModel } from '../utils'
import SchemaBase from '../base.vue'
import zhCN from '../locales/zh-CN.yml'
import enUS from '../locales/en-US.yml'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  schema: { type: Object as PropType<Schema> },
  modelValue: { type: Object as PropType<any> },
  disabled: { type: Object as PropType<boolean> },
  prefix: { type: Object as PropType<string> },
  initial: { type: Object as PropType<any> },
  extra: { type: Object as PropType<any> },
})

defineEmits(['update:modelValue'])

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const tt = useI18nText()

const config = useModel()

const description = computed(() => tt(props.schema.meta.description))

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
  <DefineTemplate>
    <k-schema
      v-for="(item, key) in schema.dict"
      :key="key"
      #title
      :model-value="config[key]"
      :schema="item"
      :initial="initial?.[key]"
      :disabled="disabled"
      :prefix="`${prefix + key}.`"
      @update:model-value="isNullable($event) ? delete config[key] : config[key] = $event"
    >
      <span class="prefix">{{ prefix }}</span>
      <span>{{ key }}</span>
      <k-badge v-for="{ text, type } in item.meta.badges || []" :key="text" :type="type">
        {{ t(`badge.${text}`) }}
      </k-badge>
    </k-schema>
  </DefineTemplate>

  <SchemaBase
    v-if="extra?.foldable ?? schema.meta.collapse"
    v-bind="$attrs"
    :collapsible="{ initial: schema.meta.collapse }"
  >
    <template #title>
      <slot name="title" />
    </template>
    <template #desc>
      <slot name="desc">
        <k-markdown :source="description" />
      </slot>
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
    <template #collapse>
      <ReuseTemplate />
    </template>
  </SchemaBase>

  <template v-else>
    <h2 v-if="description" class="k-schema-header">
      {{ description }}
    </h2>
    <ReuseTemplate />
  </template>
</template>
