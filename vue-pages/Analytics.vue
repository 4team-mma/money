<template>
  <div class="analytics-page-layout" style="display: flex; min-height: 100vh;">
    <DashboardLayout />
    <div class="analytics-container" style="flex: 1;">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">圖表分析</h1>
        <p class="page-subtitle">深入了解您的財務狀況</p>
      </div>
      <select v-model="period" class="period-select">
        <option value="week">本週</option>
        <option value="month">本月</option>
        <option value="year">今年</option>
        <option value="all">全部</option>
      </select>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card income">
        <div class="metric-header">
          <span class="metric-label">本月收入</span>
        </div>
        <div class="metric-value">NT$ {{ formatNumber(totalIncome) }}</div>
        <div class="metric-change positive">
          <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          </svg>
          <span>+12.5%</span>
        </div>
      </div>

      <div class="metric-card expense">
        <div class="metric-header">
          <span class="metric-label">本月支出</span>
        </div>
        <div class="metric-value">NT$ {{ formatNumber(totalExpense) }}</div>
        <div class="metric-change negative">
          <svg class="trend-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
          </svg>
          <span>-8.3%</span>
        </div>
      </div>

      <div class="metric-card savings">
        <div class="metric-header">
          <span class="metric-label">儲蓄率</span>
        </div>
        <div class="metric-value">{{ savingsRate.toFixed(1) }}%</div>
        <div class="metric-description">健康水平</div>
      </div>

      <div class="metric-card average">
        <div class="metric-header">
          <span class="metric-label">平均日支出</span>
        </div>
        <div class="metric-value">NT$ 1,745</div>
        <div class="metric-description">本月平均值</div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs-container">
      <div class="tabs-header">
        <button 
          v-for="tab in tabs" 
          :key="tab.value"
          @click="activeTab = tab.value"
          class="tab-button"
          :class="{ active: activeTab === tab.value }"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-show="activeTab === 'overview'" class="tab-content">
        <div class="chart-card main-chart">
          <div class="chart-header">
            <h3 class="chart-title">月度收支趨勢</h3>
            <p class="chart-description">過去6個月的收入與支出比較</p>
          </div>
          <div class="chart-wrapper">
            <canvas ref="monthlyChartRef"></canvas>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">本週日支出</h3>
              <p class="chart-description">每日支出變化趨勢</p>
            </div>
            <div class="chart-wrapper small">
              <canvas ref="dailyChartRef"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">財務健康度</h3>
              <p class="chart-description">綜合評分與建議</p>
            </div>
            <div class="health-content">
              <div class="health-score">
                <span class="score-label">整體評分</span>
                <span class="score-value">85/100</span>
              </div>
              <div class="health-bars">
                <div class="health-item">
                  <div class="health-header">
                    <span>收入穩定性</span>
                    <span class="health-percent">90%</span>
                  </div>
                  <div class="health-bar">
                    <div class="health-fill" style="width: 90%; background: linear-gradient(90deg, #3b82f6, #60a5fa)"></div>
                  </div>
                </div>
                <div class="health-item">
                  <div class="health-header">
                    <span>支出控制</span>
                    <span class="health-percent">75%</span>
                  </div>
                  <div class="health-bar">
                    <div class="health-fill" style="width: 75%; background: linear-gradient(90deg, #ef4444, #f87171)"></div>
                  </div>
                </div>
                <div class="health-item">
                  <div class="health-header">
                    <span>儲蓄能力</span>
                    <span class="health-percent">90%</span>
                  </div>
                  <div class="health-bar">
                    <div class="health-fill" style="width: 90%; background: linear-gradient(90deg, #0ea5e9, #38bdf8)"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Tab -->
      <div v-show="activeTab === 'category'" class="tab-content">
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">支出類別分布</h3>
              <p class="chart-description">本月各類別支出佔比</p>
            </div>
            <div class="chart-wrapper medium">
              <canvas ref="categoryPieRef"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">類別排行</h3>
              <p class="chart-description">支出金額由高至低</p>
            </div>
            <div class="ranking-list">
              <div v-for="(category, index) in sortedCategories" :key="category.name" class="ranking-item">
                <div class="rank-badge">{{ index + 1 }}</div>
                <div class="rank-info">
                  <div class="rank-header">
                    <span class="rank-name">{{ category.name }}</span>
                    <span class="rank-amount">NT$ {{ formatNumber(category.value) }}</span>
                  </div>
                  <div class="rank-bar">
                    <div 
                      class="rank-fill" 
                      :style="{ 
                        width: (category.value / sortedCategories[0].value * 100) + '%',
                        background: category.color
                      }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Tab -->
      <div v-show="activeTab === 'account'" class="tab-content">
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">帳戶資產分布</h3>
              <p class="chart-description">各帳戶餘額佔比</p>
            </div>
            <div class="chart-wrapper medium">
              <canvas ref="accountPieRef"></canvas>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">帳戶詳情</h3>
              <p class="chart-description">各帳戶餘額統計</p>
            </div>
            <div class="account-details">
              <div v-for="account in accountData" :key="account.name" class="account-detail-item">
                <div class="account-detail-header">
                  <div class="account-detail-name">
                    <div class="account-color-dot" :style="{ background: account.color }"></div>
                    <span>{{ account.name }}</span>
                  </div>
                  <span class="account-detail-value">NT$ {{ formatNumber(account.value) }}</span>
                </div>
              </div>
              <div class="account-total">
                <span class="total-label">總資產</span>
                <span class="total-value">NT$ {{ formatNumber(totalAssets) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Tab -->
      <div v-show="activeTab === 'trend'" class="tab-content">
        <div class="chart-card main-chart">
          <div class="chart-header">
            <h3 class="chart-title">長期趨勢分析</h3>
            <p class="chart-description">收入與支出的長期變化趨勢</p>
          </div>
          <div class="chart-wrapper">
            <canvas ref="trendChartRef"></canvas>
          </div>
        </div>

        <div class="trend-cards">
          <div class="trend-card income-trend">
            <div class="trend-icon-wrapper">
              <svg class="trend-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <div class="trend-info">
              <h4 class="trend-label">收入趨勢</h4>
              <div class="trend-value positive">+8.5%</div>
              <div class="trend-description">相較上月</div>
            </div>
          </div>

          <div class="trend-card expense-trend">
            <div class="trend-icon-wrapper">
              <svg class="trend-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
            </div>
            <div class="trend-info">
              <h4 class="trend-label">支出趨勢</h4>
              <div class="trend-value positive">-5.2%</div>
              <div class="trend-description">相較上月</div>
            </div>
          </div>

          <div class="trend-card balance-trend">
            <div class="trend-icon-wrapper">
              <svg class="trend-icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" x2="12" y1="20" y2="10"></line>
                <line x1="18" x2="18" y1="20" y2="4"></line>
                <line x1="6" x2="6" y1="20" y2="16"></line>
              </svg>
            </div>
            <div class="trend-info">
              <h4 class="trend-label">結餘趨勢</h4>
              <div class="trend-value positive">+15.8%</div>
              <div class="trend-description">相較上月</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import DashboardLayout from '../src/components/DashboardLayout.vue'

const period = ref('month')
const activeTab = ref('overview')

const monthlyChartRef = ref(null)
const dailyChartRef = ref(null)
const categoryPieRef = ref(null)
const accountPieRef = ref(null)
const trendChartRef = ref(null)

const tabs = [
  { label: '收支總覽', value: 'overview' },
  { label: '類別分析', value: 'category' },
  { label: '帳戶分析', value: 'account' },
  { label: '趨勢分析', value: 'trend' }
]

const monthlyData = [
  { month: '7月', income: 75000, expense: 48000 },
  { month: '8月', income: 82000, expense: 52000 },
  { month: '9月', income: 78000, expense: 45000 },
  { month: '10月', income: 85000, expense: 55000 },
  { month: '11月', income: 88000, expense: 50000 },
  { month: '12月', income: 85000, expense: 52340 }
]

const dailyExpenseData = [
  { date: '12/07', amount: 1250 },
  { date: '12/08', amount: 1820 },
  { date: '12/09', amount: 950 },
  { date: '12/10', amount: 2100 },
  { date: '12/11', amount: 1650 },
  { date: '12/12', amount: 1380 },
  { date: '12/13', amount: 1750 }
]

const categoryData = [
  { name: '飲食', value: 12500, color: '#ef4444' },
  { name: '交通', value: 5200, color: '#3b82f6' },
  { name: '居家', value: 8300, color: '#22c55e' },
  { name: '娛樂', value: 6800, color: '#f97316' },
  { name: '醫療', value: 3200, color: '#ec4899' },
  { name: '教育', value: 4500, color: '#8b5cf6' },
  { name: '其他', value: 11840, color: '#6366f1' }
]

const accountData = [
  { name: '主要帳戶', value: 125000, color: '#3b82f6' },
  { name: '現金', value: 8500, color: '#22c55e' },
  { name: '投資帳戶', value: 450000, color: '#8b5cf6' }
]

const totalIncome = computed(() => monthlyData[monthlyData.length - 1].income)
const totalExpense = computed(() => monthlyData[monthlyData.length - 1].expense)
const savingsRate = computed(() => ((totalIncome.value - totalExpense.value) / totalIncome.value) * 100)
const sortedCategories = computed(() => [...categoryData].sort((a, b) => b.value - a.value))
const totalAssets = computed(() => accountData.reduce((sum, acc) => sum + acc.value, 0))

const formatNumber = (num) => {
  return num.toLocaleString()
}

const drawMonthlyChart = () => {
  const canvas = monthlyChartRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.parentElement.clientWidth
  const height = 350
  canvas.width = width
  canvas.height = height
  
  const padding = { top: 40, right: 40, bottom: 60, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#f8fafc')
  bgGradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)
  
  // Calculate scales
  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)))
  const yScale = chartHeight / maxValue
  const xStep = chartWidth / (monthlyData.length - 1)
  
  // Draw grid lines with subtle styling
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.setLineDash([5, 5])
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  // Draw Y axis labels
  ctx.fillStyle = '#64748b'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const value = maxValue - (maxValue / 5) * i
    const y = padding.top + (chartHeight / 5) * i
    ctx.fillText(`${(value / 1000).toFixed(0)}k`, padding.left - 10, y + 4)
  }
  
  // Draw bars with gradient
  const barWidth = (chartWidth / monthlyData.length) * 0.35
  
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const incomeHeight = data.income * yScale
    const expenseHeight = data.expense * yScale
    
    // Income bar with gradient
    const incomeGradient = ctx.createLinearGradient(0, height - padding.bottom - incomeHeight, 0, height - padding.bottom)
    incomeGradient.addColorStop(0, '#3b82f6')
    incomeGradient.addColorStop(1, '#60a5fa')
    
    ctx.fillStyle = incomeGradient
    ctx.beginPath()
    ctx.roundRect(x - barWidth - 2, height - padding.bottom - incomeHeight, barWidth, incomeHeight, [8, 8, 0, 0])
    ctx.fill()
    
    // Add shadow
    ctx.shadowColor = 'rgba(59, 130, 246, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 4
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    
    // Expense bar with gradient
    const expenseGradient = ctx.createLinearGradient(0, height - padding.bottom - expenseHeight, 0, height - padding.bottom)
    expenseGradient.addColorStop(0, '#ef4444')
    expenseGradient.addColorStop(1, '#f87171')
    
    ctx.fillStyle = expenseGradient
    ctx.beginPath()
    ctx.roundRect(x + 2, height - padding.bottom - expenseHeight, barWidth, expenseHeight, [8, 8, 0, 0])
    ctx.fill()
    
    // Add shadow
    ctx.shadowColor = 'rgba(239, 68, 68, 0.3)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 4
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  })
  
  // Draw X axis labels
  ctx.fillStyle = '#64748b'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'center'
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    ctx.fillText(data.month, x, height - padding.bottom + 25)
  })
  
  // Draw legend with modern styling
  const legendY = height - 20
  ctx.font = '14px sans-serif'
  
  // Income legend
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  ctx.roundRect(width / 2 - 100, legendY - 6, 16, 12, 3)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.textAlign = 'left'
  ctx.fillText('收入', width / 2 - 78, legendY + 4)
  
  // Expense legend
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.roundRect(width / 2 + 20, legendY - 6, 16, 12, 3)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.fillText('支出', width / 2 + 42, legendY + 4)
}

