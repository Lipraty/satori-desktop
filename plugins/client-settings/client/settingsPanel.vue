<script setup lang="ts">
import type { SettingsPageConfig } from './schema'
import { useContext } from '@satoriapp/webui'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { SettingsPageConfigSchema, SettingsPluginConfigDefault } from './schema'
import { useConfig } from './service'

interface PluginEntry {
  name: string
  pluginName: string
  packageName?: string
  source: 'internal' | 'external'
  health: { state: string, updatedAt: number, message?: string }
  enabled: boolean
}

interface NavItem {
  id: string
  label: string
  type: 'setting' | 'plugin'
  plugin?: PluginEntry
}

const ctx = useContext()
const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const savedAt = ref<number | null>(null)
const plugins = ref<PluginEntry[]>([])
const toggling = ref<Record<string, boolean>>({})

const config = useConfig(true)

const settingNavItems = computed<NavItem[]>(() =>
  Object.entries(ctx.$setting.entries).map(([id, list]) => ({
    id,
    label: list[0]?.title || id,
    type: 'setting',
  })),
)

const pluginNavItems = computed<NavItem[]>(() =>
  plugins.value
    .filter(p => !p.pluginName.startsWith('adapter-'))
    .map(p => ({
      id: `plugin:${p.name}`,
      label: p.pluginName,
      type: 'plugin',
      plugin: p,
    })),
)

const allNavItems = computed<NavItem[]>(() => [...settingNavItems.value, ...pluginNavItems.value])

const path = computed({
  get() {
    const name = route.params.name?.toString()
    if (name && allNavItems.value.some(item => item.id === name))
      return name
    return allNavItems.value[0]?.id || ''
  },
  set(value: string) {
    const next = allNavItems.value.some(item => item.id === value) ? value : allNavItems.value[0]?.id || ''
    router.replace(`/settings/${next}`)
  },
})

const selectedItem = computed<NavItem | undefined>(() =>
  allNavItems.value.find(item => item.id === path.value),
)

const activeSettings = computed(() => {
  const key = path.value
  return key ? (ctx.$setting.entries[key] || []) : []
})

async function loadConfig() {
  const result = await ctx.link.action<{ config: SettingsPageConfig }>(
    'settings.get',
    {},
  )
  config.value = SettingsPageConfigSchema(result?.config)
}

async function loadPlugins() {
  const result = await ctx.link.action<{ plugins: PluginEntry[] }>('loader.list', {})
  plugins.value = result?.plugins ?? []
}

async function saveConfig() {
  saving.value = true
  error.value = ''
  try {
    const payload = SettingsPageConfigSchema(config.value)
    const result = await ctx.link.action<{ savedAt: number }>(
      'settings.set',
      payload,
    )
    savedAt.value = result?.savedAt || Date.now()
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    saving.value = false
  }
}

async function togglePlugin(plugin: PluginEntry, enabled: boolean) {
  toggling.value[plugin.name] = true
  try {
    await ctx.link.action('loader.toggle', { name: plugin.name, enabled })
    plugin.enabled = enabled
    plugin.health.state = enabled ? 'active' : 'stopped'
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    toggling.value[plugin.name] = false
  }
}

