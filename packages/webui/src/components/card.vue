<template>
  <div class="satori-card">
    <div class="satori-card__header">
      <slot name="header"></slot>
    </div>
    <div class="satori-card__body">
      <slot></slot>
    </div>
    <div class="satori-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
.satori-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--colorNeutralBackground1);
  border-radius: 8px;
  box-shadow: var(--shadowDepth4);
  overflow: hidden;

  &__header {
    padding: 16px;
    border-bottom: 1px solid var(--colorNeutralStroke1);
    font-weight: bold;
  }

  &__body {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  &__footer {
    padding: 16px;
    border-top: 1px solid var(--colorNeutralStroke1);
    text-align: right;
  }
}
</style>