const drawDailyChart = () => {
  const canvas = dailyChartRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.parentElement.clientWidth
  const height = 200
  canvas.width = width
  canvas.height = height
  
  const padding = { top: 30, right: 30, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  ctx.clearRect(0, 0, width, height)
  
  // Background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#f0f9ff')
  bgGradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)
  
  const maxValue = Math.max(...dailyExpenseData.map(d => d.amount))
  const yScale = chartHeight / maxValue
  const xStep = chartWidth / (dailyExpenseData.length - 1)
  
  // Grid lines
  ctx.strokeStyle = '#e0f2fe'
  ctx.lineWidth = 1
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartHeight / 4) * i
    ctx.beginPath()
    ctx.setLineDash([3, 3])
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  // Draw area under line
  ctx.beginPath()
  ctx.moveTo(padding.left, height - padding.bottom)
  
  dailyExpenseData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.amount * yScale
    if (index === 0) {
      ctx.lineTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.lineTo(width - padding.right, height - padding.bottom)
  ctx.closePath()
  
  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
  areaGradient.addColorStop(0, 'rgba(14, 165, 233, 0.2)')
  areaGradient.addColorStop(1, 'rgba(14, 165, 233, 0.02)')
  ctx.fillStyle = areaGradient
  ctx.fill()
  
  // Draw line
  ctx.beginPath()
  dailyExpenseData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.amount * yScale
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.strokeStyle = '#0ea5e9'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  
  // Draw points
  dailyExpenseData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.amount * yScale
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#0ea5e9'
    ctx.lineWidth = 2
    ctx.stroke()
  })
  
  // X axis labels
  ctx.fillStyle = '#64748b'
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  dailyExpenseData.forEach((data, index) => {
    const x = padding.left + xStep * index
    ctx.fillText(data.date, x, height - padding.bottom + 20)
  })
}

