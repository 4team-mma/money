<script setup>
import { ref } from 'vue'
import Nav from '@/components/Nav.vue';

const currentMonth = ref({
  income: 85000,
  expense: 52340,
  balance: 32660
})

const accounts = ref([
  { name: '主要帳戶', balance: 125000, type: 'bank', change: 5.2 },
  { name: '現金', balance: 8500, type: 'cash', change: -2.1 },
  { name: '信用卡', balance: -12300, type: 'credit', change: 15.3 }
])

const recentTransactions = ref([
  { id: 1, name: '星巴克咖啡', amount: -180, category: '飲食', date: '2025-12-13', type: 'expense' },
  { id: 2, name: '薪資入帳', amount: 85000, category: '收入', date: '2025-12-10', type: 'income' },
  { id: 3, name: '超市購物', amount: -1250, category: '居家', date: '2025-12-09', type: 'expense' },
  { id: 4, name: '捷運月票', amount: -1280, category: '交通', date: '2025-12-08', type: 'expense' }
])

const budgets = ref([
  { category: '飲食', spent: 8500, limit: 12000, color: 'color-1' },
  { category: '交通', spent: 3200, limit: 5000, color: 'color-2' },
  { category: '娛樂', spent: 6800, limit: 8000, color: 'color-3' }
])

const formatNumber = (num) => {
  return num.toLocaleString()
}



</script>




