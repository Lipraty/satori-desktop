<template>
  <div>
111
  </div>
</template>

<script setup lang="ts">
console.log(window.native.platform)
window.satori.onMessage((message) => {
  console.log('message', message);
});
</script>

<style scoped>

</style>