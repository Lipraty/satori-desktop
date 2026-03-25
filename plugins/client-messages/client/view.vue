<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useContext } from '@satoriapp/webui'
import type { ConversationItem } from '@satoriapp/state'
import { useMessages } from './composables/messages'

const ctx = useContext()
const { channels, loadChannel } = useMessages(ctx)

const convList = ref<ConversationItem[]>([])
const currentId = ref('')

const ns = (ctx.stater as any)._namespaces.conversation
convList.value = [...(ns.list ?? [])]
currentId.value = ns.currentId ?? ''

ctx.on('state/changed', (path: string, value: unknown) => {
  if (path === 'conversation.list') convList.value = value as ConversationItem[]
  if (path === 'conversation.currentId') currentId.value = value as string
})

const channelState = computed(() => channels.get(currentId.value))
const channelTitle = computed(() => currentId.value.split(':').slice(1).join(':') || currentId.value)

onMounted(async () => {
  if (currentId.value) await loadChannel(currentId.value)
})

async function select(item: ConversationItem) {
  const id = `${item.platform}:${item.channelId}`
  ctx.stater.conversation.currentId = id
  if (!channels.has(id)) await loadChannel(id)
}

function formatTime(ts?: number) {
  return ts ? new Date(ts).toLocaleTimeString() : ''
}
</script>

<template>
  <satori-view style="width: 320px; flex-shrink: 0;">
    <div class="msg-conv__header">
      <h3>All Chats</h3>
      <satori-spacer />
      <fluent-button icon-only appearance="subtle">
        <satori-icons name="ChatAdd" />
      </fluent-button>
    </div>
    <div class="msg-conv__list">
      <div
        v-for="item in convList"
        :key="`${item.platform}:${item.channelId}`"
        class="msg-conv__item"
        :class="{ active: currentId === `${item.platform}:${item.channelId}` }"
        @click="select(item)"
      >
        <span class="msg-conv__name">{{ item.channelId }}</span>
        <fluent-badge v-if="item.unreadCount > 0" appearance="filled">{{ item.unreadCount }}</fluent-badge>
      </div>
    </div>
  </satori-view>

  <satori-view v-if="currentId" :title="channelTitle">
    <div v-if="channelState?.loading" class="msg-view__loading">Loading…</div>
    <div v-else class="msg-view__messages">
      <div
        v-for="msg in channelState?.messages ?? []"
        :key="String(msg.seq)"
        class="msg-view__msg"
        :class="{ dead: msg.dead }"
      >
        <span class="msg-view__time">{{ formatTime(msg.timestamp) }}</span>
        <p class="msg-view__content">{{ msg.content }}</p>
      </div>
    </div>
  </satori-view>

  <satori-view v-else>
    <div class="msg-skeleton">
      <satori-icons name="Sparkle" filled size="64" />
      <p>No messages yet.</p>
      <p>Click on a chat to start a conversation.</p>
    </div>
  </satori-view>
</template>

<style lang="scss" scoped>
.msg-conv__header {
  display: flex; align-items: center; flex-direction: row;
  h3 { font-size: var(--lineHeightBase300); font-weight: var(--fontWeightBold); }
}
.msg-conv__list { display: flex; flex-direction: column; gap: 2px; }
.msg-conv__item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-radius: 6px; cursor: pointer;
  &:hover { background: var(--colorNeutralBackground1Hover); }
  &.active { background: var(--colorNeutralBackground1Selected); }
}
.msg-view__messages { display: flex; flex-direction: column; gap: 8px; }
.msg-view__msg { display: flex; flex-direction: column; gap: 2px;
  &.dead { opacity: 0.4; }
}
.msg-view__time { font-size: 11px; color: var(--colorNeutralForeground3); }
.msg-skeleton {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  height: 100%; width: 100%;
}
</style>