<template>
  <Nav>
  <div class="dashboard-page-layout" style="display: flex; min-height: 100vh;">
    
    <div class="dashboard-container" style="flex: 1;">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">儀表板</h1>
        <p class="page-subtitle">歡迎回來！這是您本月的財務概況</p>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="overview-grid">
      <div class="stat-card income-card">
        <div class="card-header">
          <span class="card-title">本月收入</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <div class="card-content">
          <div class="amount">NT$ {{ formatNumber(currentMonth.income) }}</div>
          <p class="change-text">較上月增加 12.5%</p>
        </div>
      </div>

      <div class="stat-card expense-card">
        <div class="card-header">
          <span class="card-title">本月支出</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline>
          </svg>
        </div>
        <div class="card-content">
          <div class="amount">NT$ {{ formatNumber(currentMonth.expense) }}</div>
          <p class="change-text">較上月減少 8.3%</p>
        </div>
      </div>

      <div class="stat-card balance-card">
        <div class="card-header">
          <span class="card-title">淨收支</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
          </svg>
        </div>
        <div class="card-content">
          <div class="amount balance">NT$ {{ formatNumber(currentMonth.balance) }}</div>
          <p class="change-text">儲蓄率 38.4%</p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Accounts Overview -->
      <div class="card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">帳戶總覽</h3>
          <p class="card-description">即時帳戶餘額</p>
        </div>
        <div class="card-body">
          <div class="accounts-list">
            <div v-for="account in accounts" :key="account.name" class="account-item">
              <div class="account-info">
                <div class="account-icon-wrapper">
                  <svg v-if="account.type === 'bank'" class="account-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                    <line x1="2" x2="22" y1="10" y2="10"></line>
                  </svg>
                  <svg v-else class="account-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                  </svg>
                </div>
                <div>
                  <div class="account-name">{{ account.name }}</div>
                  <div class="account-change" :class="account.change >= 0 ? 'positive' : 'negative'">
                    {{ account.change >= 0 ? '+' : '' }}{{ account.change }}% 本月變化
                  </div>
                </div>
              </div>
              <div class="account-balance" :class="{ negative: account.balance < 0 }">
                NT$ {{ formatNumber(Math.abs(account.balance)) }}
              </div>
            </div>
          </div>
          <button class="btn-outline">管理帳戶</button>
        </div>
      </div>

      <!-- Budget Tracking -->
      <div class="card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">預算追蹤</h3>
          <p class="card-description">本月預算使用狀況</p>
        </div>
        <div class="card-body">
          <div class="budgets-list">
            <div v-for="budget in budgets" :key="budget.category" class="budget-item">
              <div class="budget-header">
                <span class="budget-category">{{ budget.category }}</span>
                <span class="budget-amounts">
                  NT$ {{ formatNumber(budget.spent) }} / {{ formatNumber(budget.limit) }}
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :class="budget.color"
                  :style="{ width: (budget.spent / budget.limit * 100) + '%' }"
                ></div>
              </div>
              <div class="budget-footer">
                <span>{{ ((budget.spent / budget.limit) * 100).toFixed(0) }}% 已使用</span>
                <span>剩餘 NT$ {{ formatNumber(budget.limit - budget.spent) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions & Notifications -->
    <div class="bottom-grid">
      <div class="card transactions-card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">最近交易</h3>
          <p class="card-description">最新的收支紀錄</p>
        </div>
        <div class="card-body">
          <div class="transactions-list">
            <div v-for="transaction in recentTransactions" :key="transaction.id" class="transaction-item">
              <div class="transaction-info">
                <div class="transaction-icon" :class="transaction.type">
                  <svg v-if="transaction.type === 'income'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                  </svg>
                </div>
                <div>
                  <div class="transaction-name">{{ transaction.name }}</div>
                  <div class="transaction-category">{{ transaction.category }}</div>
                </div>
              </div>
              <div class="transaction-details">
                <div class="transaction-amount" :class="{ income: transaction.amount > 0 }">
                  {{ transaction.amount > 0 ? '+' : '' }}NT$ {{ formatNumber(Math.abs(transaction.amount)) }}
                </div>
                <div class="transaction-date">{{ transaction.date }}</div>
              </div>
            </div>
          </div>
          <button class="btn-outline">查看所有交易</button>
        </div>
      </div>

      <div class="card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">重要通知</h3>
          <p class="card-description">系統提醒與建議</p>
        </div>
        <div class="card-body">
          <div class="notifications-list">
            <div class="notification-item warning">
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <div>
                <div class="notification-title">預算提醒</div>
                <p class="notification-text">娛樂預算已使用 85%，建議控制支出</p>
              </div>
            </div>

            <div class="notification-item success">
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"></path>
                <path d="M2 9v1c0 1.1.9 2 2 2h1"></path>
                <path d="M16 11h0"></path>
              </svg>
              <div>
                <div class="notification-title">儲蓄目標</div>
                <p class="notification-text">本月已達成儲蓄目標 76%，繼續加油！</p>
              </div>
            </div>

            <div class="notification-item info">
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
              <div>
                <div class="notification-title">帳單提醒</div>
                <p class="notification-text">信用卡帳單將於 3 天後到期</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
  </Nav>
</template>



<style scoped>


.dashboard-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-left: 4px solid;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.income-card {
  border-left-color: #3b82f6;
}

.expense-card {
  border-left-color: #ef4444;
}

.balance-card {
  border-left-color: #0ea5e9;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.icon {
  width: 20px;
  height: 20px;
  stroke-width: 2;
}

.income-card .icon {
  color: #3b82f6;
}

.expense-card .icon {
  color: #ef4444;
}

.balance-card .icon {
  color: #0ea5e9;
}

.card-content .amount {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.card-content .amount.balance {
  color: #0ea5e9;
}

.change-text {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

@media (max-width: 1024px) {
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-inner-header {
  margin-bottom: 20px;
}

.card-inner-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.card-description {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: background 0.2s;
}

.account-item:hover {
  background: #f1f5f9;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-icon {
  width: 20px;
  height: 20px;
  stroke: #3b82f6;
  stroke-width: 2;
  fill: none;
}

.account-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.account-change {
  font-size: 12px;
}

.account-change.positive {
  color: #10b981;
}

.account-change.negative {
  color: #ef4444;
}

.account-balance {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.account-balance.negative {
  color: #ef4444;
}

.budgets-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.budget-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.budget-category {
  font-weight: 500;
  color: #1e293b;
}

.budget-amounts {
  color: #64748b;
}

.progress-bar {
  height: 8px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.progress-fill.color-1 {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
}

.progress-fill.color-2 {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.progress-fill.color-3 {
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
}

.budget-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.btn-outline {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #f8fafc;
}

.transaction-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transaction-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.transaction-icon.income {
  background: rgba(16, 185, 129, 0.1);
}

.transaction-icon.expense {
  background: rgba(239, 68, 68, 0.1);
}

.transaction-icon svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  fill: none;
}

.transaction-icon.income svg {
  stroke: #10b981;
}

.transaction-icon.expense svg {
  stroke: #ef4444;
}

.transaction-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.transaction-category {
  font-size: 12px;
  color: #94a3b8;
}

.transaction-details {
  text-align: right;
}

.transaction-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.transaction-amount.income {
  color: #10b981;
}

.transaction-date {
  font-size: 12px;
  color: #94a3b8;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid;
  display: flex;
  gap: 12px;
}

.notification-item.warning {
  background: rgba(14, 165, 233, 0.05);
  border-color: rgba(14, 165, 233, 0.2);
}

.notification-item.success {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.2);
}

.notification-item.info {
  background: rgba(100, 116, 139, 0.05);
  border-color: rgba(100, 116, 139, 0.2);
}

.notification-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  stroke-width: 2;
  fill: none;
}

.notification-item.warning .notification-icon {
  stroke: #0ea5e9;
}

.notification-item.success .notification-icon {
  stroke: #10b981;
}

.notification-item.info .notification-icon {
  stroke: #64748b;
}

.notification-title {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.notification-text {
  font-size: 12px;
  color: #64748b;
  margin: 0;
}
</style>
