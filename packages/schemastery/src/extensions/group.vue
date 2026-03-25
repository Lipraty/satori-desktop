<script lang="ts" setup>
import { PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { Schema, useEntries } from '../utils'
import { IconArrowDown, IconArrowUp, IconDelete, IconInsertAfter, IconInsertBefore } from '../icons'
import SchemaBase from '../base.vue'
import zhCN from '../locales/zh-CN.yml'
import enUS from '../locales/en-US.yml'

defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<any>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<any>,
  extra: {} as PropType<any>,
})

defineEmits(['update:modelValue'])

const { entries, up, down, insert, del, isMax, isMin, isFixedLength } = useEntries()

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
  <SchemaBase v-bind="$attrs" :collapsible="{ initial: schema.meta.collapse }">
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
        {{ t('entry.add-item') }}
      </fluent-button>
    </template>
    <template #collapse>
      <k-schema
        v-for="([key, _], index) in entries"
        :key="key"
        v-model="entries[index][1]"
        :initial="(initial ?? schema.meta.default)[key]"
        :schema="schema.inner"
        :disabled="disabled"
        :prefix="schema.type === 'array' ? `${prefix.slice(0, -1)}[${key}].` : `${prefix + key}.`"
        :extra="{
          foldable: true,
          changed: key in (initial ?? schema.meta.default) ? undefined : true,
          invalid: entries.filter(e => e[0] === key).length > 1,
        }"
      >
        <template #menu>
          <div class="k-menu-separator" />
          <div class="k-menu-item" :class="{ disabled: disabled || !index }" @click="up(index)">
            <span class="k-menu-icon"><IconArrowUp /></span>
            {{ t('entry.move-up') }}
          </div>
          <div class="k-menu-item" :class="{ disabled: disabled || index === entries.length - 1 }" @click="down(index)">
            <span class="k-menu-icon"><IconArrowDown /></span>
            {{ t('entry.move-down') }}
          </div>
          <div v-if="!isFixedLength" class="k-menu-item" :class="{ disabled: disabled || isMin }" @click="del(index)">
            <span class="k-menu-icon"><IconDelete /></span>
            {{ t('entry.del-item') }}
          </div>
          <div v-if="!isFixedLength" class="k-menu-item" :class="{ disabled: disabled || isMax }" @click="insert(index)">
            <span class="k-menu-icon"><IconInsertBefore /></span>
            {{ t('entry.insert-before') }}
          </div>
          <div v-if="!isFixedLength" class="k-menu-item" :class="{ disabled: disabled || isMax }" @click="insert(index + 1)">
            <span class="k-menu-icon"><IconInsertAfter /></span>
            {{ t('entry.insert-after') }}
          </div>
        </template>
        <template #title>
          <span class="prefix">{{ prefix.slice(0, -1) }}</span>
          <template v-if="schema.type === 'array'">
            [{{ key }}]
          </template>
          <template v-else>
            ['
            <span class="entry-input">
              <span v-if="entries[index][0]" class="shadow">{{ entries[index][0] }}</span>
              <span v-else class="placeholder">&nbsp;</span>
              <input v-model="entries[index][0]">
            </span>
            ']
          </template>
        </template>
      </k-schema>
    </template>
  </SchemaBase>
</template>

<style lang="scss" scoped>
.entry-input {
  position: relative;

  .shadow {
    visibility: hidden;
    white-space: pre;
  }

  .placeholder {
    min-width: 2rem;
    display: inline-block;
  }

  input {
    position: absolute;
    left: -.5em;
    right: -.5em;
    border: none;
    padding: 0 .5em;
    margin: 0;
    font-size: 1em;
    font-weight: inherit;
    font-family: inherit;
    border-radius: 0;
    outline: none;
  }
}
</style>
