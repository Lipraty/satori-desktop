<script setup lang="ts">
import { ref } from 'vue'

const messaged = ref(false)
</script>

<template>
  <satori-view style="width: 320px;">
    <div class="satori-mesasge-conversation__header">
      <h3>All Chats</h3>
      <satori-spacer />
      <fluent-button icon-only appearance="subtle">
        <satori-icons name="ChatAdd" />
      </fluent-button>
    </div>
  </satori-view>
  <satori-view v-if="messaged" title="Messages">
    Some content
  </satori-view>
  <satori-view>
    <div class="satori-mesasge__skeleton">
      <satori-icons name="Sparkle" filled size="64" />
      <p>No messages yet.</p>
      <p>Click on a chat to start a conversation.</p>
    </div>
  </satori-view>
</template>

<style lang="scss" scoped>
.satori-mesasge__skeleton {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}
.satori-mesasge-conversation__header {
  display: flex;
  align-content: center;
  flex-wrap: nowrap;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: var(--lineHeightBase300);
    font-weight: var(--fontWeightBold);
  }
}
</style>
