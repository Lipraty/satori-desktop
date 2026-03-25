<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{ source?: string }>()

const rendered = computed(() => {
  if (!props.source)
    return ''
  return props.source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
})
</script>

<template>
  <div v-if="source" class="k-markdown" v-html="rendered" />
</template>
