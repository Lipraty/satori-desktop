<script setup lang="ts">
import type { AdapterPageConfig } from './schema'
import { useContext } from '@satoriapp/webui'
import { onMounted, ref } from 'vue'
import { NETWORK_ADAPTER_MANIFESTS } from './schema'

const ctx = useContext()

const loading = ref(false)
const error = ref('')

interface AdapterCardState {
  packageName: string
  enabled: boolean
  expanded: boolean
  config: Record<string, any>
  dirty: boolean
  saving: boolean
  savedAt: number | null
  saveError: string
}

const cards = ref<AdapterCardState[]>(
  NETWORK_ADAPTER_MANIFESTS.map(m => ({
    packageName: m.packageName,
    enabled: false,
    expanded: false,
    config: { ...m.defaultConfig },
    dirty: false,
    saving: false,
    savedAt: null,
    saveError: '',
  })),
)

async function loadConfig() {
  const result = await ctx.link.action<{ config: AdapterPageConfig }>('network.get', {})
  if (!result?.config)
    return
  for (const card of cards.value) {
    const item = result.config.adapters?.[card.packageName]
    if (!item)
      continue
    card.enabled = item.enabled ?? false
    card.config = { ...(item.config || {}) }
    card.expanded = card.enabled
    card.dirty = false
  }
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    await loadConfig()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    loading.value = false
  }
})

function onToggle(card: AdapterCardState, value: boolean) {
  card.enabled = value
  if (value && !card.expanded)
    card.expanded = true
  card.dirty = true
}

function onConfigChange(card: AdapterCardState) {
  card.dirty = true
}

async function applyCard(card: AdapterCardState) {
  card.saving = true
  card.saveError = ''
  try {
    await ctx.link.action('network.set', {
      adapters: {
        [card.packageName]: {
          enabled: card.enabled,
          config: card.config,
        },
      },
    })
    card.savedAt = Date.now()
    card.dirty = false
  }
  catch (e) {
    card.saveError = e instanceof Error ? e.message : String(e)
  }
  finally {
    card.saving = false
  }
}

function resetCard(card: AdapterCardState) {
  const manifest = NETWORK_ADAPTER_MANIFESTS.find(m => m.packageName === card.packageName)
  if (!manifest)
    return
  card.config = { ...manifest.defaultConfig }
  card.enabled = manifest.defaultEnabled
  card.dirty = true
}
</script>

<template>
  <satori-view title="Networks">
    <div class="network-page">
      <p v-if="loading" class="network-page__status">
        Loading configuration...
      </p>
      <p v-else-if="error" class="network-page__status network-page__status--error">
        {{ error }}
      </p>

      <div
        v-if="!loading && !cards.some(c => c.enabled)"
        class="network-page__oobe"
      >
        <p>No accounts configured — set up Satori to get started</p>
      </div>

      <div class="network-page__cards">
        <div
          v-for="card in cards"
          :key="card.packageName"
          class="adapter-card"
        >
          <div class="adapter-card__header">
            <div class="adapter-card__info">
              <span class="adapter-card__name">
                {{ NETWORK_ADAPTER_MANIFESTS.find(m => m.packageName === card.packageName)?.displayName }}
              </span>
              <fluent-badge :appearance="card.enabled ? 'filled' : 'ghost'">
                {{ card.enabled ? 'Enabled' : 'Disabled' }}
              </fluent-badge>
            </div>
            <fluent-switch
              :checked="card.enabled"
              @change="(e: any) => onToggle(card, e.target.checked)"
            />
          </div>

          <div v-if="card.expanded" class="adapter-card__body">
            <k-form
              :model-value="card.config"
              :schema="NETWORK_ADAPTER_MANIFESTS.find(m => m.packageName === card.packageName)!.configSchema"
              @update:model-value="(v) => { card.config = v; onConfigChange(card) }"
            />

            <div class="adapter-card__footer">
              <p v-if="card.savedAt && !card.dirty" class="adapter-card__saved">
                Saved at {{ new Date(card.savedAt).toLocaleString() }}
              </p>
              <p v-if="card.saveError" class="adapter-card__error">
                {{ card.saveError }}
              </p>
              <div class="adapter-card__actions">
                <fluent-button
                  appearance="primary"
                  :disabled="card.saving || !card.dirty"
                  @click="applyCard(card)"
                >
                  {{ card.saving ? 'Applying...' : 'Apply' }}
                </fluent-button>
                <fluent-button
                  appearance="subtle"
                  :disabled="card.saving"
                  @click="resetCard(card)"
                >
                  Reset
                </fluent-button>
              </div>
            </div>
          </div>

          <button
            class="adapter-card__expand-btn"
            @click="card.expanded = !card.expanded"
          >
            {{ card.expanded ? 'Collapse' : 'Configure' }}
          </button>
        </div>
      </div>
    </div>
  </satori-view>
</template>

<style scoped lang="scss">
.network-page {
  padding: 4px 0;

  &__status {
    color: var(--colorNeutralForeground2);
    margin-bottom: 12px;

    &--error {
      color: var(--colorStatusDangerForeground1);
    }
  }

  &__oobe {
    background: var(--colorNeutralBackground2);
    border-radius: var(--borderRadiusMedium);
    padding: 16px;
    margin-bottom: 16px;
    color: var(--colorNeutralForeground2);
    text-align: center;
  }

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.adapter-card {
  background: var(--colorNeutralBackground1);
  border: 1px solid var(--colorNeutralStroke1);
  border-radius: var(--borderRadiusLarge);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-weight: 600;
    color: var(--colorNeutralForeground1);
  }

  &__body {
    padding: 0 16px 12px;
    border-top: 1px solid var(--colorNeutralStroke1);
  }

  &__footer {
    margin-top: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  &__saved {
    font-size: 12px;
    color: var(--colorNeutralForeground3);
  }

  &__error {
    font-size: 12px;
    color: var(--colorStatusDangerForeground1);
  }

  &__expand-btn {
    width: 100%;
    padding: 6px 16px;
    background: var(--colorNeutralBackground2);
    border: none;
    border-top: 1px solid var(--colorNeutralStroke1);
    color: var(--colorBrandForeground1);
    cursor: pointer;
    font-size: 12px;
    text-align: center;

    &:hover {
      background: var(--colorNeutralBackground2Hover);
    }
  }
}
</style>
