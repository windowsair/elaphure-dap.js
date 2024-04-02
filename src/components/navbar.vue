<template>
  <div>
    <el-container>
      <el-header class="w-full border-b border-b-slate-300 dark:border-b-slate-0 dark:bg-slate-800" height="55px">
        <div class="flex justify-between items-center">
          <div class="text-lg font-medium m-3 items-center dark:text-slate-200">elaphure-dap.js</div>
          <div>
            <el-row class="items-center">
              <el-switch class="m-3" style="
                  --el-switch-on-color: #73767a;
                  --el-switch-off-color: #dedfe0;
                " v-model="isDarkMode" @change="onDarkModeChange" :active-action-icon="Moon"
                :inactive-action-icon="Sunny" />
              <el-dropdown @command="changeLanguage">
                <div class="m-3 outline-unset">
                  <translateIcon class="fill-current" color="var(--el-text-color-regular)" />
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="en-US">English</el-dropdown-item>
                    <el-dropdown-item command="zh-CN">简体中文</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-row class="m-3">
                <a href="https://github.com/windowsair/elaphure-dap.js" target="_blank">
                  <span class="sr-only">elaphure-dap.js on github</span>
                  <githubIcon class="fill-current" color="var(--el-text-color-regular)" />
                </a>
                <div>

                </div>
              </el-row>
            </el-row>
          </div>
        </div>
      </el-header>
    </el-container>
  </div>
</template>

<style scoped></style>

<script setup>
import { Sunny, Moon } from "@element-plus/icons-vue"
import { loadLocaleMessages, setI18nLanguage, i18n } from '../i18n'
import { useDark, useToggle } from "@vueuse/core"
import translateIcon from "@assets/translate.svg?component"
import githubIcon from "@assets/github.svg?component"

const isDarkMode = useDark({
  storageKey: "globalDarkMode",
  valueDark: "dark",
  valueLight: "light",
})

const onDarkModeChange = useToggle(isDarkMode)

const changeLanguage = (lang) => {
  debugger
  loadLocaleMessages(i18n, lang)
  setI18nLanguage(i18n, lang)
}

</script>
