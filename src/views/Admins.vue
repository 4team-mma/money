<template>
<DashboardLayout>
    <div class="admin-container">
        <div class="admin-header">
            <h1>後台管理</h1>
            <p>系統管理與數據分析中心</p>
        </div>

        <!-- 統計卡片 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon user-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.totalUsers }}</div>
                    <div class="stat-label">總用戶數</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon transaction-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.totalTransactions }}</div>
                    <div class="stat-label">總交易筆數</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon revenue-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
                    <div class="stat-label">總收入金額</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon active-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.activeUsers }}</div>
                    <div class="stat-label">活躍用戶</div>
                </div>
            </div>
        </div>

        <!-- 標籤頁 -->
        <div class="tabs">
            <button v-for="tab in tabs" :key="tab.id" :class="['tab-button', { active: activeTab === tab.id }]"
                @click="activeTab = tab.id">
                {{ tab.label }}
            </button>
        </div>

        <!-- 總用戶消費分析 -->
        <div v-if="activeTab === 'analytics'" class="tab-content">
            <h2>總用戶消費分析</h2>

            <div class="analytics-grid">
                <div class="chart-card">
                    <h3>月度消費趨勢</h3>
                    <canvas ref="monthlyChart"></canvas>
                </div>

                <div class="chart-card">
                    <h3>類別分布</h3>
                    <canvas ref="categoryChart"></canvas>
                </div>
            </div>

            <div class="user-table-card">
                <h3>用戶消費排行</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>用戶名稱</th>
                            <th>總消費</th>
                            <th>交易次數</th>
                            <th>平均消費</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, index) in topUsers" :key="user.id">
                            <td>{{ index + 1 }}</td>
                            <td>{{ user.name }}</td>
                            <td class="amount-cell">{{ formatCurrency(user.totalSpent) }}</td>
                            <td>{{ user.transactions }}</td>
                            <td class="amount-cell">{{ formatCurrency(user.avgSpent) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- API與模型串接 -->
        <div v-if="activeTab === 'api'" class="tab-content">
            <h2>API與模型串接</h2>

            <div class="api-grid">
                <div class="api-card" v-for="api in apiServices" :key="api.id">
                    <div class="api-header">
                        <h3>{{ api.name }}</h3>
                        <span :class="['status-badge', api.status]">{{ api.statusText }}</span>
                    </div>
                    <p class="api-description">{{ api.description }}</p>

                    <div class="api-stats">
                        <div class="api-stat">
                            <span class="label">請求次數</span>
                            <span class="value">{{ api.requests }}</span>
                        </div>
                        <div class="api-stat">
                            <span class="label">成功率</span>
                            <span class="value">{{ api.successRate }}%</span>
                        </div>
                        <div class="api-stat">
                            <span class="label">平均延遲</span>
                            <span class="value">{{ api.latency }}ms</span>
                        </div>
                    </div>

                    <div class="api-actions">
                        <button class="btn-secondary">測試連接</button>
                        <button class="btn-primary">設定</button>
                    </div>
                </div>
            </div>

            <div class="api-config-card">
                <h3>API 金鑰管理</h3>
                <div class="form-group">
                    <label>OpenAI API Key</label>
                    <input type="password" v-model="apiKeys.openai" placeholder="sk-...">
                </div>
                <div class="form-group">
                    <label>台灣證交所 API Key</label>
                    <input type="password" v-model="apiKeys.twse" placeholder="輸入 API Key">
                </div>
                <div class="form-group">
                    <label>Webhook URL</label>
                    <input type="text" v-model="apiKeys.webhook" placeholder="https://...">
                </div>
                <button class="btn-primary">儲存設定</button>
            </div>
        </div>

        <!-- 使用者管理 -->
        <div v-if="activeTab === 'users'" class="tab-content">
            <h2>使用者管理</h2>

            <div class="table-controls">
                <input type="text" v-model="searchQuery" placeholder="搜尋用戶名稱、Email..." class="search-input">
                <button class="btn-primary">新增用戶</button>
            </div>

            <div class="user-table-card">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用戶名稱</th>
                            <th>Email</th>
                            <th>註冊日期</th>
                            <th>狀態</th>
                            <th>角色</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="user in filteredUsers" :key="user.id">
                            <td>{{ user.id }}</td>
                            <td>{{ user.name }}</td>
                            <td>{{ user.email }}</td>
                            <td>{{ user.registeredDate }}</td>
                            <td>
                                <span :class="['status-badge', user.status]">{{ user.statusText }}</span>
                            </td>
                            <td>{{ user.role }}</td>
                            <td>
                                <button class="btn-icon" @click="editUser(user)">編輯</button>
                                <button class="btn-icon danger" @click="deleteUser(user)">刪除</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 系統設定 -->
        <div v-if="activeTab === 'system'" class="tab-content">
            <h2>系統設定</h2>

            <div class="settings-grid">
                <div class="settings-card">
                    <h3>一般設定</h3>
                    <div class="form-group">
                        <label>系統名稱</label>
                        <input type="text" v-model="systemConfig.name" placeholder="FinanceFlow">
                    </div>
                    <div class="form-group">
                        <label>系統 Email</label>
                        <input type="email" v-model="systemConfig.email" placeholder="admin@financeflow.com">
                    </div>
                    <div class="form-group">
                        <label>時區</label>
                        <select v-model="systemConfig.timezone">
                            <option value="Asia/Taipei">亞洲/台北 (GMT+8)</option>
                            <option value="Asia/Tokyo">亞洲/東京 (GMT+9)</option>
                            <option value="America/New_York">美東 (GMT-5)</option>
                        </select>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>安全性設定</h3>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="systemConfig.twoFactor">
                            <span class="toggle-switch"></span>
                            啟用雙因素認證
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="systemConfig.autoBackup">
                            <span class="toggle-switch"></span>
                            自動備份資料
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="systemConfig.loginNotification">
                            <span class="toggle-switch"></span>
                            登入通知
                        </label>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>通知設定</h3>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="systemConfig.emailNotifications">
                            <span class="toggle-switch"></span>
                            Email 通知
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="systemConfig.smsNotifications">
                            <span class="toggle-switch"></span>
                            簡訊通知
                        </label>
                    </div>
                    <div class="toggle-group">
                        <label class="toggle-label">
                            <input type="checkbox" v-model="systemConfig.pushNotifications">
                            <span class="toggle-switch"></span>
                            推播通知
                        </label>
                    </div>
                </div>

                <div class="settings-card">
                    <h3>資料庫設定</h3>
                    <div class="form-group">
                        <label>資料庫類型</label>
                        <select v-model="systemConfig.dbType">
                            <option value="postgresql">PostgreSQL</option>
                            <option value="mysql">MySQL</option>
                            <option value="mongodb">MongoDB</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>備份頻率</label>
                        <select v-model="systemConfig.backupFrequency">
                            <option value="daily">每日</option>
                            <option value="weekly">每週</option>
                            <option value="monthly">每月</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="save-actions">
                <button class="btn-secondary">重置</button>
                <button class="btn-primary">儲存所有設定</button>
            </div>
        </div>
    </div>
    </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
// 統計數據
const stats = reactive({
    totalUsers: 1248,
    totalTransactions: 8563,
    totalRevenue: 12458900,
    activeUsers: 892
})

// 標籤頁
const activeTab = ref('analytics')
const tabs = [
    { id: 'analytics', label: '總用戶消費分析' },
    { id: 'api', label: 'API與模型串接' },
    { id: 'users', label: '使用者管理' },
    { id: 'system', label: '系統設定' }
]

// 圖表引用
const monthlyChart = ref(null)
const categoryChart = ref(null)

// 用戶排行
const topUsers = ref([
    { id: 1, name: '王小明', totalSpent: 285000, transactions: 124, avgSpent: 2298 },
    { id: 2, name: '李小華', totalSpent: 245000, transactions: 98, avgSpent: 2500 },
    { id: 3, name: '張美玲', totalSpent: 198000, transactions: 156, avgSpent: 1269 },
    { id: 4, name: '陳大同', totalSpent: 176000, transactions: 87, avgSpent: 2023 },
    { id: 5, name: '林小芳', totalSpent: 165000, transactions: 142, avgSpent: 1162 }
])

// API 服務
const apiServices = ref([
    {
        id: 1,
        name: 'OpenAI GPT-4',
        description: 'AI 聊天機器人與自然語言處理',
        status: 'active',
        statusText: '運行中',
        requests: 12450,
        successRate: 99.2,
        latency: 245
    },
    {
        id: 2,
        name: '台灣證交所 API',
        description: '即時股票資訊與交易數據',
        status: 'active',
        statusText: '運行中',
        requests: 8920,
        successRate: 98.5,
        latency: 180
    },
    {
        id: 3,
        name: 'Webhook Service',
        description: '即時事件通知與數據同步',
        status: 'warning',
        statusText: '異常',
        requests: 3450,
        successRate: 85.2,
        latency: 520
    },
    {
        id: 4,
        name: 'SMS Gateway',
        description: '簡訊發送服務',
        status: 'inactive',
        statusText: '未啟用',
        requests: 0,
        successRate: 0,
        latency: 0
    }
])

// API 金鑰
const apiKeys = reactive({
    openai: '',
    twse: '',
    webhook: ''
})

// 用戶列表
const searchQuery = ref('')
const users = ref([
    { id: 1001, name: '王小明', email: 'wang@example.com', registeredDate: '2024-01-15', status: 'active', statusText: '正常', role: '一般用戶' },
    { id: 1002, name: '李小華', email: 'lee@example.com', registeredDate: '2024-02-20', status: 'active', statusText: '正常', role: '一般用戶' },
    { id: 1003, name: '張美玲', email: 'chang@example.com', registeredDate: '2024-03-10', status: 'active', statusText: '正常', role: 'VIP' },
    { id: 1004, name: '陳大同', email: 'chen@example.com', registeredDate: '2024-03-25', status: 'inactive', statusText: '停用', role: '一般用戶' },
    { id: 1005, name: '林小芳', email: 'lin@example.com', registeredDate: '2024-04-05', status: 'active', statusText: '正常', role: '管理員' }
])

const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value
    return users.value.filter(user =>
        user.name.includes(searchQuery.value) ||
        user.email.includes(searchQuery.value)
    )
})

