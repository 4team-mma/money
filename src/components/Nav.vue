<script setup>
import { useRouter,useRoute } from 'vue-router'
import { ref, onMounted, computed, onUnmounted } from 'vue'
import MoneyAIBot from '../components/MoneyAIBot.vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'

const sidebarOpen = ref(false)



const router = useRouter() //執行動作。用來指令電腦「去哪裡」。
const route = useRoute() // 讀取狀態。用來查看「目前在哪」
const userStore = useUserStore()
const noticeStore = useNotificationStore()

// === 補上主題樣式 (避免機器人讀不到顏色報錯) ===
const currentStyle = computed(() => {
  // 這裡建議從你的主題邏輯中抓取顏色，或者先給一個預設值
  return { primary: 'var(--color-primary)' } 
})

// === 1. 使用者資訊 (響應式 Computed) ===
// 優先從 Pinia 拿 (API 同步後的最新資料)，備援則從 localStorage 拿 (登入時的快取)
const userData = computed(() => {
  const localUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

  // ✅ 確保先定義 current，再使用它
  const current = userStore.users.find(u => u.username === localUser.username) || localUser

  return {
    name: current.name || '用戶',
    email: current.email || '',
    role: current.role || 'user',
    // ✅ 新增 avatar_url，並加上後端位址
    avatar: localUser.avatar_url ? `http://localhost:8000${localUser.avatar_url}` : null
  }
})

// === 2. 跑馬燈通知 ===
const notifications = ref([]);// 存放從後端抓回來的原始物件

// 格式化顯示在跑馬燈的文字
const marqueeText = computed(() => {
  const tips = ['💡 儲蓄是為了給未來的自己一份禮物。', '🚀 養成記帳習慣，財富自由不遙遠。', '💡 理財小撇步：採用 50/30/20 法則分配薪資，能讓您的儲蓄目標更早達成。', '🚀 Money MMA 提示：點擊「記一筆」快速紀錄今日開銷，養成好習慣。']
  
  // 用 activeList，這樣未來的提醒就不會出現在跑馬燈
  const notes = noticeStore.activeList
    .filter(n => !n.is_read)
    .map(n => n.reminder_title)
  
  // 合併：重要通知在前，溫馨語錄在後
  // 如果完全沒有未讀通知，就只顯示 tips
  const combined = notes.length > 0 ? [...notes, ...tips] : tips
  
  // 使用全形空格或特殊符號區隔，視覺上更舒適
  return combined.join('　　 | 　　')
})

const unreadCount = ref(0)

// === 3. 選單配置 ===
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
  { name: '通知中心', to: '/Notifications', icon: '🔔', hasBadge: true },
  { name: '設定', to: '/Settings', icon: '⚙️' }
]

const handleTickerClick = () => {
  // 跳轉到通知管理頁面
  router.push('/Notifications')
}

// === 4. 功能函式 (權限檢查與登出) ===
const checkAuth = () => {
  const token = localStorage.getItem('user_token')
  if (!token) {
    console.warn('🍍 [Layout] 未偵測到登入狀態，導回登入頁')
    window.location.href = '/'
  }
}

const logout = () => {
  if (confirm('確定要登出系統嗎？')) {
    localStorage.removeItem('currentUser')
    localStorage.removeItem('user_token')

    // 2. ⚡️ 新增：清除喵喵機器人的聊天紀錄與開關狀態
    localStorage.removeItem('meowChatHistory')
    localStorage.removeItem('isMeowChatOpen')

    // 清除 Pinia 持久化快取 (確保不同帳號登入時資料不打架)
    localStorage.removeItem('category')
    localStorage.removeItem('categoryStats')
    localStorage.removeItem('account')

    // 終極清除：強制重整並導回首頁，確保記憶體變數完全釋放
    window.location.href = '/';
  }
}

