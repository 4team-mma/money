<template>
  <DashboardLayout>
    <div class="investments-page">
      <div class="page-header">
        <h1>投資證券</h1>
        <p>台灣證券交易所即時股票資訊</p>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">投資總額</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="stat-value">NT$ 2,458,000</div>
          <p class="stat-change positive">+8.3% 較上月</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">今日收益</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <div class="stat-value positive">+NT$ 15,240</div>
          <p class="stat-description">總報酬率 +6.2%</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">追蹤股票</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div class="stat-value">5 檔</div>
          <p class="stat-description">每日監控</p>
        </div>
      </div>

      <!-- Stock Table -->
      <div class="stock-table-card">
        <div class="card-header">
          <div>
            <h2>台灣證券交易所即時報價</h2>
            <p class="last-update">最後更新：{{ lastUpdate }}</p>
          </div>
          <button @click="refreshStocks" class="refresh-btn">
            <svg xmlns="http://www.w3.org/2000/svg" class="refresh-icon" :class="{ 'spinning': isRefreshing }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            刷新
          </button>
        </div>

        <div class="table-container">
          <table class="stock-table">
            <thead>
              <tr>
                <th>股票代號</th>
                <th>名稱</th>
                <th class="text-right">現價</th>
                <th class="text-right">漲跌</th>
                <th class="text-right">漲跌幅</th>
                <th class="text-right">成交量</th>
                <th class="text-right">最高</th>
                <th class="text-right">最低</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stock in stocks" :key="stock.symbol">
                <td class="stock-symbol">{{ stock.symbol }}</td>
                <td class="stock-name">{{ stock.name }}</td>
                <td class="text-right stock-price">NT$ {{ stock.price.toFixed(2) }}</td>
                <td class="text-right">
                  <span :class="stock.change >= 0 ? 'change-positive' : 'change-negative'">
                    {{ stock.change >= 0 ? '+' : '' }}{{ stock.change.toFixed(2) }}
                  </span>
                </td>
                <td class="text-right">
                  <span :class="['percent-badge', stock.changePercent >= 0 ? 'badge-positive' : 'badge-negative']">
                    <svg v-if="stock.changePercent >= 0" xmlns="http://www.w3.org/2000/svg" class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                      <polyline points="16 7 22 7 22 13"></polyline>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                      <polyline points="16 17 22 17 22 11"></polyline>
                    </svg>
                    {{ stock.changePercent.toFixed(2) }}%
                  </span>
                </td>
                <td class="text-right volume">{{ (stock.volume / 1000).toFixed(1) }}K</td>
                <td class="text-right high-price">{{ stock.high.toFixed(2) }}</td>
                <td class="text-right low-price">{{ stock.low.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref } from 'vue'
import DashboardLayout from '../src/components/DashboardLayout.vue'

const isRefreshing = ref(false)
const stocks = ref([
  { symbol: '2330', name: '台積電', price: 598, change: 5, changePercent: 0.84, volume: 45678, high: 602, low: 595 },
  { symbol: '2317', name: '鴻海', price: 102, change: -1.5, changePercent: -1.45, volume: 89234, high: 104, low: 101 },
  { symbol: '2454', name: '聯發科', price: 1050, change: 15, changePercent: 1.45, volume: 12345, high: 1055, low: 1042 },
  { symbol: '2308', name: '台達電', price: 345, change: -3, changePercent: -0.86, volume: 23456, high: 350, low: 344 },
  { symbol: '2412', name: '中華電', price: 125, change: 2, changePercent: 1.63, volume: 34567, high: 126, low: 123 },
])

const lastUpdate = ref(new Date().toLocaleTimeString('zh-TW'))

const refreshStocks = () => {
  isRefreshing.value = true
  
  stocks.value = stocks.value.map(stock => ({
    ...stock,
    price: stock.price + (Math.random() - 0.5) * 5,
    change: (Math.random() - 0.5) * 10,
    changePercent: (Math.random() - 0.5) * 2,
  }))
  
  lastUpdate.value = new Date().toLocaleTimeString('zh-TW')
  
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}
</script>

<style scoped>
.investments-page {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.stat-icon {
  width: 20px;
  height: 20px;
  color: #667eea;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.stat-value.positive {
  color: #10b981;
}

.stat-change {
  font-size: 0.875rem;
  font-weight: 600;
}

.stat-change.positive {
  color: #10b981;
}

.stat-description {
  font-size: 0.875rem;
  color: #64748b;
}

.stock-table-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.last-update {
  font-size: 0.875rem;
  color: #64748b;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.refresh-icon {
  width: 16px;
  height: 16px;
}

.refresh-icon.spinning {
  animation: spin 0.5s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.table-container {
  overflow-x: auto;
}

.stock-table {
  width: 100%;
  border-collapse: collapse;
}

.stock-table thead tr {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.stock-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.stock-table th.text-right {
  text-align: right;
}

.stock-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.stock-table tbody tr:hover {
  background: #f8fafc;
}

.stock-table td {
  padding: 1rem;
  font-size: 0.95rem;
}

.stock-table td.text-right {
  text-align: right;
}

.stock-symbol {
  font-family: monospace;
  font-weight: 700;
  color: #667eea;
}

.stock-name {
  font-weight: 600;
  color: #1e293b;
}

.stock-price {
  font-weight: 700;
  color: #1e293b;
}

.change-positive {
  color: #10b981;
  font-weight: 600;
}

.change-negative {
  color: #ef4444;
  font-weight: 600;
}

.percent-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: monospace;
}

.badge-positive {
  background: #10b981;
  color: white;
}

.badge-negative {
  background: #ef4444;
  color: white;
}

.trend-icon {
  width: 14px;
  height: 14px;
}

.volume {
  color: #64748b;
}

.high-price {
  color: #10b981;
  font-weight: 600;
}

.low-price {
  color: #ef4444;
  font-weight: 600;
}

@media (max-width: 768px) {
  .investments-page {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
