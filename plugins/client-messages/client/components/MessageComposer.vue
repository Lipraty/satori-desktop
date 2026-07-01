<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useContext } from '@satoriapp/webui'
import { sendMessage as send, useDraft } from '../composables/messages'

const props = defineProps<{ channelId: string }>()
const ctx = useContext()

const channelId = computed(() => props.channelId)
const { draft } = useDraft(ctx, channelId)

const sending = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const sendKey = computed<'Enter' | 'Ctrl+Enter' | 'Cmd+Enter'>(
  () => ctx.stater.data.app?.messageInput?.sendKey ?? 'Enter',
)

const canSend = computed(() => !sending.value && draft.value.trim().length > 0)

watch(draft, async () => {
  await nextTick()
  resizeTextarea()
})

watch(channelId, async () => {
  await nextTick()
  resizeTextarea()
  textareaRef.value?.focus()
})

function resizeTextarea() {
  const el = textareaRef.value
  if (!el)
    return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

async function submit() {
  if (!canSend.value)
    return
  const content = draft.value.trim()
  sending.value = true
  try {
    await send(ctx, channelId.value, content)
    draft.value = ''
  }
  catch (err) {
    console.warn('[messages] sendMessage failed:', err instanceof Error ? err.message : String(err))
  }
  finally {
    sending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    draft.value = ''
    e.preventDefault()
    return
  }
  if (e.key !== 'Enter')
    return
  const k = sendKey.value
  if (k === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    void submit()
  }
  else if (k === 'Ctrl+Enter' && e.ctrlKey) {
    e.preventDefault()
    void submit()
  }
  else if (k === 'Cmd+Enter' && e.metaKey) {
    e.preventDefault()
    void submit()
  }
}

const placeholder = computed(() => {
  const k = sendKey.value
  return k === 'Enter'
    ? 'Type a message… (Enter to send, Shift+Enter for newline)'
    : k === 'Ctrl+Enter'
      ? 'Type a message… (Ctrl+Enter to send)'
      : 'Type a message… (Cmd+Enter to send)'
})
</script>

<template>
  <div class="composer">
    <div class="composer__inner">
      <textarea
        ref="textareaRef"
        v-model="draft"
        class="composer__textarea"
        rows="1"
        :placeholder="placeholder"
        :disabled="sending || undefined"
        @keydown="onKeydown"
      />
      <div class="composer__actions">
        <fluent-button
          appearance="primary"
          :disabled="!canSend || undefined"
          @click="submit"
        >
          <satori-icons name="Send" />
          <span class="composer__send-text">Send</span>
        </fluent-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.composer {
  flex-shrink: 0;
  padding: 12px 16px 16px;
  background: var(--colorNeutralBackground1);
  border-top: 1px solid var(--colorNeutralStroke2);
}

.composer__inner {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--colorNeutralBackground2);
  border: 1px solid var(--colorNeutralStroke1);
  border-radius: var(--borderRadiusLarge);
  padding: 8px 8px 8px 12px;
  transition: border-color var(--durationFaster) var(--curveEasyEase);

  &:focus-within {
    border-color: var(--colorBrandStroke1);
  }
}

.composer__textarea {
  flex: 1;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--colorNeutralForeground1);
  font-family: var(--fontFamilyBase);
  font-size: var(--fontSizeBase300);
  line-height: var(--lineHeightBase300);
  padding: 4px 0;
  min-height: 24px;
  max-height: 160px;

  &::placeholder {
    color: var(--colorNeutralForeground4);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.composer__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.composer__send-text {
  margin-left: 4px;
}
</style>
