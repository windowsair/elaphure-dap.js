import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import './icons.css'
import './vitepress.css'
import 'animate.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { siteData } from './config'
import { dataSymbol } from './components/composables/data'
import { i18n, LoadCurrentLang } from './i18n'
import App from './App.vue'

const app = createApp(App)
app.provide(dataSymbol, siteData)

await LoadCurrentLang(i18n)

app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