// 系統設定
const systemConfig = reactive({
    name: 'FinanceFlow',
    email: 'admin@financeflow.com',
    timezone: 'Asia/Taipei',
    twoFactor: true,
    autoBackup: true,
    loginNotification: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    dbType: 'postgresql',
    backupFrequency: 'daily'
})

// 格式化貨幣
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0
    }).format(amount)
}

// 繪製圖表
const drawMonthlyChart = () => {
    if (!monthlyChart.value) return

    const canvas = monthlyChart.value
    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.offsetWidth * 2
    const height = canvas.height = canvas.offsetHeight * 2

    ctx.scale(2, 2)

    const data = [45000, 52000, 48000, 61000, 55000, 72000, 68000, 75000, 82000, 78000, 85000, 92000]
    const labels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const maxValue = Math.max(...data)
    const padding = 40
    const chartWidth = width / 2 - padding * 2
    const chartHeight = height / 2 - padding * 2

    // 繪製網格
    ctx.strokeStyle = '#e0e7ff'
    ctx.lineWidth = 1
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width / 2 - padding, y)
        ctx.stroke()
    }

    // 繪製柱狀圖
    const barWidth = chartWidth / data.length * 0.6
    const barGap = chartWidth / data.length * 0.4

    data.forEach((value, index) => {
        const barHeight = (value / maxValue) * chartHeight
        const x = padding + (barWidth + barGap) * index + barGap / 2
        const y = padding + chartHeight - barHeight

        // 漸層色
        const gradient = ctx.createLinearGradient(x, y, x, padding + chartHeight)
        gradient.addColorStop(0, '#3b82f6')
        gradient.addColorStop(1, '#60a5fa')

        ctx.fillStyle = gradient
        ctx.fillRect(x, y, barWidth, barHeight)

        // 標籤
        ctx.fillStyle = '#64748b'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(labels[index], x + barWidth / 2, height / 2 - 10)
    })
}

