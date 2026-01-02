<script setup>
import { ref, onMounted } from 'vue'
import Nav from '@/components/Nav.vue';
import axios from '@/api/interceptors'

// 💡 存放從 API 抓回來的「活資料」
const transactions = ref([])

const fetchTransactions = async () => {
    try {
        const response = await axios.get('/records/') 
        
        
        // 🌟 修正：因為攔截器已經處理過，所以 response 直接就是陣列資料
        transactions.value = response 
    } catch (error) {
        console.error("Dashboard 加載失敗::", error)
    }
}

onMounted(() => {
    fetchTransactions()
})

// --- 以下為暫時預設的靜態資料，未來可由其他同學串接 ---
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

const budgets = ref([
  { category: '飲食', spent: 8500, limit: 12000, color: 'color-1' },
  { category: '交通', spent: 3200, limit: 5000, color: 'color-2' },
  { category: '娛樂', spent: 6800, limit: 8000, color: 'color-3' }
])

const formatNumber = (num) => {
  return num ? num.toLocaleString() : 0
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
                <div v-for="(t, index) in transactions" :key="index" class="transaction-item">
                  <div class="transaction-info">
                    <div class="transaction-icon" :class="t.add_type ? 'income' : 'expense'">
                      <span v-if="t.add_class_icon">{{ t.add_class_icon }}</span>
                      <svg v-else-if="t.add_type" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline></svg>
                      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline></svg>
                    </div>
                    <div>
                      <div class="transaction-name">{{ t.add_note || '無備註' }}</div>
                      <div class="transaction-category">{{ t.add_class }}</div>
                    </div>
                  </div>
                  <div class="transaction-details">
                    <div class="transaction-amount" :class="{ income: t.add_type }">
                      {{ t.add_type ? '+' : '-' }}NT$ {{ formatNumber(t.add_amount*1) }}
                    </div>
                    <div class="transaction-date">{{ t.add_date }}</div>
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
  @import '../assets/css/dashboard.css';
</style>


