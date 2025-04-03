<template>
  <div>
111
  </div>
</template>

<script setup lang="ts">
import { useContext } from './context'
const ctx = useContext()
ctx.on('message', (session) => {
  console.log('message', session)
})
</script>

<style scoped>

</style>