const drawPieChart = (canvas, data, showLabels = true) => {
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.parentElement.clientWidth
  const height = 300
  canvas.width = width
  canvas.height = height
  
  ctx.clearRect(0, 0, width, height)
  
  const centerX = width / 2
  const centerY = height / 2 - 20
  const radius = Math.min(width, height) / 2 - 60
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let currentAngle = -Math.PI / 2
  
  data.forEach((item, index) => {
    const sliceAngle = (item.value / total) * Math.PI * 2
    
    // Draw slice
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
    ctx.closePath()
    ctx.fillStyle = item.color
    ctx.fill()
    
    // Add shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 2
    ctx.fill()
    ctx.shadowBlur = 0
    
    // Draw label
    if (showLabels) {
      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7)
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const percent = ((item.value / total) * 100).toFixed(0)
      ctx.fillText(`${item.name}`, labelX, labelY - 8)
      ctx.fillText(`${percent}%`, labelX, labelY + 8)
    }
    
    currentAngle += sliceAngle
  })
}

const drawTrendChart = () => {
  const canvas = trendChartRef.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.parentElement.clientWidth
  const height = 350
  canvas.width = width
  canvas.height = height
  
  const padding = { top: 40, right: 40, bottom: 60, left: 70 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  
  ctx.clearRect(0, 0, width, height)
  
  // Background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#fafafa')
  bgGradient.addColorStop(1, '#ffffff')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)
  
  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.income, d.expense)))
  const yScale = chartHeight / maxValue
  const xStep = chartWidth / (monthlyData.length - 1)
  
  // Grid
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  // Y axis labels
  ctx.fillStyle = '#6b7280'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const value = maxValue - (maxValue / 5) * i
    const y = padding.top + (chartHeight / 5) * i
    ctx.fillText(`${(value / 1000).toFixed(0)}k`, padding.left - 10, y + 4)
  }
  
  // Draw income line
  ctx.beginPath()
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.income * yScale
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  
  // Income points
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.income * yScale
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 3
    ctx.stroke()
  })
  
  // Draw expense line
  ctx.beginPath()
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.expense * yScale
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 3
  ctx.stroke()
  
  // Expense points
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    const y = height - padding.bottom - data.expense * yScale
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 3
    ctx.stroke()
  })
  
  // X axis labels
  ctx.fillStyle = '#6b7280'
  ctx.font = '13px sans-serif'
  ctx.textAlign = 'center'
  monthlyData.forEach((data, index) => {
    const x = padding.left + xStep * index
    ctx.fillText(data.month, x, height - padding.bottom + 25)
  })
  
  // Legend
  const legendY = height - 18
  ctx.font = '14px sans-serif'
  
  ctx.fillStyle = '#3b82f6'
  ctx.beginPath()
  ctx.arc(width / 2 - 80, legendY, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.textAlign = 'left'
  ctx.fillText('收入', width / 2 - 68, legendY + 4)
  
  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(width / 2 + 20, legendY, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1e293b'
  ctx.fillText('支出', width / 2 + 32, legendY + 4)
}

// Helper for rounded rectangles
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
  if (typeof radius === 'number') {
    radius = [radius, radius, radius, radius]
  }
  this.moveTo(x + radius[0], y)
  this.lineTo(x + width - radius[1], y)
  this.quadraticCurveTo(x + width, y, x + width, y + radius[1])
  this.lineTo(x + width, y + height - radius[2])
  this.quadraticCurveTo(x + width, y + height, x + width - radius[2], y + height)
  this.lineTo(x + radius[3], y + height)
  this.quadraticCurveTo(x, y + height, x, y + height - radius[3])
  this.lineTo(x, y + radius[0])
  this.quadraticCurveTo(x, y, x + radius[0], y)
  this.closePath()
}

