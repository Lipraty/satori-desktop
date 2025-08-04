<script setup lang="ts">
const props = defineProps({
  title: String,
})
</script>

<template>
  <div class="satori-view">
    <div v-if="title" class="satori-view-title">
      <h2>{{ title }}</h2>
      <satori-spacer />
      <div class="satori-view-title-actions">
        <slot name="actions" />
      </div>
    </div>
    <div class="satori-view-content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}
.satori-view {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--colorNeutralBackground6);
  background-color: color-mix(in srgb, var(--colorNeutralBackground2), transparent 15%);
  backdrop-filter: blur(50px);
}
.satori-view-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}
.satori-view-title {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  align-items: center;
  height: 62px;
  padding: 0 14px;
  border-bottom: 1px solid var(--colorNeutralBackground6);
}
.satori-view-title h2 {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0px;
  line-height: 29.05px;
  color: var(--colorNeutralForeground1);
  text-align: left;
  vertical-align: top;
}
</style>
