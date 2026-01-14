<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
const sidebarOpen = ref(false)
const router = useRouter()

// === 使用者資訊狀態 ===
const userData = ref({
    name: '用戶',
    email: '',
    avatar: 'U'
})

// === 載入當前登入者資訊 ===
const loadUserData = () => {
    try {
        const userJson = localStorage.getItem('currentUser')
        if (userJson) {
            const user = JSON.parse(userJson)
            userData.value = {
                name: user.name || '用戶',
                email: user.email || '',
                // 產生頭像文字：優先抓名字前兩碼，沒有就抓 Email 前兩碼
                avatar: (user.name || user.email || 'U').substring(0, 2).toUpperCase()
            }
        } else {
            // 如果沒抓到登入資訊，導回登入頁面
            router.push('/')
        }
    } catch (e) {
        console.error('解析使用者資料失敗', e)
        router.push('/')
    }
}

// 確保組件掛載後執行讀取
onMounted(() => {
    loadUserData()
})

// 登出邏輯
const logout = () => {
    if (confirm('確定要登出系統嗎？')) {
        localStorage.removeItem('currentUser')
        router.push('/')
    }
}

// 主選單
const navigation = [
  { name: '行事曆', to: '/Book', icon: '🗓' },
  { name: '儀表板', to: '/dashboard', icon: '📊' },
  { name: '帳戶管理', to: '/Account', icon: '⛺' },
  { name: '記一筆', to: '/Add', icon: '➕' },
  { name: '圖表分析', to: '/Chart', icon: '📈' },
  { name: '消費趨勢', to: '/ConsumerAnalysis', icon: '⛽' },
  { name: '成就系統', to: '/Achievements', icon: '🏆' },
  { name: '問題回饋', to: '/Feedback', icon: '❓' },
  { name: '設定', to: '/Settings', icon: '⚙️' }
  
]


</script>

<template>
  <div class="dashboard-layout">
    <!-- 手機遮罩 -->
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside :class="['sidebar', { 'sidebar-open': sidebarOpen }]">
      <div class="sidebar-content">
        <!-- Header -->
        <div class="sidebar-header">
          <RouterLink to="/dashboard" class="logo">
            <div class="logo-icon"> <img src="../assets/logo.svg" alt="logo" width="48" height="48"></div>
            <span class="logo-text">Money MMA</span>
          </RouterLink>
          <button class="close-button" @click="sidebarOpen = false">✕</button>
        </div>

        <!-- Nav -->
        <nav class="sidebar-nav">
          <div class="nav-section">
            <RouterLink
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              class="nav-item"
              active-class="nav-item-active"
              exact-active-class="nav-item-active"
              @click="sidebarOpen = false"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
              <span class="nav-indicator">›</span>
            </RouterLink>
          </div>

        </nav>

        <!-- Footer -->
<div class="sidebar-footer">
  <div class="user-info">
    <div class="user-avatar">{{ userData.avatar }}</div>
    <div class="user-details">
      <div class="user-name">{{ userData.name }}</div>
      <div class="user-email">{{ userData.email }}</div>
    </div>
  </div>

  <button class="logout-button" @click="logout">
    ⏏️ 登出
  </button>
</div>
      </div>
    </aside>

    <!-- Main -->
    <div class="main-content">
      <header class="top-bar">
        <button class="menu-button" @click="sidebarOpen = true">☰</button>
        <div class="spacer" />
      </header>

      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
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

@media (min-width: 800px) {
  .sidebar-backdrop {
    display: none;
  }
}

.sidebar {
  position: fixed;
  inset-y: 0;
  left: 0;
  z-index: 50;
  width: 288px;
  background: white;
  border-right: 2px solid #e2e8f0;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
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
  background: linear-gradient(135deg, #c4e1f1, #7db0f3);
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 1.5rem;
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

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 1rem;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.admin-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #e2e8f0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.75rem 1rem;
  border-radius: 8px;
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
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-text {
  flex: 1;
}

.nav-indicator {
  opacity: 0;
  transition: opacity 0.2s;
}

.nav-item-active .nav-indicator {
  opacity: 1;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 2px solid #e2e8f0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.user-email {
  font-size: 0.75rem;
  color: #64748b;
}

.logout-button {
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
}

.logout-button:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.main-content {
  margin-left: 0;
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 1rem;
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
  padding: 1rem;
}

@media (min-width: 768px) {
  .page-content {
    padding: 2rem;
  }
}
</style>