onMounted(() => {
  drawMonthlyChart()
  drawDailyChart()
  drawPieChart(categoryPieRef.value, categoryData)
  drawPieChart(accountPieRef.value, accountData)
  drawTrendChart()
})

watch(activeTab, async () => {
  await nextTick()
  if (activeTab.value === 'overview') {
    drawMonthlyChart()
    drawDailyChart()
  } else if (activeTab.value === 'category') {
    drawPieChart(categoryPieRef.value, categoryData)
  } else if (activeTab.value === 'account') {
    drawPieChart(accountPieRef.value, accountData)
  } else if (activeTab.value === 'trend') {
    drawTrendChart()
  }
})
</script>

<style scoped>
.analytics-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%);
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

.period-select {
  padding: 10px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
}

.period-select:hover {
  border-color: #3b82f6;
}

.period-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.metric-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  border-left: 4px solid;
  transition: all 0.3s;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.metric-card.income {
  border-left-color: #3b82f6;
  background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
}

.metric-card.expense {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.metric-card.savings {
  border-left-color: #0ea5e9;
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
}

.metric-card.average {
  border-left-color: #8b5cf6;
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
}

.metric-header {
  margin-bottom: 12px;
}

.metric-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
}

.metric-change.positive {
  color: #10b981;
}

.metric-change.negative {
  color: #ef4444;
}

