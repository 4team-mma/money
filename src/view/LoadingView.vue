<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

// 引入所有 Pinia Stores
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useAccountStore } from '@/stores/useAccountStore'
import { useRecordStore } from '@/stores/useRecordStore'
import { useAiAdminStore } from '@/stores/useAiAdminStore'
import { useCategoryStore as useCategoryStatsStore } from '@/stores/categoryStats'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const statusMessage = ref('驗證身份中...')
const progress = ref(0)

onMounted(async () => {
  try {
    // 1. 取得登入資訊
    const token = localStorage.getItem('user_token')
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

    if (!token || !currentUser.email) {
      statusMessage.value = '登入已過期，請重新登入'
      setTimeout(() => router.push('/'), 1500)
      return
    }

    // 確保 Axios Header 已同步
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    // 實例化所有 Store
    const userStore = useUserStore()
    const categoryStore = useCategoryStore()
    const accountStore = useAccountStore()
    const recordStore = useRecordStore()
    const aiStore = useAiAdminStore()
    const statsStore = useCategoryStatsStore()
    const noticeStore = useNotificationStore()

    const isAdmin = currentUser.role === 'admin'

    // 2. 執行基礎資料載入 (所有人)
    progress.value = 20
    statusMessage.value = '載入個人帳戶與通知...'
    
    // 使用 Promise.all 平行載入，加速啟動
    await Promise.all([
      userStore.loadUsers(),          // 內含角色判斷邏輯
      categoryStore.initializeStore(), // 基礎分類 (Persist)
      accountStore.loadAccounts(),    // 帳戶清單與餘額
      recordStore.fetchAllRecords(),   // 收支紀錄
      noticeStore.fetchAll() // 提醒
    ])

    // 3. 執行特定資料載入 (僅限管理員)
    if (isAdmin) {
      progress.value = 60
      statusMessage.value = '正在分析管理員數據圖表...'
      
      await Promise.all([
        aiStore.initAllAiConfigs(),    // AI 機器人設定
        statsStore.fetchAllRankings()  // 管理員排行榜 (Stats)
      ])
    }

    // 4. 完成準備
    progress.value = 100
    statusMessage.value = '初始化完成！即將進入系統'

    // 延遲跳轉提供更好的視覺反饋
    setTimeout(() => {
      if (isAdmin) {
        router.push('/admins')
      } else {
        router.push('/book')
      }
    }, 800)

  } catch (error) {
    console.error('🍍 初始化流程中斷:', error)
    statusMessage.value = '連線異常，正在嘗試進入系統...'
    // 若非致命錯誤，仍嘗試跳轉
    setTimeout(() => router.push('/book'), 2000)
  }
})
</script>

<template>
  <div class="loading-wrapper">
    <div class="loader-content">
      <!-- 錢幣旋轉動畫 -->
      <div class="coin-container">
        <div class="coin">💰</div>
      </div>
      
      <h1 class="brand-name">Money MMA</h1>
      
      <div class="status-container">
        <p class="status-message">{{ statusMessage }}</p>
        <div class="progress-track">
          <div class="progress-bar" :style="{ width: progress + '%' }"></div>
        </div>
      </div>

      <div class="loading-footer">系統初始化中...</div>
    </div>
  </div>
</template>

<style scoped>
.loading-wrapper {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #121212; /* 深色背景 */
  z-index: 9999;
}

.loader-content {
  text-align: center;
  width: 320px;
}

.coin-container {
  perspective: 1000px;
  margin-bottom: 25px;
}

.coin {
  width: 80px;
  height: 80px;
  font-size: 50px;
  background: #ffd700;
  border: 5px solid #f39c12;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
  animation: flip-coin 2s infinite linear;
}

.brand-name {
  color: #3ff9dc; /* Money MMA 主色 */
  font-size: 2rem;
  letter-spacing: 3px;
  margin: 0 0 30px 0;
  text-transform: uppercase;
}

.status-container {
  margin-bottom: 20px;
}

.status-message {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 12px;
  height: 1.2rem;
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3ff9dc, #00d2ff);
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(63, 249, 220, 0.5);
}

.loading-footer {
  color: #444;
  font-size: 0.75rem;
  margin-top: 40px;
}

@keyframes flip-coin {
  0% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}
</style>