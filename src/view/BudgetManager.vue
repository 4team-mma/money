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

// 1. 月總預算數據
const monthlyLimit = ref(20000);
const usagePercentage = ref(75);

// 2. 類別預算數據
const categories = ref([
  { name: '飲食', spent: 4500, limit: 6000, icon: '🍱' },
  { name: '交通', spent: 1200, limit: 2000, icon: '🚗' },
  { name: '娛樂', spent: 3000, limit: 3000, icon: '🎮' },
  { name: '日常', spent: 800, limit: 1500, icon: '🛒' }
]);

// 3. 標籤預算 (心理帳戶：需求 vs 想要)
const tagBudgets = ref([
  { name: '必要需求', spent: 8500, limit: 10000, color: '#4299E1', desc: '房租、水電、餐飲' },
  { name: '想要欲望', spent: 4500, limit: 6000, color: '#ED64A6', desc: '社交、購物、娛樂' },
  { name: '自我投資', spent: 2000, limit: 4000, color: '#48BB78', desc: '書籍、課程' }
]);

// 4. 儲蓄目標數據
const savingsGoals = ref([
  { id: 1, title: '日本旅遊基金', current: 15200, target: 20000, deadline: '2026-06' },
  { id: 2, title: '緊急預備金', current: 80000, target: 100000, deadline: '2026-12' }
]);

// 計算儲蓄總進度
const totalSavingsProgress = computed(() => {
  const totalCurrent = savingsGoals.value.reduce((sum, goal) => sum + goal.current, 0);
  const totalTarget = savingsGoals.value.reduce((sum, goal) => sum + goal.target, 0);
  return Math.round((totalCurrent / totalTarget) * 100);
});
</script>


<template>
  <Nav>
    <div class="budget-app-container">
      <header class="page-header">
        <div class="title-group">
          <h1 style="color: var(--text-primary);">理財規劃方案</h1>
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
        <transition name="fade" mode="out-in">
          <section v-if="activeTab === 'monthly'" key="monthly" class="budget-section">
            <div class="section-header">
              <h2>本月總額規劃</h2>
              <span class="date-tag">2026 年 2 月</span>
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
                    <input type="number" v-model="monthlyLimit">
                  </div>
                </div>
                <div class="info-box">
                  <p>💡 顧問提示：目前支出穩定，建議保持標籤預算的平衡。</p>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'category'" key="category" class="budget-section">
            <div class="section-header">
              <h2>各類別支出細節</h2>
              <button class="btn-text">➕ 新增類別</button>
            </div>
            <div class="category-list">
              <div v-for="cat in categories" :key="cat.name" class="category-item-card">
                <div class="cat-header">
                  <span class="cat-icon">{{ cat.icon }}</span>
                  <span class="cat-name">{{ cat.name }}</span>
                  <span class="cat-status" :class="{ warning: cat.spent >= cat.limit }">
                    {{ cat.spent >= cat.limit ? '已達上限' : '尚有餘額' }}
                  </span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-info">
                    <span>${{ cat.spent.toLocaleString() }}</span>
                    <span>${{ cat.limit.toLocaleString() }}</span>
                  </div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: (cat.spent/cat.limit)*100 + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'tag'" key="tag" class="budget-section">
            <div class="section-header">
              <h2>心理帳戶比例 (50/30/20)</h2>
            </div>
            <div class="tag-grid">
              <div v-for="tag in tagBudgets" :key="tag.name" class="tag-card">
                <div class="tag-color-bar" :style="{ backgroundColor: tag.color }"></div>
                <h3>{{ tag.name }}</h3>
                <p class="tag-desc">{{ tag.desc }}</p>
                <div class="tag-stats">
                  <span class="tag-spent">${{ tag.spent.toLocaleString() }}</span>
                  <span class="tag-limit">/ ${{ tag.limit.toLocaleString() }}</span>
                </div>
                <div class="mini-progress">
                  <div class="mini-fill" :style="{ width: (tag.spent/tag.limit)*100 + '%', backgroundColor: tag.color }"></div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'savings'" key="savings" class="budget-section">
            <div class="savings-summary-card">
              <div class="summary-text">
                <h3>總儲蓄達成率</h3>
                <p>本月已完成 {{ totalSavingsProgress }}% 的儲蓄進度</p>
              </div>
              <div class="summary-value">{{ totalSavingsProgress }}%</div>
            </div>
            <div class="goals-list">
              <div v-for="goal in savingsGoals" :key="goal.id" class="goal-item">
                <div class="goal-info">
                  <span class="goal-title">{{ goal.title }}</span>
                  <span class="goal-date">目標日期：{{ goal.deadline }}</span>
                </div>
                <div class="goal-progress-wrapper">
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill savings" :style="{ width: (goal.current/goal.target)*100 + '%' }"></div>
                  </div>
                  <div class="goal-amounts">
                    <span>${{ goal.current.toLocaleString() }}</span>
                    <span>${{ goal.target.toLocaleString() }}</span>
                  </div>
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
.status-badge{
  color: var(--text-primary);
}
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

.btn-text{
  width: auto; font-size: 15px; font-weight: 500;
  border-radius: 6px; border: 1px; margin-bottom: 10px;
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

/* 通用進度條 */
.progress-bar-bg { background: #edf2f7; height: 12px; border-radius: 6px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: #33aab3; transition: width 0.5s ease-out; }


/* 類別預算卡片設計 */
.category-item-card { background: #f8fafc; padding: 20px; border-radius: 16px; margin-bottom: 16px; border: 1px solid #edf2f7; }
.cat-header { display: flex; align-items: center; margin-bottom: 12px; }
.cat-icon { font-size: 20px; margin-right: 12px; }
.cat-name { font-weight: 700; flex-grow: 1; }
.cat-status { font-size: 12px; padding: 4px 10px; border-radius: 20px; background: #e2e8f0; }
.cat-status.warning { background: #fed7d7; color: #c53030; }


/* 儲蓄目標美化 */
.savings-summary-card { background: linear-gradient(135deg, #3182ce 0%, #41c0d6 100%); color: white; padding: 30px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.summary-value { font-size: 48px; font-weight: 900; opacity: 0.9; }
.goal-item { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #edf2f7; }
.goal-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
.goal-title { font-weight: 700; font-size: 18px; }
.goal-amounts { display: flex; justify-content: space-between; font-size: 14px; color: #718096; margin-top: 5px; }
.progress-bar-fill.savings { background: #48BB78; }




/* 標籤預算 (Grid 佈局) */
.tag-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
.tag-card { position: relative; background: #fff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; transition: transform 0.2s; }
.tag-card:hover { transform: translateY(-4px); }
.tag-color-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; }
.tag-desc { font-size: 13px; color: #a0aec0; margin-bottom: 15px; }
.tag-stats { margin-bottom: 8px; font-weight: 800; }
.tag-limit { color: #cbd5e0; font-size: 14px; }
.mini-progress { height: 6px; background: #edf2f7; border-radius: 3px; }
.mini-fill { height: 100%; border-radius: 3px; }


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