<template>
  <div class="calendar-page-layout" style="display: flex; min-height: 100vh;">
    <DashboardLayout />
    <div class="calendar-container" style="flex: 1;">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">財務行事曆</h1>
        <p class="page-subtitle">日曆視圖查看您的收支記錄</p>
      </div>
      <button class="btn-primary">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12h14"></path>
          <path d="M12 5v14"></path>
        </svg>
        新增交易
      </button>
    </div>

    <div class="calendar-grid">
      <!-- Calendar -->
      <div class="card calendar-card">
        <div class="card-body">
          <!-- Calendar Header -->
          <div class="calendar-header">
            <h2 class="calendar-title">{{ currentDate.getFullYear() }} 年 {{ monthNames[currentDate.getMonth()] }}</h2>
            <div class="calendar-controls">
              <button class="control-btn" @click="previousMonth">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="m15 18-6-6 6-6"></path>
                </svg>
              </button>
              <button class="control-btn-text" @click="goToday">今天</button>
              <button class="control-btn" @click="nextMonth">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="calendar-days-header">
            <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day" class="day-header">
              {{ day }}
            </div>
          </div>

          <div class="calendar-days-grid">
            <div
              v-for="(day, index) in calendarDays"
              :key="index"
              class="calendar-day"
              :class="{
                today: day && isToday(day),
                selected: day && isSelected(day),
                empty: !day
              }"
              @click="day && selectDate(day)"
            >
              <template v-if="day">
                <div class="day-number">{{ day.getDate() }}</div>
                <div v-if="getTransactionsForDate(day).length > 0" class="day-indicators">
                  <div
                    v-for="(transaction, idx) in getTransactionsForDate(day).slice(0, 2)"
                    :key="idx"
                    class="indicator-dot"
                    :style="{ backgroundColor: transaction.color }"
                  ></div>
                  <div v-if="getTransactionsForDate(day).length > 2" class="indicator-more">
                    +{{ getTransactionsForDate(day).length - 2 }}
                  </div>
                </div>
                <div v-if="getDayTotal(day) !== 0" class="day-amount" :class="{ income: getDayTotal(day) > 0 }">
                  {{ getDayTotal(day) > 0 ? '+' : '' }}{{ formatAmount(getDayTotal(day)) }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Transaction Details -->
      <div class="card details-card">
        <div class="card-body">
          <h3 class="details-title">
            {{ selectedDate ? formatDate(selectedDate) : '選擇日期' }}
          </h3>

          <div v-if="selectedDate && selectedDateTransactions.length > 0" class="transactions-details">
            <div
              v-for="transaction in selectedDateTransactions"
              :key="transaction.id"
              class="transaction-detail-item"
              :style="{ borderLeft: `3px solid ${transaction.color}` }"
            >
              <div class="transaction-detail-header">
                <div class="transaction-detail-name">{{ transaction.name }}</div>
                <div class="transaction-detail-amount" :class="{ income: transaction.type === 'income' }">
                  {{ transaction.amount > 0 ? '+' : '' }}NT$ {{ formatNumber(Math.abs(transaction.amount)) }}
                </div>
              </div>
              <div class="transaction-detail-category">{{ transaction.category }}</div>
            </div>

            <div class="day-total-section">
              <div class="day-total-row">
                <span>當日總計</span>
                <span class="day-total-value" :class="{ income: getDayTotal(selectedDate) > 0 }">
                  {{ getDayTotal(selectedDate) > 0 ? '+' : '' }}NT$ {{ formatNumber(Math.abs(getDayTotal(selectedDate))) }}
                </span>
              </div>
            </div>
          </div>

          <div v-else-if="selectedDate" class="empty-state">
            <p>這天沒有交易記錄</p>
          </div>

          <div v-else class="empty-state">
            <p>點擊日期查看交易詳情</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Monthly Summary -->
    <div class="card summary-card">
      <div class="card-body">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-label">本月收入</div>
            <div class="summary-value income">NT$ {{ formatNumber(monthlyIncome) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">本月支出</div>
            <div class="summary-value expense">NT$ {{ formatNumber(monthlyExpense) }}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">本月結餘</div>
            <div class="summary-value balance">NT$ {{ formatNumber(monthlyBalance) }}</div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DashboardLayout from '../src/components/DashboardLayout.vue'

const currentDate = ref(new Date())
const selectedDate = ref(null)

const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

const mockTransactions = [
  { id: 1, date: new Date(2025, 11, 5), name: '薪資入帳', amount: 85000, type: 'income', category: '薪資', color: '#10b981' },
  { id: 2, date: new Date(2025, 11, 8), name: '超市購物', amount: -1250, type: 'expense', category: '飲食', color: '#ef4444' },
  { id: 3, date: new Date(2025, 11, 8), name: '捷運月票', amount: -1280, type: 'expense', category: '交通', color: '#3b82f6' },
  { id: 4, date: new Date(2025, 11, 10), name: '電影票', amount: -380, type: 'expense', category: '娛樂', color: '#f97316' },
  { id: 5, date: new Date(2025, 11, 13), name: '星巴克', amount: -180, type: 'expense', category: '飲食', color: '#ef4444' },
  { id: 6, date: new Date(2025, 11, 13), name: '晚餐聚會', amount: -850, type: 'expense', category: '飲食', color: '#ef4444' },
  { id: 7, date: new Date(2025, 11, 15), name: '兼職收入', amount: 5000, type: 'income', category: '收入', color: '#10b981' },
  { id: 8, date: new Date(2025, 11, 20), name: '房租', amount: -15000, type: 'expense', category: '居家', color: '#22c55e' },
  { id: 9, date: new Date(2025, 11, 22), name: '健身房會費', amount: -1500, type: 'expense', category: '健康', color: '#ec4899' },
  { id: 10, date: new Date(2025, 11, 25), name: '書籍購買', amount: -780, type: 'expense', category: '教育', color: '#8b5cf6' }
]

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }
  return days
})

