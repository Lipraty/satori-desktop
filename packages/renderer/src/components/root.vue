<template>
  <satori-system-bar />
  <div class="satori-container">
    <nav class="satori-nav">
      <router-link class="satori-nav-item" v-for="page in topPages" :to="page.path" ::key="`link-${page.name}`">
        <satori-icons v-if="page.icon" :name="page.icon" />
        <span>{{ page.name }}</span>
      </router-link>
      <satori-spacer />
      <router-link class="satori-nav-item" v-for="page in bottomPages" :to="page.path" ::key="`link-${page.name}`">
        <satori-icons v-if="page.icon" :name="page.icon" />
        <span>{{ page.name }}</span>
      </router-link>
    </nav>
    <main class="satori-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useContext } from '@satoriapp/renderer'

const ctx = useContext()
const topPages = Object.values(ctx.$router.pages).filter(pager => pager['options'] && pager['options'].position === 'top')
const bottomPages = Object.values(ctx.$router.pages).filter(pager => pager['options'] && pager['options'].position === 'bottom')
</script>

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
}
.satori-nav {
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-wrap: nowrap;
  flex-direction: column;
  width: 64px;
  margin: 0 10px 10px;
  .router-link-active {
    background-color: var(--colorNeutralBackground1);
    span {
      color: var(--colorNeutralForeground2BrandSelected);
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
  span {
    color: var(--colorNeutralForeground1);
    font-size: var(--fontSizeBase200);
    font-weight: var(--fontWeightRegular);
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
</style>