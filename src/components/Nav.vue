<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import { onUnmounted } from 'vue'

const sidebarOpen = ref(false)
const router = useRouter()

/* ========================
    Theme System [cite: 6-9]
   ======================== */
const themes = {
    mma_light: { name: 'MMA 經典', primary: '#3b82f6', bgGradient: 'linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%)', cardBg: 'rgba(255, 255, 255, 0.85)', sidebarBg: 'rgba(255, 255, 255, 0.7)', text: '#1e293b', border: 'rgba(255, 255, 255, 0.5)' },
    dark: { name: '極客深邃', primary: '#60a5fa', bgGradient: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)', cardBg: 'rgba(31, 41, 55, 0.9)', sidebarBg: 'rgba(17, 24, 39, 0.95)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' },
    forest: { name: '森林晨曦', primary: '#10b981', bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)', text: '#064e3b', border: 'rgba(16, 185, 129, 0.2)' },
    sunset: { name: '微醺夕陽', primary: '#f59e0b', bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)', text: '#78350f', border: 'rgba(245, 158, 11, 0.2)' }
}
const currentTheme = ref(localStorage.getItem('adminTheme') || 'mma_light')
const currentStyle = computed(() => themes[currentTheme.value] || themes.mma_light)


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
    { name: '成就測試', to: '/Achievements_new', icon: '🏆' },
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
// 在 Nav 檔的 onMounted 中加入監聽
onMounted(() => {
  loadUserData()

  // 監聽來自 Setting 檔的主題變更事件
  window.addEventListener('theme-changed', () => {
    const newThemeId = localStorage.getItem('adminTheme')
    if (newThemeId && themes[newThemeId]) {
      currentTheme.value = newThemeId
    }
  })
})

// 建議：為了效能，組件銷毀時移除監聽
onUnmounted(() => {
  window.removeEventListener('theme-changed', () => {})
})
</script>


<template>
  <!-- 在Nav主題樣式綁定處，加入 CSS 變數的定義，讓當用於實現動態主題（Dynamic Theming）或一鍵換膚的功能 -->
  <!-- 這樣做的好處： 你可以在 CSS 檔案中透過 var(--theme-text) 來引用這些值。 -->
<div class="dashboard-layout" 
    :style="{ 
      '--theme-text': currentStyle.text, 
      '--theme-card': currentStyle.cardBg,
      '--theme-border': currentStyle.border,
    background: currentStyle.bgGradient, 
    color: currentStyle.text 
}">    
      <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />
      <div class="background-effects"><div v-for="n in 8" :key="n" class="effect-circle"></div></div>

    <aside 
      :class="['sidebar', { 'sidebar-open': sidebarOpen }]" 
      :style="{ background: currentStyle.sidebarBg, borderColor: currentStyle.border }"
    >
      <div class="sidebar-content">
        <div class="sidebar-header" :style="{ borderColor: currentStyle.border }">
          <RouterLink to="/dashboard" class="logo">
            <div class="logo-icon"><img src="../assets/logo.svg" alt="logo" width="72" height="72"></div>
            <span class="logo-text" :style="{ color: currentStyle.text }">Money MMA</span>
          </RouterLink>
          <button class="close-button" @click="sidebarOpen = false" :style="{ color: currentStyle.text }">✕</button>
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
  color: inherit;
}

.user-email {
  font-size: 0.75rem;
  color: inherit;
}

.logout-button {
  width: 100%;
  padding: 0.6rem;
  color: inherit;
  background: var(--theme-card, rgba(255,255,255,0.8));
  border: 1px var(--theme-border, rgba(255,255,255,0.1));
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

/* 佈局基礎 */

.dashboard-layout { min-height: 100vh; transition: all 0.5s ease; color: inherit; }
.sidebar { border-right: 1px solid; transition: transform 0.3s, background 0.5s; backdrop-filter: blur(15px); }

/* 修正重點：移除所有原本寫死的顏色數值 */
.logo-text { font-size: 1.25rem; font-weight: 700; /* color: #1e293b; <-- 刪除這行 */ }

.nav-item { 
  display: flex; align-items: center; gap: 12px; padding: 0.75rem 1rem; border-radius: 10px;
  text-decoration: none; font-size: 0.95rem; font-weight: 500; color: inherit;
  /* color: #64748b; <-- 刪除這行，改由 template 的 inherit 控制 */
}

.nav-item:hover { background: rgba(255, 255, 255, 0.15); }

/* 只有 Active 狀態維持白色 */
.nav-item-active { background: linear-gradient(135deg, #3b82f6, #2563eb) !important; color: #ffffff !important; }

.top-bar { backdrop-filter: blur(10px); border-bottom: 1px solid; }

/* 跑馬燈容器背景設為半透明，確保白字在深色背景下有足夠對比度 */
.news-ticker-container { border-radius: 50px; height: 38px; flex: 1; margin: 0 1rem; border: 1px solid; display: flex; align-items: center; }

.user-name { font-weight: 600; /* color: #1e293b; <-- 刪除這行 */ }
.user-email { font-size: 0.75rem; /* color: #64748b; <-- 刪除這行 */ }

@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.ticker-content { display: inline-block; white-space: nowrap; animation: marquee 30s linear infinite; }</style>