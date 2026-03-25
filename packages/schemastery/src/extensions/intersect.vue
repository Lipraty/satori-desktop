<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { createReusableTemplate } from '@vueuse/core'
import { getChoices, Schema, useI18nText } from '../utils'
import SchemaBase from '../base.vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<any>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<any>,
  extra: {} as PropType<any>,
})

defineEmits(['update:modelValue'])

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const tt = useI18nText()

const description = computed(() => tt(props.schema.meta.description))
</script>

<template>
  <DefineTemplate>
    <k-schema
      v-for="(item, index) in getChoices(schema)"
      :key="index"
      :model-value="modelValue"
      :schema="extra?.foldable ? item : { ...item, meta: { ...schema.meta, ...item.meta } }"
      :initial="initial"
      :disabled="disabled"
      :prefix="prefix"
      :extra="{ foldable: false }"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #title>
        <slot name="title" />
      </template>
      <template #prefix>
        <slot name="prefix" />
      </template>
      <template #suffix>
        <slot name="suffix" />
      </template>
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
