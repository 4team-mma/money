<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'

const sidebarOpen = ref(false)
const router = useRouter()

// === 1. 使用者資訊狀態 ===
const userData = ref({
  name: '用戶',
  email: '',
  avatar: 'U',
  role: 'user' // 預設身分
})

// === 2. 跑馬燈通知數據 ===
const notifications = ref([
  '📢 系統提醒：本月預算已達 76%，請注意支出控管，避免超支。',
  '💡 理財小撇步：採用 50/30/20 法則分配薪資，能讓您的儲蓄目標更早達成。',
  '🎯 目標進度：您的「日本旅遊基金」達成率已過半，繼續加油！',
  '🚀 Money MMA 提示：點擊「記一筆」快速紀錄今日開銷，養成好習慣。'
]);

// 串聯通知內容，中間加上間隔符號，用於無縫循環
const marqueeText = computed(() => notifications.value.join('　　 | 　　'));

// === 3. 主選單配置 ===
const navigation = [
  { name: '行事曆', to: '/Book', icon: '🗓' },
  { name: '儀表板', to: '/dashboard', icon: '📊' },
  { name: '帳戶管理', to: '/Account', icon: '⛺' },
  { name: '理財規劃', to: '/BudgetManager', icon: '🐱' },
  { name: '記一筆', to: '/Add', icon: '➕' },
  { name: '圖表分析', to: '/Chart', icon: '📈' },
  { name: '消費趨勢', to: '/ConsumerAnalysis', icon: '⛽' },
  { name: '薪資趨勢', to: '/SalaryAnalysis', icon: '💵' },
  { name: '成就系統', to: '/Achievements', icon: '🏆' },
  { name: '問題回饋', to: '/Feedback', icon: '❓' },
  { name: '設定', to: '/Settings', icon: '⚙️' }
]

// === 4. 功能函式 ===
const loadUserData = () => {
  try {
    const userJson = localStorage.getItem('currentUser')
    if (userJson) {
      const user = JSON.parse(userJson)
      userData.value = {
        name: user.name || '用戶',
        email: user.email || '',
        role: user.role || 'user',
        // 產生頭像文字：優先抓名字前兩碼
        avatar: (user.name || user.email || 'U').substring(0, 2).toUpperCase()
      }
    } else {
      router.push('/')
    }
  } catch (e) {
    console.error('解析使用者資料失敗', e)
    router.push('/')
  }
}

const logout = () => {
  if (confirm('確定要登出系統嗎？')) {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('user_token') // 同步清除 token
    router.push('/')
  }
}

// 確保組件掛載後執行
onMounted(() => {
  loadUserData()
})
</script>
<template>
  <div class="dashboard-layout">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />

    <aside :class="['sidebar', { 'sidebar-open': sidebarOpen }]">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <RouterLink to="/dashboard" class="logo">
            <div class="logo-icon">
              <img src="../assets/logo.svg" alt="logo" width="72" height="72">
            </div>
            <span class="logo-text">Money MMA</span>
          </RouterLink>
          <button class="close-button" @click="sidebarOpen = false">✕</button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" class="nav-item"
              active-class="nav-item-active" exact-active-class="nav-item-active" @click="sidebarOpen = false">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
              <span class="nav-indicator">›</span>
            </RouterLink>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">{{ userData.avatar }}</div>
            <div class="user-details">
              <div class="user-name">{{ userData.name }}</div>
              <div class="user-email">{{ userData.email }}</div>
            </div>
          </div>
          <button class="logout-button" @click="logout">
            ⏏️ 登出系統
          </button>
        </div>
      </div>
    </aside>

    <div class="main-content">
      <header class="top-bar">
        <button class="menu-button" @click="sidebarOpen = true">☰</button>

        <div class="news-ticker-container">
          <div class="ticker-label">重要通知</div>
          <div class="ticker-wrapper">
            <div class="ticker-content">
              {{ marqueeText }} 　　 | 　　 {{ marqueeText }}
            </div>
          </div>
        </div>

      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>
<style scoped>
/* 基本佈局 */
.dashboard-layout {
  min-height: 100vh;
  background: #f8fafc;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

@media (min-width: 1024px) {
  .sidebar-backdrop {
    display: none;
  }
}

/* 側邊欄樣式 */
.sidebar {
  position: fixed;
  inset-y: 0;
  left: 0;
  z-index: 50;
  width: 288px;
  background: white;
  border-right: 2px solid #e2e8f0;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100vh;
  overflow: hidden;
}

.sidebar-open {
  transform: translateX(0);
}

@media (min-width: 1024px) {
  .sidebar {
    transform: translateX(0);
  }
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 2px solid #e2e8f0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  background: #fff;
  padding: 0.5rem;
  border-radius: 8px;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748b;
}

@media (min-width: 1024px) {
  .close-button {
    display: none;
  }
}

/* 導覽選單 */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  text-decoration: none;
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.nav-item-active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.nav-indicator {
  opacity: 0;
  margin-left: auto;
}

.nav-item-active .nav-indicator {
  opacity: 1;
}

/* 側邊欄底部 */
.sidebar-footer {
  padding: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
}

.logout-button {
  width: 100%;
  padding: 0.6rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: 0.2s;
}

.logout-button:hover {
  background: #fff5f5;
  border-color: #feb2b2;
  color: #c53030;
}

/* 主內容與頂部橫條 */
.main-content {
  margin-left: 0;
  transition: margin-left 0.3s;
}

@media (min-width: 1024px) {
  .main-content {
    margin-left: 288px;
  }
}

.top-bar {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 64px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 1.5rem;
}

.menu-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

@media (min-width: 1024px) {
  .menu-button {
    display: none;
  }
}

.spacer {
  flex: 1;
}

.page-content {
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .page-content {
    padding: 2rem;
  }
}

/* --- 跑馬燈專屬樣式 --- */
.news-ticker-container {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f1f5f9;
  border-radius: 50px;
  height: 38px;
  margin: 0 1.5rem;
  padding: 0 4px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.ticker-label {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 2px 0 8px rgba(59, 130, 246, 0.2);
}

.ticker-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.ticker-content {
  display: inline-block;
  white-space: nowrap;
  padding-left: 20px;
  font-size: 0.875rem;
  color: #475569;
  font-weight: 500;
  animation: marquee 40s linear infinite;
  /* 可調整時間控制速度 */
}

.ticker-content:hover {
  animation-play-state: paused;
  cursor: pointer;
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .news-ticker-container {
    margin: 0 0.5rem;
    height: 32px;
  }

  .ticker-label {
    padding: 2px 10px;
    font-size: 0.7rem;
  }
}
</style>