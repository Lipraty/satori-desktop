<template>
  <satori-view title="Settings">
    <div class="satori-view-info">
      <template v-for="(value, key) of ctx.versions" :key="key">
        <div v-if="value" class="satori-view-info__item">
          <span class="satori-view-info__key">{{ key }}</span>
          <span class="satori-view-info__value">{{ value }}</span>
        </div>
        <fluent-divider orientation="vertical"/>
      </template>
    </div>
    <fluent-divider></fluent-divider>
    <p>System</p>
  </satori-view>
</template>

<script setup lang="ts">
import { useContext } from '@satoriapp/webui'

const ctx = useContext()

</script>

<style lang="scss" scoped>
.satori-view-info {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 16px;
  background-color: var(--colorNeutralBackground1);
  border-radius: var(--borderRadiusMedium);
  margin-bottom: 12px;

  &__item {
    display: flex;
    align-items: center;
    flex-direction: column;
    justify-content: space-between;
    padding: 8px;
    flex: 1;
    max-width: 100%;
  }

  &__key {
    font-weight: var(--fontWeightSemibold);
    color: var(--colorNeutralForeground2);
  }

  &__value {
    color: var(--colorNeutralForeground1);
  }
}
</style>
