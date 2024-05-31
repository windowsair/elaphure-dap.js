import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import DynamicPublicDirectory from 'vite-multiple-assets'
import arraybuffer from 'vite-plugin-arraybuffer'

const dirAssets = ['src/device/deviceList']

export default defineConfig({
  resolve: {
    alias: [
      { find: '@assets', replacement: fileURLToPath(new URL('./src/assets', import.meta.url)) }
    ]
  },
  assetsInclude: ['src/device/deviceList/**'],
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    }),
    svgLoader(),
    wasm(),
    topLevelAwait(),
    DynamicPublicDirectory(dirAssets),
    arraybuffer()
  ],
  optimizeDeps: {
    exclude: [
      'llvm-objcopy-wasm'
    ]
  }
})
