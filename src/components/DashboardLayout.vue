<template>
  <div class="dashboard-layout">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside :class="['sidebar', { 'sidebar-open': sidebarOpen }]">
      <div class="sidebar-content">
        <div class="sidebar-header">
          <a href="/dashboard" class="logo">
            <div class="logo-icon">💼</div>
            <span class="logo-text">Money MMA</span>
          </a>
          <button class="close-button" @click="sidebarOpen = false">✕</button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">
            <a 
              v-for="item in navigation" 
              :key="item.href"
              :href="item.href"
              :class="['nav-item', { 'nav-item-active': isActive(item.href) }]"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
              <span v-if="isActive(item.href)" class="nav-indicator">›</span>
            </a>
          </div>

          <div class="nav-section admin-section">
            <div class="section-label">管理員</div>
            <a 
              v-for="item in adminNavigation" 
              :key="item.href"
              :href="item.href"
              :class="['nav-item', { 'nav-item-active': isActive(item.href) }]"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-text">{{ item.name }}</span>
            </a>
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">JD</div>
            <div class="user-details">
              <div class="user-name">John Doe</div>
              <div class="user-email">john@example.com</div>
            </div>
          </div>
          <span class="icon" @click="handleLogout"><button class="logout-button">⏏️登出
          </button>
        </span>
        </div>
      </div>
    </aside>

    <div class="main-content">
      <header class="">
        <button class="menu-button" @click="sidebarOpen = true">☰</button>
        <div class="spacer"></div>

      </header>

      <main class="page-content">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const sidebarOpen = ref(false)

const navigation = [
  { name: '儀表板', href: '/dashboard', icon: '📊' },
  { name: '帳戶管理', href: '/accounts', icon: '💼' },
  { name: '記一筆', href: '/transactions', icon: '➕' },
  { name: '行事曆', href: '/calendar', icon: '📅' },
  { name: '圖表分析', href: '/analytics', icon: '📈' },
  { name: '成就系統', href: '/achievements', icon: '🏆' },
  { name: '投資證券', href: '/investments', icon: '📊' },
  { name: '報表匯出', href: '/reports', icon: '📥' },
  { name: '設定', href: '/Settings', icon: '⚙️' }
]

const adminNavigation = [
  { name: '後台管理', href: '/Admins', icon: '🛡️' }
]

const isActive = (href) => {
  return window.location.pathname === href
}

const handleLogout = () => {
  window.location.href = '/Login'
}

</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background: #F8FAFC;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
}

@media (min-width:800px) {
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
  border-right: 2px solid #E2E8F0;
  transform: translateX(-100%);
  transition: transform 0.3s ease-in-out;
   height: 100vh;        /* 🔥 關鍵 */
  overflow: hidden;     /* 不讓整個 sidebar 滾 */
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
  border-bottom: 2px solid #E2E8F0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 1.5rem;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1E293B;
}

.close-button {
  display: block;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748B;
}

@media (min-width: 1024px) {
  .close-button {
    display: none;
  }
}

.sidebar-nav {
  flex: 1;              /* 吃掉中間剩餘空間 */
  overflow-y: auto;     /* 垂直滾動 */
  min-height: 0;        /* 🔥 超重要：避免 flex overflow bug */
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
  border-top: 2px solid #E2E8F0;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94A3B8;
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
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.nav-item-active {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
}

.nav-icon {
  font-size: 1.25rem;
}

.nav-text {
  flex: 1;
}

.nav-indicator {
  font-size: 1rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 2px solid #E2E8F0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #10B981);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: #64748B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logout-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: transparent;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;
}

.logout-button:hover {
  border-color: #3B82F6;
  color: #3B82F6;
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
  border-bottom: 2px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}

@media (min-width: 768px) {
  .top-bar {
    padding: 1rem 2rem;
  }
}

.menu-button {
  display: block;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748B;
}

@media (min-width: 1024px) {
  .menu-button {
    display: none;
  }
}

.spacer {
  flex: 1;
}

.quick-add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
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
