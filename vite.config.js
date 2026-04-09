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
    }
  },
  server: {
    allowedHosts: true,

    // 給google行事曆串接用
    // 👇 把這裡換成這兩行終極解藥 👇
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
    // 👆 替換結束 👆


    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
        // 注意：這裡絕對不能有 rewrite，因為您的後端需要 /api
      }
    }
  },
  optimizeDeps: {
    include: ['vue3-google-signin'],
    needsInterop: ['vue3-google-signin']
  }
})