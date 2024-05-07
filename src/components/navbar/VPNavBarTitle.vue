<script setup lang="ts">
import { computed } from 'vue'
import { useData } from '../composables/data'
//import { useSidebar } from '../composables/sidebar'
import VPImage from './VPImage.vue'

const { site, theme } = useData()
//const { hasSidebar } = useSidebar()

</script>

<template>
  <!-- :class="{ 'has-sidebar': hasSidebar }" -->
  <div class="VPNavBarTitle">
    <a
      class="title"
    >
      <slot name="nav-bar-title-before" />
      <VPImage v-if="theme.logo" class="logo" :image="theme.logo" />
      <template v-if="theme.siteTitle"><span>{{ theme.siteTitle }}</span></template>
      <template v-else-if="theme.siteTitle === undefined"><span>{{ site.title }}</span></template>
      <slot name="nav-bar-title-after" />
    </a>
  </div>
</template>

<style scoped>
.title {
  display: flex;
  align-items: center;
  border-bottom: 1px solid transparent;
  width: 100%;
  height: var(--vp-nav-height);
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: opacity 0.25s;
}

@media (min-width: 960px) {
  .title {
    flex-shrink: 0;
  }

  .VPNavBarTitle.has-sidebar .title {
    border-bottom-color: var(--vp-c-divider);
  }
}

:deep(.logo) {
  margin-right: 8px;
  height: var(--vp-nav-logo-height);
}
</style>
