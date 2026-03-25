<script lang="ts" setup>
import { onMounted, onUnmounted, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Schema } from './utils'
import { IconCollapse, IconEllipsis, IconExpand } from './icons'
import zhCN from './locales/zh-CN.yml'
import enUS from './locales/en-US.yml'

const props = defineProps({
  schema: {} as PropType<Schema>,
  modelValue: {} as PropType<{}>,
  disabled: {} as PropType<boolean>,
  prefix: {} as PropType<string>,
  initial: {} as PropType<{}>,
  extra: {} as PropType<any>,
  collapsible: {} as PropType<{ initial: boolean }>,
})

defineEmits(['update:modelValue'])

const collapsed = ref(props.collapsible?.initial)
const menuOpen = ref(false)
const menuContainer = ref<HTMLElement>()

function onClickOutside(e: MouseEvent) {
  if (menuContainer.value && !menuContainer.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))

const { t, setLocaleMessage } = useI18n({
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
})

if (import.meta.hot) {
  import.meta.hot.accept('./locales/zh-CN.yml', (module) => {
    setLocaleMessage('zh-CN', module.default)
  })
  import.meta.hot.accept('./locales/en-US.yml', (module) => {
    setLocaleMessage('en-US', module.default)
  })
}
</script>

<template>
  <div class="k-schema-item" v-bind="$attrs">
    <div class="actions" />
    <div class="k-schema-main">
      <div class="k-schema-left">
        <h3>
          <slot name="title" />
        </h3>
        <slot name="desc" />
      </div>
      <div class="k-schema-right">
        <template v-if="!collapsed">
          <slot name="prefix" />
          <slot name="control" />
          <slot name="suffix" />
        </template>
        <template v-if="collapsible">
          <fluent-button v-if="collapsed" @click="collapsed = false">
            {{ t('expand') }}
          </fluent-button>
        </template>
      </div>
      <div ref="menuContainer" class="k-schema-menu">
        <fluent-button class="ellipsis" appearance="subtle" icon-only @click.stop="menuOpen = !menuOpen">
          <IconEllipsis />
        </fluent-button>
        <div v-if="menuOpen" class="k-menu k-menu-popup" @click="menuOpen = false">
          <slot name="menu" />
          <template v-if="collapsible">
            <div class="k-menu-separator" />
            <div v-if="collapsed" class="k-menu-item" @click="collapsed = false">
              <span class="k-menu-icon"><IconExpand /></span>
              {{ t('expand') }}
            </div>
            <div v-else class="k-menu-item" @click="collapsed = true">
              <span class="k-menu-icon"><IconCollapse /></span>
              {{ t('collapse') }}
            </div>
          </template>
        </div>
      </div>
    </div>
    <slot />
  </div>

  <slot v-if="!collapsible" name="collapse" />
  <div v-else v-show="!collapsed" class="k-schema-group" :class="{ collapsed }" style="transition: all 0.3s ease;">
    <slot name="collapse" />
  </div>
</template>

<style lang="scss">
.k-schema-item {
  p {
    margin: 0.25rem;
    line-height: 1.7;
    font-size: 0.875rem;
  }

  .markdown p {
    margin: 0;
  }

  ul {
    list-style: none;
    width: 100%;
    padding-left: 1rem;
    font-size: 0.875rem;

    fluent-radio, fluent-checkbox {
      height: 1.375rem;
    }
  }

  fluent-button + fluent-button {
    margin-left: 0;
  }
}

.k-schema-item {
  .k-schema-main {
    display: grid;
    grid-template-columns: 1fr auto 2rem;
    justify-content: space-between;
    align-items: center;
    column-gap: 1rem;
    row-gap: 0.25rem;
    min-height: 3rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.7;
    position: relative;
    user-select: none;
    display: flex;
    align-items: center;

    > * {
      flex: 0 0 auto;
    }

    .prefix {
      font-weight: normal;
      text-overflow: ellipsis;
      flex: 0 1 auto;
      overflow: hidden;
    }
  }

  .k-schema-right {
    display: flex;
    gap: 1rem;
    flex: 1;
    justify-content: flex-end;
  }

  fluent-button.ellipsis {
    padding: 8px 9px;

    .k-icon {
      width: 12px;
    }
  }

  .k-schema-menu {
    position: relative;
  }

  .k-menu-popup {
    position: absolute;
    right: 0;
    top: 100%;
    z-index: 1000;
  }

  .bottom {
    margin: 0.5rem 0 0.25rem;
  }

  $actions-width: 0.5rem;

  .actions {
    position: absolute;
    top: 0;
    height: 100%;
    left: 0;
    width: $actions-width;
    border-left: 2px solid transparent;
    transition: var(--color-transition);
  }

  &.changed .actions {
    border-left-color: var(--colorBrandBackground);
  }

  &.required .actions {
    border-left-color: var(--colorPaletteRedBackground3);
  }

  &.invalid .actions {
    border-left-color: var(--colorPaletteYellowBackground3);
  }
}
</style>
