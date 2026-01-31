<script setup>

import Nav from '@/components/Nav.vue'
import { ref, computed } from 'vue';


// 控制分頁狀態
const activeTab = ref('monthly');
const tabs = [
  { id: 'monthly', label: '月總預算' },
  { id: 'category', label: '類別預算' },
  { id: 'tag', label: '標籤預算' },
  { id: 'savings', label: '儲蓄目標' }
];

// 響應式數據 (可改為從 API 獲取)
const monthlyLimit = ref(20000);
const categories = ref([
  { name: '飲食', spent: 4500, limit: 6000 },
  { name: '交通', spent: 1200, limit: 2000 },
  { name: '娛樂', spent: 3000, limit: 3000 },
  { name: '日常', spent: 800, limit: 1500 }
]);
// 模擬數據
const usagePercentage = ref(75); // 這裡之後可以接後端計算出的數據


</script>

<template>
  <Nav>
  <div class="budget-app-container">
    <header class="page-header">
      <div class="title-group">
        <h1>理財規劃方案</h1>
        <p class="subtitle">精準控制 Money MMA 流量，實現您的儲蓄目標</p>
      </div>
      <div class="header-action">
        <span class="status-badge">自動同步中</span>
      </div>
    </header>

    <nav class="tab-nav">
      <button 
        v-for="tab in tabs" :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </nav>

    <main class="main-card">
      
      <transition name="fade">
        <section v-if="activeTab === 'monthly'" class="budget-section">
          <div class="section-header">
            <h2>本月總額規劃</h2>
            <span class="date-tag">2026 年 1 月</span>
          </div>
          
          <div class="monthly-grid">
            <div class="progress-circle-container">
              <svg viewBox="0 0 36 36" class="circular-chart blue">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="circle" :stroke-dasharray="usagePercentage + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <text x="18" y="20.35" class="percentage">{{ usagePercentage }}%</text>
                <text x="18" y="26" class="label">已使用</text>
              </svg>
            </div>

            <div class="budget-inputs">
              <div class="input-field">
                <label>月預算上限 (TWD)</label>
                <div class="currency-input">
                  <span class="unit">$</span>
                  <input type="number" v-model="monthlyLimit" placeholder="0">
                </div>
              </div>
              <div class="info-box">
                <i class="icon-info">ℹ️</i>
                <p>系統將根據您在「偏好設定」中的設定，在達 75% 時發送通知提醒。</p>
              </div>
            </div>
          </div>
        </section>
      </transition>

      <transition name="fade">
        <section v-if="activeTab === 'category'" class="budget-section">
          <h2>類別分配</h2>
          <div class="category-list">
            <div v-for="cat in categories" :key="cat.name" class="category-item">
              <div class="cat-info">
                <span>{{ cat.name }}</span>
                <span class="cat-amount">${{ cat.spent }} / ${{ cat.limit }}</span>
              </div>
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" :style="{ width: (cat.spent/cat.limit)*100 + '%' }"></div>
              </div>
            </div>
          </div>
        </section>
      </transition>

      </main>

    <footer class="page-footer">
      <button class="btn-secondary">重置</button>
      <button class="btn-primary">儲存所有規劃</button>
    </footer>
  </div>
  </Nav>
</template>

<style scoped>
/* 基本字體與佈局 */
.budget-app-container {
  font-family: 'Inter', -apple-system, sans-serif;
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  color: #2d3748;
}

/* 標題設計 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}
h1 { font-size: 28px; font-weight: 800; margin: 0; color: #1a202c; }
.subtitle { color: #718096; margin-top: 5px; }

/* 頁籤導覽 */
.tab-nav {
  display: flex;
  background: #edf2f7;
  padding: 5px;
  border-radius: 12px;
  margin-bottom: 25px;
  width: fit-content;
}
.tab-btn {
  border: none;
  background: transparent;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #4a5568;
  transition: all 0.2s;
}
.tab-btn.active {
  background: white;
  color: #3182ce;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* 主卡片設計 */
.main-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  border: 1px solid #f0f4f8;
  min-height: 400px;
}

/* 圓形進度條 (SVG) */
.progress-circle-container { width: 200px; margin: 0 auto; }
.circular-chart { display: block; margin: 10px auto; max-width: 100%; }
.circle-bg { fill: none; stroke: #eee; stroke-width: 2.8; }
.circle { fill: none; stroke-width: 2.8; stroke-linecap: round; stroke: #3182ce; }
.percentage { fill: #2d3748; font-size: 8px; font-weight: bold; text-anchor: middle; }
.label { fill: #a0aec0; font-size: 3px; text-anchor: middle; }

/* 輸入框美化 */
.monthly-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; align-items: center; }
.currency-input {
  display: flex;
  align-items: center;
  background: #f7fafc;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  padding: 10px 20px;
  margin-top: 8px;
}
.currency-input input {
  background: transparent;
  border: none;
  font-size: 24px;
  font-weight: bold;
  width: 100%;
  outline: none;
}
.unit { font-size: 20px; color: #a0aec0; margin-right: 10px; }

/* 資訊框 */
.info-box {
  background: #ebf8ff;
  padding: 15px;
  border-radius: 12px;
  display: flex;
  gap: 12px;
  margin-top: 25px;
  font-size: 14px;
  color: #2c5282;
  line-height: 1.5;
}

/* 底部按鈕 */
.page-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}
.btn-primary {
  background: #3182ce;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
}
.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 12px 30px;
  border-radius: 10px;
  cursor: pointer;
}

/* 動畫 */
.fade-enter-active { transition: opacity 0.3s; }
.fade-enter-from { opacity: 0; }

</style>