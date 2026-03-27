<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContext } from '@satoriapp/webui'
import type { ConversationItem } from '@satoriapp/state'

const ctx = useContext()

const convList = ref<ConversationItem[]>([])
const selected = ref<ConversationItem | null>(null)
const search = ref('')

const ns = (ctx.stater as any)._namespaces.conversation
convList.value = [...(ns.list ?? [])]

ctx.on('state/changed', (path: string, value: unknown) => {
  if (path === 'conversation.list')
    convList.value = value as ConversationItem[]
})

const contacts = computed(() =>
  convList.value
    .filter(i => i.type === 'private')
    .filter(i => !search.value || i.channelId.includes(search.value)),
)

function avatarChar(item: ConversationItem) {
  return item.channelId.charAt(0).toUpperCase()
}

function goToMessages(item: ConversationItem) {
  ctx.stater.conversation.currentId = `${item.platform}:${item.channelId}`
  ctx.$router.router.push('/')
}
</script>

<template>
  <satori-view style="width: 280px; flex-shrink: 0;" title="Contacts">
    <div class="person-search">
      <fluent-text-input v-model="search" placeholder="Search contacts…" style="width: 100%;" />
    </div>
    <div class="person-list">
      <div
        v-for="item in contacts"
        :key="`${item.platform}:${item.channelId}`"
        class="person-item"
        :class="{ active: selected === item }"
        @click="selected = item"
      >
        <div class="person-avatar">
          {{ avatarChar(item) }}
        </div>
        <span class="person-name">{{ item.channelId }}</span>
      </div>
      <div v-if="contacts.length === 0" class="person-empty">
        No contacts found.
      </div>
    </div>
  </satori-view>

  <satori-view v-if="selected" :title="selected.channelId">
    <div class="person-detail">
      <div class="person-detail__avatar">
        {{ avatarChar(selected) }}
      </div>
      <h3 class="person-detail__name">
        {{ selected.channelId }}
      </h3>
      <p class="person-detail__meta">
        Platform: {{ selected.platform }}
      </p>
      <p class="person-detail__meta">
        Channel: {{ selected.channelId }}
      </p>
      <fluent-button appearance="primary" @click="goToMessages(selected)">
        Send Message
      </fluent-button>
    </div>
  </satori-view>

  <satori-view v-else>
    <div class="person-skeleton">
      <satori-icons name="Person" filled size="64" />
      <p>Select a contact to view details.</p>
    </div>
  </satori-view>
</template>

<style lang="scss" scoped>
.person-search { padding-bottom: 8px; }
.person-list { display: flex; flex-direction: column; gap: 2px; }
.person-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 6px; cursor: pointer;
  &:hover { background: var(--colorNeutralBackground1Hover); }
  &.active { background: var(--colorNeutralBackground1Selected); }
}
.person-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: var(--colorBrandBackground); color: var(--colorNeutralForegroundOnBrand);
  display: flex; align-items: center; justify-content: center;
  font-weight: var(--fontWeightSemibold); font-size: 15px;
}
.person-name { font-size: 14px; }
.person-empty { padding: 16px 0; color: var(--colorNeutralForeground3); font-size: 13px; text-align: center; }
.person-detail {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 24px 16px;
  &__avatar {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--colorBrandBackground); color: var(--colorNeutralForegroundOnBrand);
    display: flex; align-items: center; justify-content: center;
    font-size: 28px; font-weight: var(--fontWeightSemibold);
  }
  &__name { font-size: 18px; font-weight: var(--fontWeightSemibold); margin: 0; }
  &__meta { font-size: 13px; color: var(--colorNeutralForeground3); margin: 0; }
}
.person-skeleton {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  height: 100%; width: 100%;
}
</style>