function healthAppearance(state: string): string {
  return state === 'active' ? 'filled' : state === 'failed' ? 'ghost' : 'outline'
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    await Promise.all([loadConfig(), loadPlugins()])
    if (!route.params.name && allNavItems.value[0]?.id) {
      path.value = allNavItems.value[0].id
    }
  }
  catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="settings-panel">
    <aside class="settings-panel__left">
      <div class="settings-panel__scroll">
        <template v-if="settingNavItems.length">
          <div class="settings-panel__section-label">
            设置
          </div>
          <div
            v-for="item in settingNavItems"
            :key="item.id"
            class="settings-panel__nav-item"
            :class="{ active: path === item.id }"
            @click="path = item.id"
          >
            {{ item.label }}
          </div>
        </template>

        <template v-if="pluginNavItems.length">
          <div class="settings-panel__section-label">
            插件
          </div>
          <div
            v-for="item in pluginNavItems"
            :key="item.id"
            class="settings-panel__nav-item"
            :class="{ active: path === item.id }"
            @click="path = item.id"
          >
            {{ item.label }}
          </div>
        </template>
      </div>
    </aside>

    <section class="settings-panel__main">
      <div class="settings-panel__toolbar">
        <h3>{{ selectedItem?.label || 'Settings' }}</h3>
        <div v-if="selectedItem?.type === 'setting'" class="settings-panel__actions">
          <fluent-button appearance="primary" :disabled="saving || loading" @click="saveConfig">
            {{ saving ? 'Saving...' : 'Save' }}
          </fluent-button>
          <fluent-button
            appearance="subtle"
            :disabled="saving || loading"
            @click="config = { plugins: { ...SettingsPluginConfigDefault } }"
          >
            Reset
          </fluent-button>
        </div>
      </div>

      <p v-if="savedAt && selectedItem?.type === 'setting'" class="settings-panel__saved">
        Saved at {{ new Date(savedAt).toLocaleString() }}
      </p>
      <p v-if="loading">
        Loading...
      </p>
      <p v-else-if="error" class="settings-panel__error">
        {{ error }}
      </p>

      <keep-alive>
        <div v-if="!loading && !error" :key="path" class="settings-panel__content">
          <template v-if="selectedItem?.type === 'plugin' && selectedItem.plugin">
            <div class="plugin-detail">
              <div class="plugin-detail__header">
                <div class="plugin-detail__meta">
                  <div class="plugin-detail__badges">
                    <fluent-badge :appearance="healthAppearance(selectedItem.plugin.health.state)">
                      {{ selectedItem.plugin.health.state }}
                    </fluent-badge>
                    <fluent-badge appearance="outline">
                      {{ selectedItem.plugin.source }}
                    </fluent-badge>
                  </div>
                  <span v-if="selectedItem.plugin.packageName" class="plugin-detail__pkg">
                    {{ selectedItem.plugin.packageName }}
                  </span>
                  <span v-if="selectedItem.plugin.health.message" class="plugin-detail__message">
                    {{ selectedItem.plugin.health.message }}
                  </span>
                </div>
                <fluent-switch
                  :checked="selectedItem.plugin.enabled"
                  :disabled="toggling[selectedItem.plugin.name]"
                  @change="(e: any) => togglePlugin(selectedItem!.plugin!, e.target.checked)"
                />
              </div>
            </div>
          </template>

          <template v-else>
            <template v-for="item in activeSettings" :key="`${item.id}-${item.title}`">
              <template v-if="item.disabled?.()" />
              <component :is="item.component" v-else-if="item.component" />
              <k-form v-else-if="item.schema" v-model="config" :schema="item.schema" />
            </template>
          </template>
        </div>
      </keep-alive>
    </section>
  </div>
</template>

<style scoped lang="scss">
.settings-panel {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 12px;
  min-height: 0;
  height: 100%;

  &__left,
  &__main {
    background: var(--colorNeutralBackground1);
    border-radius: var(--borderRadiusLarge);
    padding: 12px;
    min-height: 0;
  }

  &__left {
    overflow: hidden;
  }

  &__scroll {
    height: 100%;
    overflow-y: auto;
  }

  &__section-label {
    padding: 8px 12px 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--colorNeutralForeground3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__nav-item {
    padding: 8px 12px;
    border-radius: var(--borderRadiusMedium);
    cursor: pointer;
    color: var(--colorNeutralForeground1);
    user-select: none;

    &:hover {
      background: var(--colorNeutralBackground1Hover);
    }

    &.active {
      background: var(--colorBrandBackground2);
      color: var(--colorBrandForeground1);
      font-weight: 600;
    }
  }

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__saved {
    margin-bottom: 12px;
    color: var(--colorNeutralForeground2);
  }

  &__error {
    margin-bottom: 12px;
    color: var(--colorStatusDangerForeground1);
  }

  &__content {
    min-height: 0;
  }
}

.plugin-detail {
  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--colorNeutralStroke1);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__badges {
    display: flex;
    gap: 6px;
  }

  &__pkg {
    font-size: 12px;
    color: var(--colorNeutralForeground3);
  }

  &__message {
    font-size: 12px;
    color: var(--colorStatusDangerForeground1);
  }
}
</style>