const selectedDateTransactions = computed(() => {
  return selectedDate.value ? getTransactionsForDate(selectedDate.value) : []
})

const monthlyIncome = computed(() => {
  const month = currentDate.value.getMonth()
  return mockTransactions
    .filter(t => t.type === 'income' && t.date.getMonth() === month)
    .reduce((sum, t) => sum + t.amount, 0)
})

const monthlyExpense = computed(() => {
  const month = currentDate.value.getMonth()
  return Math.abs(mockTransactions
    .filter(t => t.type === 'expense' && t.date.getMonth() === month)
    .reduce((sum, t) => sum + t.amount, 0))
})

const monthlyBalance = computed(() => {
  return mockTransactions
    .filter(t => t.date.getMonth() === currentDate.value.getMonth())
    .reduce((sum, t) => sum + t.amount, 0)
})

const getTransactionsForDate = (date) => {
  return mockTransactions.filter(t =>
    t.date.getDate() === date.getDate() &&
    t.date.getMonth() === date.getMonth() &&
    t.date.getFullYear() === date.getFullYear()
  )
}

const getDayTotal = (date) => {
  return getTransactionsForDate(date).reduce((sum, t) => sum + t.amount, 0)
}

const isToday = (date) => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

const isSelected = (date) => {
  return selectedDate.value &&
    date.getDate() === selectedDate.value.getDate() &&
    date.getMonth() === selectedDate.value.getMonth() &&
    date.getFullYear() === selectedDate.value.getFullYear()
}

const selectDate = (date) => {
  selectedDate.value = date
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const goToday = () => {
  currentDate.value = new Date()
}

const formatNumber = (num) => {
  return num.toLocaleString()
}

const formatAmount = (amount) => {
  const abs = Math.abs(amount)
  if (abs > 999) {
    return `${(abs / 1000).toFixed(0)}k`
  }
  return abs
}

const formatDate = (date) => {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}
</script>

<style scoped>
.calendar-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-icon {
  width: 18px;
  height: 18px;
  stroke-width: 2;
  fill: none;
}

.calendar-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .calendar-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.card-body {
  padding: 24px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.calendar-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.control-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn svg {
  width: 18px;
  height: 18px;
  stroke: #64748b;
  stroke-width: 2;
  fill: none;
}

.control-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.control-btn-text {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn-text:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.calendar-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.day-header {
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  padding: 12px 0;
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.calendar-day {
  aspect-ratio: 1;
  padding: 12px;
  border-radius: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  background: #fafafa;
}

.calendar-day:not(.empty):hover {
  background: #f1f5f9;
  transform: scale(1.05);
}

.calendar-day.empty {
  background: transparent;
  cursor: default;
}

.calendar-day.today {
  background: rgba(14, 165, 233, 0.1);
  border: 2px solid #0ea5e9;
}

.calendar-day.selected {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.calendar-day.selected .day-number {
  color: white;
}

.day-indicators {
  display: flex;
  gap: 3px;
  margin-bottom: 4px;
}

.indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.indicator-more {
  font-size: 9px;
  color: #64748b;
}

.calendar-day.selected .indicator-more {
  color: rgba(255, 255, 255, 0.7);
}

.day-amount {
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
}

.day-amount.income {
  color: #10b981;
}

.calendar-day.selected .day-amount {
  color: rgba(255, 255, 255, 0.9);
}

.details-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
}

.transactions-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.transaction-detail-item {
  padding: 14px;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.transaction-detail-item:hover {
  background: #f1f5f9;
}

.transaction-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 6px;
}

.transaction-detail-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.transaction-detail-amount {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.transaction-detail-amount.income {
  color: #10b981;
}

.transaction-detail-category {
  font-size: 12px;
  color: #94a3b8;
  padding: 4px 10px;
  background: white;
  border-radius: 6px;
  display: inline-block;
}

.day-total-section {
  padding-top: 16px;
  margin-top: 12px;
  border-top: 2px solid #e5e7eb;
}

.day-total-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
}

.day-total-value {
  color: #1e293b;
}

.day-total-value.income {
  color: #10b981;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.empty-state p {
  color: #94a3b8;
  font-size: 14px;
  margin: 0;
}

.summary-card {
  margin-top: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.summary-item {
  text-align: center;
}

.summary-label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
}

.summary-value.income {
  color: #10b981;
}

.summary-value.expense {
  color: #ef4444;
}

.summary-value.balance {
  color: #0ea5e9;
}
</style>