.trend-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
  fill: none;
}

.metric-description {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.tabs-container {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.tabs-header {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  padding: 6px;
  background: #f8fafc;
  border-radius: 12px;
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.tab-button.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-card {
  background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
}

.chart-card.main-chart {
  margin-bottom: 24px;
}

.chart-header {
  margin-bottom: 20px;
}

.chart-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.chart-description {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 350px;
}

.chart-wrapper.small {
  height: 200px;
}

.chart-wrapper.medium {
  height: 300px;
}

.chart-wrapper canvas {
  width: 100%;
  height: 100%;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.health-content {
  padding: 8px 0;
}

.health-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
}

.score-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.score-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.health-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.health-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.health-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
}

.health-percent {
  color: #3b82f6;
  font-weight: 600;
}

.health-bar {
  height: 10px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.health-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s ease;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  flex-shrink: 0;
}

.rank-info {
  flex: 1;
}

.rank-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.rank-name {
  font-weight: 500;
  color: #1e293b;
}

.rank-amount {
  font-weight: 600;
  color: #475569;
}

.rank-bar {
  height: 8px;
  background: #f8fafc;
  border-radius: 999px;
  overflow: hidden;
}

.rank-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 0;
}

.account-detail-item {
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  transition: background 0.2s;
}

.account-detail-item:hover {
  background: #f1f5f9;
}

.account-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-detail-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.account-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.account-detail-value {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
}

.account-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  margin-top: 8px;
  border-top: 2px solid #e5e7eb;
}

.total-label {
  font-size: 15px;
  font-weight: 600;
  color: #475569;
}

.total-value {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #0ea5e9, #3b82f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.trend-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.trend-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s;
}

.trend-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.trend-card.income-trend {
  background: linear-gradient(135deg, #ffffff, #eff6ff);
  border-color: #bfdbfe;
}

.trend-card.expense-trend {
  background: linear-gradient(135deg, #ffffff, #fef2f2);
  border-color: #fecaca;
}

.trend-card.balance-trend {
  background: linear-gradient(135deg, #ffffff, #f0f9ff);
  border-color: #bae6fd;
}

.trend-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.income-trend .trend-icon-wrapper {
  background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.expense-trend .trend-icon-wrapper {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
}

.balance-trend .trend-icon-wrapper {
  background: linear-gradient(135deg, #e0f2fe, #bae6fd);
}

.trend-icon-large {
  width: 28px;
  height: 28px;
  stroke-width: 2.5;
  fill: none;
}

.income-trend .trend-icon-large {
  stroke: #2563eb;
}

.expense-trend .trend-icon-large {
  stroke: #dc2626;
}

.balance-trend .trend-icon-large {
  stroke: #0284c7;
}

.trend-info {
  flex: 1;
}

.trend-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 8px 0;
}

.trend-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.trend-value.positive {
  color: #10b981;
}

.trend-description {
  font-size: 12px;
  color: #94a3b8;
}
</style>
