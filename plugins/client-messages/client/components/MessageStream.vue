<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useContext } from '@satoriapp/webui'
import { useMessageStream } from '../composables/messages'
import type { ClientMessage } from '../composables/messages'

const props = defineProps<{ channelId: string }>()
const ctx = useContext()

const channelId = computed(() => props.channelId)
const { messages, loading } = useMessageStream(ctx, channelId)

const scroller = ref<HTMLElement | null>(null)

watch(messages, async () => {
  await nextTick()
  if (scroller.value) {
    scroller.value.scrollTop = scroller.value.scrollHeight
  }
}, { flush: 'post' })

interface Group {
  key: string
  timestamp: number
  messages: ClientMessage[]
}

const GROUP_GAP_MS = 5 * 60 * 1000

const groups = computed<Group[]>(() => {
  const out: Group[] = []
  let current: Group | null = null
  for (const msg of messages.value) {
    const ts = msg.timestamp ?? 0
    if (!current || ts - current.timestamp > GROUP_GAP_MS) {
      current = { key: String(msg.seq), timestamp: ts, messages: [msg] }
      out.push(current)
    }
    else {
      current.messages.push(msg)
    }
  }
  return out
})

function isOutgoing(msg: ClientMessage): boolean {
  return !!msg.localOnly
}

function formatTime(ts?: number): string {
  if (!ts)
    return ''
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatGroupHeader(ts: number): string {
  if (!ts)
    return ''
  const d = new Date(ts)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  if (sameDay)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div ref="scroller" class="msg-stream">
    <div v-if="loading && messages.length === 0" class="msg-stream__loading">
      <fluent-progress-ring />
      <span>Loading messages…</span>
    </div>
    <div v-else-if="messages.length === 0" class="msg-stream__empty">
      <satori-icons name="ChatSparkle" size="48" />
      <p>No messages in this conversation yet.</p>
    </div>
    <div v-else class="msg-stream__list">
      <div v-for="group in groups" :key="group.key" class="msg-group">
        <div class="msg-group__header">
          {{ formatGroupHeader(group.timestamp) }}
        </div>
        <div
          v-for="msg in group.messages"
          :key="String(msg.seq)"
          class="msg-bubble"
          :class="{ 'is-out': isOutgoing(msg), 'is-event': msg.isEvent, 'is-dead': msg.dead }"
        >
          <div v-if="msg.isEvent" class="msg-bubble__event">
            {{ msg.eventType }} {{ msg.content }}
          </div>
          <template v-else>
            <div class="msg-bubble__content">
              {{ msg.content }}
            </div>
            <div class="msg-bubble__meta">
              {{ formatTime(msg.timestamp) }}
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.msg-stream {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--colorNeutralBackground1);
}

.msg-stream__loading,
.msg-stream__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--colorNeutralForeground3);
  font-size: var(--fontSizeBase300);
}

.msg-stream__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.msg-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-group__header {
  align-self: center;
  padding: 4px 12px;
  font-size: var(--fontSizeBase200);
  color: var(--colorNeutralForeground3);
  margin-bottom: 4px;
}

.msg-bubble {
  display: flex;
  flex-direction: column;
  max-width: 65%;
  align-self: flex-start;

  &.is-out {
    align-self: flex-end;

    .msg-bubble__content {
      background: var(--colorBrandBackground2);
      color: var(--colorNeutralForegroundOnBrand, var(--colorNeutralForeground1));
      border-color: var(--colorBrandStroke2);
    }
  }

  &.is-event {
    align-self: center;
    max-width: 80%;
  }

  &.is-dead {
    opacity: 0.5;
  }
}

.msg-bubble__content {
  background: var(--colorNeutralBackground3);
  color: var(--colorNeutralForeground1);
  padding: 8px 12px;
  border-radius: var(--borderRadiusLarge);
  border: 1px solid var(--colorNeutralStroke2);
  font-size: var(--fontSizeBase300);
  line-height: var(--lineHeightBase300);
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-bubble__event {
  background: var(--colorNeutralBackground2);
  color: var(--colorNeutralForeground3);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--fontSizeBase200);
  text-align: center;
}

.msg-bubble__meta {
  font-size: var(--fontSizeBase100);
  color: var(--colorNeutralForeground3);
  margin-top: 2px;
  padding: 0 4px;
}

.is-out .msg-bubble__meta {
  text-align: right;
}
</style>