const drawCategoryChart = () => {
    if (!categoryChart.value) return

    const canvas = categoryChart.value
    const ctx = canvas.getContext('2d')
    const width = canvas.width = canvas.offsetWidth * 2
    const height = canvas.height = canvas.offsetHeight * 2

    ctx.scale(2, 2)

    const data = [
        { label: '飲食', value: 35, color: '#3b82f6' },
        { label: '交通', value: 20, color: '#8b5cf6' },
        { label: '娛樂', value: 15, color: '#ec4899' },
        { label: '購物', value: 18, color: '#f59e0b' },
        { label: '其他', value: 12, color: '#10b981' }
    ]

    const centerX = width / 4
    const centerY = height / 4
    const radius = Math.min(width, height) / 5

    let currentAngle = -Math.PI / 2

    data.forEach(item => {
        const sliceAngle = (item.value / 100) * Math.PI * 2

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()

        // 標籤
        const labelAngle = currentAngle + sliceAngle / 2
        const labelX = centerX + Math.cos(labelAngle) * (radius + 30)
        const labelY = centerY + Math.sin(labelAngle) * (radius + 30)

        ctx.fillStyle = '#1e293b'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${item.label} ${item.value}%`, labelX, labelY)

        currentAngle += sliceAngle
    })
}

// 用戶操作
const editUser = (user) => {
    alert(`編輯用戶: ${user.name}`)
}

const deleteUser = (user) => {
    if (confirm(`確定要刪除用戶 ${user.name} 嗎？`)) {
        users.value = users.value.filter(u => u.id !== user.id)
    }
}

onMounted(() => {
    setTimeout(() => {
        drawMonthlyChart()
        drawCategoryChart()
    }, 100)
})
</script>

<style scoped>
.admin-container {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}

.admin-header {
    margin-bottom: 32px;
}

.admin-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.admin-header p {
    color: #64748b;
    margin: 0;
}

/* 統計卡片 */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-icon svg {
    width: 24px;
    height: 24px;
    color: white;
}

.user-icon {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.transaction-icon {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.revenue-icon {
    background: linear-gradient(135deg, #10b981, #059669);
}

.active-icon {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 4px;
}

.stat-label {
    font-size: 14px;
    color: #64748b;
}

/* 標籤頁 */
.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid #e2e8f0;
}

.tab-button {
    padding: 12px 24px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
}

.tab-button:hover {
    color: #3b82f6;
}

.tab-button.active {
    color: #3b82f6;
}

.tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: #3b82f6;
}

/* 標籤內容 */
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

.tab-content h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 24px 0;
}

.tab-content h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
}

/* 圖表網格 */
.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.chart-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.chart-card canvas {
    width: 100%;
    height: 300px;
    margin-top: 16px;
}

/* API 網格 */
.api-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.api-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.api-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.api-description {
    color: #64748b;
    font-size: 14px;
    margin-bottom: 16px;
}

.api-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
}

.api-stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.api-stat .label {
    font-size: 12px;
    color: #64748b;
}

.api-stat .value {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.api-actions {
    display: flex;
    gap: 8px;
}

.api-config-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 狀態徽章 */
.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.status-badge.active {
    background: #dcfce7;
    color: #166534;
}

.status-badge.warning {
    background: #fef3c7;
    color: #92400e;
}

.status-badge.inactive {
    background: #f1f5f9;
    color: #475569;
}

/* 表格 */
.table-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 16px;
}

.search-input {
    flex: 1;
    max-width: 400px;
    padding: 10px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
}

.search-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.user-table-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table thead {
    background: #f8fafc;
}

.data-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
}

.data-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: #1e293b;
    border-bottom: 1px solid #f1f5f9;
}

.data-table tbody tr:hover {
    background: #f8fafc;
}

.amount-cell {
    font-weight: 600;
    color: #3b82f6;
}

/* 設定網格 */
.settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
}

.settings-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #475569;
    margin-bottom: 8px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #3b82f6;
}

.toggle-group {
    margin-bottom: 16px;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    font-size: 14px;
    color: #1e293b;
}

.toggle-label input[type="checkbox"] {
    display: none;
}

.toggle-switch {
    width: 44px;
    height: 24px;
    background: #cbd5e1;
    border-radius: 12px;
    position: relative;
    transition: background 0.3s;
}

.toggle-switch::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.3s;
}

.toggle-label input[type="checkbox"]:checked+.toggle-switch {
    background: #3b82f6;
}

.toggle-label input[type="checkbox"]:checked+.toggle-switch::after {
    transform: translateX(20px);
}

/* 按鈕 */
.btn-primary {
    padding: 10px 20px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
    padding: 10px 20px;
    background: white;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
}

.btn-secondary:hover {
    background: #f8fafc;
}

.btn-icon {
    padding: 6px 12px;
    background: transparent;
    color: #3b82f6;
    border: 1px solid #3b82f6;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
    margin-right: 8px;
}

.btn-icon:hover {
    background: #3b82f6;
    color: white;
}

.btn-icon.danger {
    color: #ef4444;
    border-color: #ef4444;
}

.btn-icon.danger:hover {
    background: #ef4444;
    color: white;
}

.save-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}
</style>
