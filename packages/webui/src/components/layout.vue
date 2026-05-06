<script setup lang="ts">
import { computed, ref } from 'vue'
import { useContext } from '../context'
import type { Activity } from '../plugins/router'

const ctx = useContext()
function byOrder(a: Activity, b: Activity) {
  return (a.options?.order ?? 0) - (b.options?.order ?? 0)
}
const topPages = computed(() =>
  Object.values(ctx.client.router.pages)
    .filter(p => p.options?.position === 'top')
    .sort(byOrder),
)
const bottomPages = computed(() =>
  Object.values(ctx.client.router.pages)
    .filter(p => p.options?.position === 'bottom')
    .sort(byOrder),
)
const current = ref('/')
ctx.client.router.router.afterEach((to) => {
  current.value = to.path
})
</script>

<template>
  <satori-system-bar />
  <div class="satori-container">
    <nav class="satori-nav">
      <router-link v-for="page in topPages" :key="`link-${page.name}`" class="satori-nav-item" :to="page.path" ondragstart="return false">
        <satori-icons v-if="page.icon" :name="page.icon" :filled="page.path === current" />
        <span>{{ page.name }}</span>
      </router-link>
      <satori-spacer />
      <router-link v-for="page in bottomPages" :key="`link-${page.name}`" class="satori-nav-item" :to="page.path" ondragstart="return false">
        <satori-icons v-if="page.icon" :name="page.icon" :filled="page.path === current" />
        <span>{{ page.name }}</span>
      </router-link>
    </nav>
    <main class="satori-main">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>
  </div>
  <div class="satori-background">
    <div class="satori-background__image" />
    <div class="satori-background__mask" />
  </div>
</template>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  color: var(--colorNeutralForeground1);
}
.satori-container {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  height: calc(100vh - 44px);
  width: 100%;
  overflow: hidden;
  z-index: 5;
}
.satori-nav {
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-wrap: nowrap;
  flex-direction: column;
  width: 64px;
  margin: 0 10px 10px;
  gap: 5px;
  .router-link-active {
    background-color: var(--colorNeutralBackground1);
    &::before {
      opacity: 1;
      width: 4px;
    }
    span {
      opacity: 0;
      color: var(--colorNeutralForeground2BrandSelected);
      position: absolute;
      bottom: 0;
    }
    svg {
      fill: var(--colorNeutralForeground2BrandSelected);
    }
  }
}
.satori-nav-item {
  display: flex;
  flex-wrap: nowrap;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  gap: 4px;
  width: 64px;
  height: 64px;
  border-radius: var(--borderRadiusMedium);
  color: var(--colorNeutralForeground1);
  font-size: var(--fontSizeBase300);
  font-weight: var(--fontWeightRegular);
  letter-spacing: -0.2px;
  line-height: 20.27px;
  text-decoration: none;
  overflow: hidden;
  transition: all 0.16s var(--curveEasyEase);
  * {
    transition: all 0.16s var(--curveEasyEase);
  }
  span {
    color: var(--colorNeutralForeground1);
    font-size: var(--fontSizeBase200);
    font-weight: var(--fontWeightRegular);
    height: auto;
  }
  div {
    transform: translateY(0);
  }
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    height: 1.5rem;
    width: 0px;
    border-radius: 0 4px 4px 0;
    background: var(--colorNeutralForeground2BrandSelected);
    transform: translateY(-50%) translateX(0);
    transition: all 0.16s var(--curveEasyEase);
    opacity: 0;
  }
  &:hover {
    background-color: var(--colorNeutralBackground1);
    box-shadow: var(--shadow1);
    span {
      color: var(--colorNeutralForeground2BrandSelected);
    }
    svg {
      fill: var(--colorNeutralForeground2BrandSelected);
    }
  }
}
.satori-main {
  flex: 1;
  overflow: hidden;
  padding: 0 10px 10px 0;
  display: flex;
  flex-wrap: nowrap;
  flex-direction: row;
  gap: 5px;
}
.satori-icon svg {
  fill: var(--colorNeutralForeground1);
}
.satori-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;

  &__mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--colorBrandStroke1);
    opacity: 0.12;
    backdrop-filter: blur(5px);
  }

  &__image {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
