<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { isNullable } from 'cosmokit'
import { Schema, useModel } from '../utils'
import SchemaBase from '../base.vue'
import SchemaPrimitive from '../primitive.vue'

const props = defineProps({
  schema: { type: Object as PropType<Schema> },
  modelValue: { type: Object as PropType<any[]> },
  disabled: { type: Object as PropType<boolean> },
  prefix: { type: Object as PropType<string> },
  initial: { type: Object as PropType<{}> },
})

defineEmits(['update:modelValue'])

const config = useModel()

const valid = computed(() => {
  return props.schema.list.every(item => ['string', 'number', 'boolean'].includes(item.type))
})

function handleUpdate(value: any, index: number) {
  config.value[index] = value
  let length = config.value.length
  while (length > 0 && isNullable(config.value[length - 1])) {
    length--
  }
  config.value = config.value.slice(0, length)
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
    <template v-if="valid" #prefix>
      <slot name="prefix" />
    </template>
    <template v-if="valid" #suffix>
      <slot name="suffix" />
    </template>
    <template v-if="valid" #control>
      <SchemaPrimitive
        v-for="(item, index) in schema.list"
        :key="index"
        :schema="item"
        :disabled="disabled"
        :model-value="config[index]"
        @update:model-value="handleUpdate($event, index)"
      />
    </template>
  </SchemaBase>
</template>
