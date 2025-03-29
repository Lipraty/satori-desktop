<template>
  <div>
111
  </div>
</template>

<script setup lang="ts">
console.log(window.native.platform)
window.satori.addListener('satori:message-created', (message) => {
  console.log('satori:message-created', message)
})
</script>

<style scoped>

</style>