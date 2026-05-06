<script lang="ts" setup>
import { IconClose } from './icons'
import { useI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.yml'
import enUS from './locales/en-US.yml'

defineProps<{
  jsonInput: string
  jsonError: string
  show: boolean
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  'update:jsonInput': [value: string]
  'copyToClipboard': []
  'saveChanges': []
}>()

const { t, setLocaleMessage } = useI18n({
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept('./locales/zh-CN.yml', (module) => {
    setLocaleMessage('zh-CN', module.default)
  })
  import.meta.hot.accept('./locales/en-US.yml', (module) => {
    setLocaleMessage('en-US', module.default)
  })
}
</script>

<template>
  <fluent-dialog class="k-schema-edit-dialog" :aria-label="t('edit.json')" :hidden="!show || undefined">
    <fluent-dialog-body>
      <fluent-text :slot="'title'">{{ t('edit.json') }}</fluent-text>
      <fluent-button :slot="'title-action'" appearance="transparent" icon-only @click="$emit('update:show', false)">
        <IconClose />
      </fluent-button>
      <fluent-text-area
        :class="{ invalid: jsonError }"
        :value="jsonInput"
        style="width: 100%"
        :rows="Math.min(10, Math.max(2, jsonInput.split('\n').length))"
        @change="$emit('update:jsonInput', ($event.target as HTMLTextAreaElement).value)"
      />
      <fluent-button @click="$emit('copyToClipboard')">
        {{ t('edit.copy') }}
      </fluent-button>
      <fluent-button appearance="primary" :disabled="!!jsonError || undefined" @click="$emit('saveChanges')">
        {{ t('edit.save') }}
      </fluent-button>
    </fluent-dialog-body>
  </fluent-dialog>
</template>
