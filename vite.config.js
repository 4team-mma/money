import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },


  // ▼▼▼ 請加入下面這一段 ▼▼▼
  server: {
    allowedHosts: true
  },
  // ▲▲▲ 加入上面這一段 ▲▲▲

  optimizeDeps: {
    include: ['vue3-google-signin'],
    // 🌟 強制 Vite 處理 CommonJS/ESM 轉換，這能解決 useGoogleLogin 找不到的問題
    needsInterop: ['vue3-google-signin']
  }
})