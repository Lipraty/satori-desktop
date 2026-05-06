<script setup lang="ts">
import { computed } from 'vue'
import { useContext } from '@satoriapp/webui'
import type { ConversationItem } from '@satoriapp/state'
import { toChannelId, useConversation } from '../composables/messages'

const ctx = useContext()
const { conversations, currentId, select } = useConversation(ctx)

const sortedList = computed(() => {
  return [...conversations.value].sort((a, b) => {
    if (a.pinned !== b.pinned)
      return a.pinned ? -1 : 1
    return 0
  })
})

function isActive(item: ConversationItem) {
  return currentId.value === toChannelId(item)
}

function displayTitle(item: ConversationItem): string {
  return item.channelId
}

function displaySubtitle(item: ConversationItem): string {
  return item.platform
}
</script>

<template>
  <aside class="conv-list">
    <header class="conv-list__header">
      <h2 class="conv-list__title">
        All Chats
      </h2>
      <fluent-button icon-only appearance="subtle" title="New chat">
        <satori-icons name="ChatAdd" />
      </fluent-button>
    </header>
    <div v-if="sortedList.length === 0" class="conv-list__empty">
      <satori-icons name="ChatSparkle" size="32" />
      <span>No conversations</span>
    </div>
    <ul v-else class="conv-list__items">
      <li
        v-for="item in sortedList"
        :key="toChannelId(item)"
        class="conv-list__item"
        :class="{ 'is-active': isActive(item), 'is-mute': item.mute }"
        :tabindex="0"
        role="button"
        @click="select(item)"
        @keydown.enter.prevent="select(item)"
      >
        <div class="conv-list__avatar">
          <satori-icons name="Person" />
        </div>
        <div class="conv-list__body">
          <div class="conv-list__row">
            <span class="conv-list__name">{{ displayTitle(item) }}</span>
            <fluent-badge
              v-if="item.unreadCount > 0"
              appearance="filled"
              color="brand"
              class="conv-list__badge"
            >
              {{ item.unreadCount > 99 ? '99+' : item.unreadCount }}
            </fluent-badge>
          </div>
          <span class="conv-list__sub">{{ displaySubtitle(item) }}</span>
        </div>
      </li>
    </ul>
  </aside>
</template>

<style lang="scss" scoped>
.conv-list {
  display: flex;
  flex-direction: column;
  width: 280px;
  flex-shrink: 0;
  background: var(--colorNeutralBackground2);
  border-right: 1px solid var(--colorNeutralStroke2);
  overflow: hidden;
}

.conv-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  height: 48px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--colorNeutralStroke2);
}

.conv-list__title {
  margin: 0;
  font-size: var(--fontSizeBase400);
  font-weight: var(--fontWeightSemibold);
  color: var(--colorNeutralForeground1);
}

.conv-list__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex: 1;
  color: var(--colorNeutralForeground3);
  font-size: var(--fontSizeBase200);
}

.conv-list__items {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 4px 8px;
  overflow-y: auto;
  gap: 2px;
  flex: 1;
}

.conv-list__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: var(--borderRadiusMedium);
  cursor: pointer;
  transition: background-color var(--durationFaster) var(--curveEasyEase);
  outline: none;

  &:hover {
    background: var(--colorNeutralBackground1Hover);
  }

  &:focus-visible {
    outline: 2px solid var(--colorStrokeFocus2);
    outline-offset: -2px;
  }

  &.is-active {
    background: var(--colorNeutralBackground1Selected);
  }

  &.is-mute .conv-list__name {
    color: var(--colorNeutralForeground3);
  }
}

.conv-list__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--colorNeutralBackground4);
  color: var(--colorNeutralForeground2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.conv-list__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.conv-list__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-list__name {
  font-size: var(--fontSizeBase300);
  font-weight: var(--fontWeightSemibold);
  color: var(--colorNeutralForeground1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-list__sub {
  font-size: var(--fontSizeBase200);
  color: var(--colorNeutralForeground3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-list__badge {
  flex-shrink: 0;
}
</style>
