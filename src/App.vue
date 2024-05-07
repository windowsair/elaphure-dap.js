<script setup>
import content from './components/content.vue'
import VPNav from './components/navbar/VPNav.vue'

</script>

<template>
  <div class="layout">
    <VPNav class="navbar">
      <template #nav-bar-title-before><slot name="nav-bar-title-before" /></template>
      <template #nav-bar-title-after><slot name="nav-bar-title-after" /></template>
      <template #nav-bar-content-before><slot name="nav-bar-content-before" /></template>
      <template #nav-bar-content-after><slot name="nav-bar-content-after" /></template>
      <template #nav-screen-content-before><slot name="nav-screen-content-before" /></template>
      <template #nav-screen-content-after><slot name="nav-screen-content-after" /></template>
    </VPNav>
  <content class="content" />
  </div>
</template>

<script>
</script>

<style>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
