<script setup lang="ts">
import type { AdapterEntry } from '@satoriapp/state'
import { NETWORK_ADAPTER_MANIFESTS } from '@satoriapp/adapter'
import { useContext } from '@satoriapp/webui'
import { computed, ref } from 'vue'

const ctx = useContext()
const adapters = computed<Record<string, AdapterEntry>>(() => ctx.stater.data.app.network?.adapters ?? {})

const expanded = ref<Record<string, boolean>>({})

function manifestOf(packageName: string) {
  return NETWORK_ADAPTER_MANIFESTS.find(m => m.packageName === packageName)
}

function configurable(packageName: string) {
  return !!manifestOf(packageName)
}

function entryFor(packageName: string): AdapterEntry {
  return adapters.value[packageName] ?? { enabled: false, config: {} }
}

function toggle(packageName: string, enabled: boolean) {
  ctx.stater.mutate((d) => {
    d.app.network ??= { adapters: {} }
    d.app.network.adapters[packageName] = {
      ...(d.app.network.adapters[packageName] ?? { enabled: false, config: {} }),
      enabled,
    }
  })
  if (enabled)
    expanded.value[packageName] = true
}

function updateConfig(packageName: string, config: Record<string, any>) {
  ctx.stater.mutate((d) => {
    d.app.network ??= { adapters: {} }
    d.app.network.adapters[packageName] = {
      ...(d.app.network.adapters[packageName] ?? { enabled: false, config: {} }),
      config,
    }
  })
}

function reset(packageName: string) {
  const manifest = manifestOf(packageName)
  if (!manifest)
    return
  ctx.stater.mutate((d) => {
    d.app.network ??= { adapters: {} }
    d.app.network.adapters[packageName] = {
      enabled: manifest.defaultEnabled,
      config: { ...manifest.defaultConfig },
    }
  })
}
</script>

<template>
  <satori-view title="Networks">
    <div class="network-page">
      <div class="network-page__cards">
        <div
          v-for="manifest in NETWORK_ADAPTER_MANIFESTS"
          :key="manifest.packageName"
          class="adapter-card"
        >
          <div class="adapter-card__header">
            <div class="adapter-card__info">
              <span class="adapter-card__name">{{ manifest.displayName }}</span>
              <fluent-badge :appearance="entryFor(manifest.packageName).enabled ? 'filled' : 'ghost'">
                {{ entryFor(manifest.packageName).enabled ? 'Enabled' : 'Disabled' }}
              </fluent-badge>
            </div>
            <fluent-switch
              :checked="entryFor(manifest.packageName).enabled"
              @change="(e: any) => toggle(manifest.packageName, e.target.checked)"
            />
          </div>

          <div v-if="expanded[manifest.packageName] || entryFor(manifest.packageName).enabled" class="adapter-card__body">
            <k-form
              v-if="configurable(manifest.packageName)"
              :model-value="entryFor(manifest.packageName).config"
              :schema="manifest.configSchema"
              @update:model-value="(v) => updateConfig(manifest.packageName, v)"
            />
            <div class="adapter-card__footer">
              <fluent-button appearance="subtle" @click="reset(manifest.packageName)">
                Reset
              </fluent-button>
            </div>
          </div>

          <button
            class="adapter-card__expand-btn"
            @click="expanded[manifest.packageName] = !expanded[manifest.packageName]"
          >
            {{ expanded[manifest.packageName] ? 'Collapse' : 'Configure' }}
          </button>
        </div>
      </div>
    </div>
  </satori-view>
</template>

<style scoped lang="scss">
.network-page {
  padding: 16px;

  &__cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.adapter-card {
  background: var(--colorNeutralBackground1);
  border-radius: var(--borderRadiusLarge);
  padding: 16px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-weight: var(--fontWeightSemibold);
  }

  &__body {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--colorNeutralStroke1);
  }

  &__footer {
    margin-top: 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  &__expand-btn {
    display: block;
    margin-top: 8px;
    background: none;
    border: none;
    color: var(--colorBrandForeground1);
    cursor: pointer;
    padding: 0;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
