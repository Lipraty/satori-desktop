<template>
  <div class="satori-system-bar">
    <satori-spacer v-if="platform === 'macos'" />
    <span>Satori App for Desktop</span>
    <satori-spacer />
  </div>
</template>

<script setup lang="ts">
import { useContext } from '@satoriapp/renderer';
import { } from 'vue'

const ctx = useContext()
const platform = ctx.getPlatform()
</script>

<style scoped lang="scss">
.satori-system-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 16px;
  height: 44px;
  app-region: drag;
}

.satori-system-bar span {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0px;
  line-height: 20.27px;
  color: var(--colorNeutralForeground1);
  text-align: left;
  vertical-align: top;
}
</style>
