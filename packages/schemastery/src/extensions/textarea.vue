<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { Schema, useModel } from '../utils'
import SchemaBase from '../base.vue'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<string>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
})

defineEmits(['update:modelValue'])

const config = useModel()

const autosize = computed(() => {
  const { rows } = props.schema.meta.extra || {}
  if (typeof rows === 'number')
    return { minRows: rows, maxRows: rows }
  if (Array.isArray(rows))
    return { minRows: rows[0], maxRows: rows[1] }
  return true
})
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
    <div class="bottom">
      <fluent-text-area
        :value="config ?? ''"
        :disabled="disabled || undefined"
        :rows="autosize === true ? undefined : autosize.minRows"
        style="width: 100%"
        @change="config = ($event.target as HTMLTextAreaElement).value"
      />
    </div>
  </SchemaBase>
</template>
