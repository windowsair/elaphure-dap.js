<script setup>
import navbar from './components/navbar.vue'
import content from './components/content.vue'

</script>

<template>
  <header>
    <navbar class="navbar"/>
  </header>
  <content class="content" />
</template>

<script>
</script>

<style>
.navbar {
  height: 55px;
}

.content {
  height: calc(100vh - 55px);
}

.content .el-tabs__header {
  min-height: 40px;
}

.content .el-tabs__content {
  height: calc(100vh - 95px);
}

.content .el-tab-pane {
  height: 100%;
}

.content .el-tabs--border-card {
  border: none;
}
</style>