// === 5. 主題初始化與監聽 ===
const initTheme = () => {
  // 從 localStorage 讀取主題 (預設 light)
  const savedTheme = localStorage.getItem('appTheme') || 'light';
  // 設定到 html 標籤上，觸發 main.css 的變數切換
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// 處理主題切換的監聽函式
const handleThemeChange = (e) => {
  const newTheme = e.detail || localStorage.getItem('appTheme');
  document.documentElement.setAttribute('data-theme', newTheme);
}

onMounted(() => {
  // 1. 進頁面立刻抓一次最新的通知清單
  noticeStore.fetchAll();

  // 2. 設定一個每分鐘執行的計時器
  // 雖然 store 裡有 setInterval 更新 now，但主動 fetchAll 
  // 可以抓到其他裝置新增的通知，或後端剛產生的預算警告
  const timer = setInterval(() => {
    noticeStore.fetchAll();
  }, 60000); // 60秒檢查一次

  // 3. 卸載組件時清除計時器，避免記憶體洩漏
  onUnmounted(() => {
    clearInterval(timer);
  });
  checkAuth() // 檢查是否有 Token
  initTheme() // 初始化主題

  // 防禦性補抓：若 Store 是空的 (如使用者直接在功能頁重新整理)，則補抓資料
  if (userStore.users.length === 0) {
    userStore.loadUsers()
  }

  window.addEventListener('theme-changed', handleThemeChange)
})

onUnmounted(() => {
  window.removeEventListener('theme-changed', handleThemeChange)
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
            <RouterLink 
              v-for="item in navigation" 
              :key="item.to" 
              :to="item.to" 
              class="nav-item"
              active-class="nav-item-active" 
              @click="sidebarOpen = false"
            >
              <span class="nav-icon">
                {{ item.icon }}
                <span v-if="item.hasBadge && noticeStore.unreadCount > 0" class="nav-badge">
                  {{ noticeStore.unreadCount > 9 ? '9+' : noticeStore.unreadCount }}
                </span>
              </span>
              <span class="nav-text">{{ item.name }}</span>
              <span class="nav-indicator">›</span>
            </RouterLink>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">
              <img v-if="userData.avatar" :src="userData.avatar"
              style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;"/>
              <span v-else>{{ userData.name.charAt(0).toUpperCase() }}</span>
            </div>
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
            <div class="ticker-content" @click="handleTickerClick">
              {{ marqueeText }} 　　 | 　　 {{ marqueeText }}
            </div>
          </div>
        </div>
        <div class="top-bar-actions">
          <RouterLink to="/Notifications" class="notification-trigger">
            <span class="bell-icon">🔔</span>
            <span v-if="noticeStore.unreadCount > 0" class="top-badge">
              {{ noticeStore.unreadCount > 9 ? '9+' : noticeStore.unreadCount }}
            </span>
          </RouterLink>
        </div>
      
      </header>

      <main class="page-content">
        <slot />
      </main>
    
    </div>
  </div>
  <footer>
    <MoneyAIBot :currentStyle="currentStyle" />
  </footer>
</template>

<style scoped>
/* 引用共用變數後，這裡的 CSS 變得非常乾淨 */

/* 基本佈局 */
.dashboard-layout {
    min-height: 100vh;
    background: var(--bg-body); /* 自動切換背景 */
    transition: background 0.3s ease;
}

.sidebar-backdrop {
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
}

@media (min-width: 1024px) {
    .sidebar-backdrop { display: none; }
}

/* 側邊欄樣式 */
.sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    width: 288px;
    background: var(--bg-sidebar); /* 自動切換 */
    border-right: 1px solid var(--border-color); /* 自動切換 */
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 100vh;
    overflow: hidden;
}

.sidebar-open { transform: translateX(0); }

@media (min-width: 1024px) {
    .sidebar { transform: translateX(0); }
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
    border-bottom: 1px solid var(--border-color);
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
}

.logo-icon {
    background: var(--bg-card);
    padding: 0.5rem;
    border-radius: 8px;
}

.logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
}

.close-button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: var(--text-secondary);
}

@media (min-width: 1024px) {
    .close-button { display: none; }
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
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
}

/* Hover 效果：只有沒被選中的才會變色 */
.nav-item:not(.nav-item-active):hover {
    background: var(--bg-hover);
    color: var(--text-primary);
}

/* Active 效果：使用品牌主色，文字反白 */
.nav-item-active {
    background: var(--color-primary); /* 自動切換品牌色 (藍/綠/橘) */
    color: var(--text-inverse);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    border-top: 1px solid var(--border-color);
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
    /* 頭像維持漸層，使用品牌色 */
    background: linear-gradient(135deg, var(--color-primary), #10b981);
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
    color: var(--text-primary);
}

.user-email {
    font-size: 0.75rem;
    color: var(--text-secondary);
}

.logout-button {
    width: 100%;
    padding: 0.6rem;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: 0.2s;
    color: var(--text-primary);
}

.logout-button:hover {
    background: var(--bg-hover);
    border-color: var(--color-danger);
    color: var(--color-danger);
}

/* 主內容與頂部橫條 */
.main-content {
    margin-left: 0;
    transition: margin-left 0.3s;
}

@media (min-width: 1024px) {
    .main-content { margin-left: 288px; }
}

.top-bar {
    position: sticky;
    top: 0;
    z-index: 30;
    height: 64px;
    background: var(--bg-card); /* 自動切換 */
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    padding: 0 1.5rem;
    opacity: 0.98;
}

.menu-button {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-primary);
}

@media (min-width: 1024px) {
    .menu-button { display: none; }
}

.page-content {
    padding: 1.5rem;
}

@media (min-width: 768px) {
    .page-content { padding: 2rem; }
}

/* --- 跑馬燈 --- */
.news-ticker-container {
    flex: 1;
    display: flex;
    align-items: center;
    background: var(--bg-body);
    border-radius: 50px;
    height: 38px;
    margin: 0 1.5rem;
    padding: 0 4px;
    overflow: hidden;
    border: 1px solid var(--border-color);
}

.ticker-label {
    background: var(--color-primary); /* 自動切換 */
    color: var(--text-inverse);
    font-size: 0.75rem;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 20px;
    white-space: nowrap;
    z-index: 2;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
    color: var(--text-secondary);
    font-weight: 500;
    animation: marquee 50s linear infinite;
    letter-spacing: 1px;
}

.ticker-content:hover {
    animation-play-state: paused;
    cursor: pointer;
}

@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
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

/* 導覽列紅點樣式 */
.nav-icon {
  position: relative; /* 讓紅點相對於圖示定位 */
  font-size: 1.2rem;
}

.nav-badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: #ef4444; /* 鮮艷的紅色 */
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 10px;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--bg-sidebar); /* 用側邊欄背景色做描邊，更有層次感 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 當導覽項被選中 (Active) 時，調整描邊顏色 */
.nav-item-active .nav-badge {
  border-color: var(--color-primary);
}

.notification-trigger {
  position: relative; /* 必備：讓數字相對於鈴鐺定位 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: background 0.2s;
  text-decoration: none;
}

.notification-trigger:hover {
  background: var(--bg-hover);
}

.bell-icon {
  font-size: 1.25rem;
}

/* 頂部列專屬數字紅點樣式 */
.top-badge {
  position: absolute;
  top: 2px;     /* 調整位置，讓它靠右上角 */
  right: 2px;
  background-color: #ef4444; /* 鮮紅色 */
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  
  /* 讓圓圈隨字數伸縮 */
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* 增加白色描邊，在深色/淺色背景下都清晰 */
  border: 2px solid var(--bg-card); 
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  /* 確保文字不會換行 */
  white-space: nowrap;
}
</style>
