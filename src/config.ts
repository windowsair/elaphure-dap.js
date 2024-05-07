import { computed, ref } from 'vue'
import { type DefaultTheme } from './components/composables/theme'
import { useDark, useToggle } from "@vueuse/core"

const siteInfo = {
  lang: 'en-US',
  description: 'elaphure.dapjs',
  appearance: true,
  themeConfig: {
    nav: nav(),
    socialLinks: [
      { icon: 'github', link: 'https://github.com/windowsair/elaphure-dap.js' }
    ],
    siteTitle: 'elaphure.dapjs',
  }
}

const appearance = 'dark'; // fine with reactivity being lost here, config change triggers a restart
const isDark =
  appearance === 'force-dark'
    ? ref(true)
    : appearance
      ? useDark({
        storageKey: 'vitepress-theme-appearance',
        initialValue: () =>
          typeof appearance === 'string' ? appearance : 'auto',
        ...(typeof appearance === 'object' ? appearance : {})
      })
      : ref(false)

export const siteData = {
  site: computed(() => siteInfo),
  theme: computed(() => siteInfo.themeConfig),
  isDark: isDark,
}

function nav(): DefaultTheme.NavItem[] {
  return [
  ]
}