<script setup lang="ts">
import type { AppNamespaceState, PluginEntry } from '@satoriapp/state'
import { isConfigurableNetworkAdapter, NETWORK_ADAPTER_MANIFESTS } from '@satoriapp/adapter'
import { useContext } from '@satoriapp/webui'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

interface NavGroup {
  label: string
  items: NavItem[]
}

interface NavItem {
  id: string
  label: string
  type: 'setting' | 'plugin' | 'adapter'
  packageName?: string
}

const ctx = useContext()
const route = useRoute()
const router = useRouter()

const settingItems = computed<NavItem[]>(() =>
  Object.entries(ctx.client.setting.entries).map(([id, list]) => ({
    id,
    label: list[0]?.title || id,
    type: 'setting',
  })),
)

const adapterItems = computed<NavItem[]>(() =>
  Object.keys(ctx.stater.data.app.network?.adapters ?? {}).map(packageName => ({
    id: `adapter:${packageName}`,
    label: NETWORK_ADAPTER_MANIFESTS.find(m => m.packageName === packageName)?.displayName ?? packageName,
    type: 'adapter',
    packageName,
  })),
)

const pluginItems = computed<NavItem[]>(() =>
  Object.keys(ctx.stater.data.app.plugins ?? {}).map(name => ({
    id: `plugin:${name}`,
    label: name,
    type: 'plugin',
    packageName: name,
  })),
)

const groups = computed<NavGroup[]>(() => {
  const out: NavGroup[] = []
  if (settingItems.value.length)
    out.push({ label: '设置', items: settingItems.value })
  if (adapterItems.value.length)
    out.push({ label: '适配器', items: adapterItems.value })
  if (pluginItems.value.length)
    out.push({ label: '插件', items: pluginItems.value })
  return out
})

const allItems = computed<NavItem[]>(() => groups.value.flatMap(g => g.items))

const path = computed({
  get() {
    const section = route.params.section?.toString()
    if (section && allItems.value.some(item => item.id === section))
      return section
    return allItems.value[0]?.id ?? ''
  },
  set(value: string) {
    router.replace(`/settings/${value}`)
  },
})

const selectedItem = computed<NavItem | undefined>(() => allItems.value.find(item => item.id === path.value))

const activeSettingEntries = computed(() => {
  const key = path.value
  return key ? (ctx.client.setting.entries[key] ?? []) : []
})

const appModel = computed<AppNamespaceState>({
  get() { return ctx.stater.data.app },
  set(value) {
    ctx.stater.mutate((d) => {
      Object.assign(d.app, value)
    })
  },
})

function adapterEntry(packageName: string) {
  return ctx.stater.data.app.network?.adapters?.[packageName] ?? { enabled: false, config: {} }
}

function pluginEntry(name: string): PluginEntry {
  return ctx.stater.data.app.plugins?.[name] ?? { enabled: false, source: 'external', config: {} }
}

function manifestOf(packageName: string) {
  return NETWORK_ADAPTER_MANIFESTS.find(m => m.packageName === packageName)
}

function setAdapterConfig(packageName: string, config: Record<string, any>) {
  ctx.stater.mutate((d) => {
    d.app.network ??= { adapters: {} }
    d.app.network.adapters[packageName] = {
      ...adapterEntry(packageName),
      config,
    }
  })
}

function togglePlugin(name: string, enabled: boolean) {
  ctx.stater.mutate((d) => {
    d.app.plugins ??= {}
    d.app.plugins[name] = { ...pluginEntry(name), enabled }
  })
}
</script>

<template>
  <satori-view title="Settings" style="width: 260px; flex-shrink: 0;">
    <nav class="settings-page__nav">
      <template v-for="group in groups" :key="group.label">
        <div class="settings-page__group-label">
          {{ group.label }}
        </div>
        <button
          v-for="item in group.items"
          :key="item.id"
          type="button"
          class="settings-page__nav-item"
          :class="{ 'is-active': path === item.id }"
          @click="path = item.id"
        >
          <span class="settings-page__nav-label">{{ item.label }}</span>
        </button>
      </template>
    </nav>
  </satori-view>

  <satori-view :title="selectedItem?.label || ''">
    <div class="settings-page__content">
      <template v-if="selectedItem?.type === 'setting'">
        <article
          v-for="(item, index) in activeSettingEntries"
          :key="`${item.id}-${index}`"
          class="settings-card"
        >
          <template v-if="item.disabled?.()" />
          <component :is="item.component" v-else-if="item.component" />
          <k-form
            v-else-if="item.schema"
            v-model="appModel"
            :schema="item.schema"
          />
        </article>
      </template>

      <template v-else-if="selectedItem?.type === 'adapter' && selectedItem.packageName">
        <article class="settings-card">
          <p v-if="!isConfigurableNetworkAdapter(selectedItem.packageName)" class="settings-page__hint">
            该适配器无配置项。
          </p>
          <k-form
            v-else
            :model-value="adapterEntry(selectedItem.packageName).config"
            :schema="manifestOf(selectedItem.packageName)!.configSchema"
            @update:model-value="(v) => setAdapterConfig(selectedItem!.packageName!, v)"
          />
        </article>
      </template>

      <template v-else-if="selectedItem?.type === 'plugin' && selectedItem.packageName">
        <article class="settings-card">
          <div class="settings-card__row">
            <div class="settings-card__row-text">
              <span class="settings-card__row-label">启用插件</span>
              <span class="settings-card__row-caption">{{ selectedItem.packageName }}</span>
            </div>
            <fluent-switch
              :checked="pluginEntry(selectedItem.packageName).enabled"
              @change="(e: any) => togglePlugin(selectedItem!.packageName!, e.target.checked)"
            />
          </div>
        </article>
      </template>
    </div>
  </satori-view>
</template>

<style scoped lang="scss">
.settings-page__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-page__group-label {
  padding: 12px 4px 4px;
  font-size: var(--fontSizeBase200);
  font-weight: var(--fontWeightSemibold);
  color: var(--colorNeutralForeground3);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.settings-page__nav-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  border-radius: var(--borderRadiusMedium);
  background: transparent;
  border: none;
  color: var(--colorNeutralForeground1);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color var(--durationFaster) var(--curveEasyEase);

  &:hover {
    background: var(--colorNeutralBackground1Hover);
  }

  &:focus-visible {
    outline: 2px solid var(--colorStrokeFocus2);
    outline-offset: -2px;
  }

  &.is-active {
    background: var(--colorNeutralBackground1Selected);
    color: var(--colorNeutralForeground1);
    font-weight: var(--fontWeightSemibold);
  }
}

.settings-page__nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-page__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-page__hint {
  margin: 0;
  color: var(--colorNeutralForeground3);
}

.settings-card {
  background: var(--colorNeutralBackground1);
  border: 1px solid var(--colorNeutralStroke2);
  border-radius: var(--borderRadiusLarge);
  padding: 20px 24px;
  box-shadow: var(--shadow2);
}

.settings-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.settings-card__row-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.settings-card__row-label {
  font-size: var(--fontSizeBase300);
  font-weight: var(--fontWeightSemibold);
  color: var(--colorNeutralForeground1);
}

.settings-card__row-caption {
  font-size: var(--fontSizeBase200);
  color: var(--colorNeutralForeground3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
