<script setup lang="ts">
import { computed } from 'vue'
import { useContext } from '../context'

const { name, single = false } = defineProps<{ name: string, single?: boolean }>()

const ctx = useContext()
const items = computed(() => ctx.client.router.views[name] ?? [])
const visible = computed(() => single ? items.value.slice(-1) : items.value)
</script>

<template>
  <component :is="item.component" v-for="(item, i) in visible" :key="i" />
</template>
