<script setup lang="ts">
import { computed } from 'vue'
import { useContext } from '@satoriapp/webui'
import { parseChannelId, useConversation } from './composables/messages'
import ConversationList from './components/ConversationList.vue'
import MessageStream from './components/MessageStream.vue'
import MessageComposer from './components/MessageComposer.vue'

const ctx = useContext()
const { currentId } = useConversation(ctx)

const channelTitle = computed(() => {
  const id = currentId.value
  if (!id) return 'Messages'
  const { channelId, platform } = parseChannelId(id)
  return channelId || platform || id
})
</script>

<template>
  <satori-view title="Conversations" style="width: 320px; flex-shrink: 0;">
    <ConversationList />
  </satori-view>

  <satori-view :title="channelTitle">
    <div v-if="currentId" class="message-view__body">
      <MessageStream :channel-id="currentId" />
      <MessageComposer :channel-id="currentId" />
    </div>
    <div v-else class="message-view__empty">
      <satori-icons name="ChatSparkle" filled size="64" />
      <h3 class="message-view__empty-title">
        Select a conversation
      </h3>
      <p class="message-view__empty-sub">
        Pick a chat from the left to start messaging.
      </p>
    </div>
  </satori-view>
</template>

<style lang="scss" scoped>
.message-view__body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.message-view__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: 12px;
  color: var(--colorNeutralForeground3);
  text-align: center;
  padding: 24px;
}

.message-view__empty-title {
  margin: 0;
  font-size: var(--fontSizeBase500);
  font-weight: var(--fontWeightSemibold);
  color: var(--colorNeutralForeground2);
}

.message-view__empty-sub {
  margin: 0;
  font-size: var(--fontSizeBase300);
  color: var(--colorNeutralForeground3);
}
</style>
