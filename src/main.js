import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './style.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { i18n } from './i18n'
import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus)
app.use(i18n)
app.mount('#app')
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
