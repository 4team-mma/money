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


server: {
    allowedHosts: true,
    // ▼▼▼ 新增這段代理設定 ▼▼▼
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // 假設您的 FastAPI 跑在 8000 port
        changeOrigin: true,
        //rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    // ▲▲▲ 新增這段代理設定 ▲▲▲

  optimizeDeps: {
    include: ['vue3-google-signin'],
    // 🌟 強制 Vite 處理 CommonJS/ESM 轉換，這能解決 useGoogleLogin 找不到的問題
    needsInterop: ['vue3-google-signin']
  }
})