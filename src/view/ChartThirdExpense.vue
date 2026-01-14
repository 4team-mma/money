<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRecordStore } from '@/stores/useRecordStore'
import Chart from 'chart.js/auto'
import Nav from '@/components/Nav.vue'
import Chart_Preface from '@/components/ChartPreface.vue'

const recordStore = useRecordStore()
const dailyChartRef = ref(null)
let chartInstance = null

// 1. 檢視期間設定
const period = ref('month')
// 🌟 修正：給予自訂區間預設值 (本月 1 號到今天)，避免切換時直接顯示 0
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

onMounted(async () => {
    await recordStore.fetchAllRecords()
    renderChart()
})

const today = computed(() => {
    const now = new Date()
    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日・${weekMap[now.getDay()]}`
})

// 🌟 2. 核心過濾：只抓支出 (add_type 為 false)
const realRecords = computed(() => {
    return recordStore.records.filter(r => r.add_type === false || r.add_type === 0)
})

// 🌟 3. 期間篩選邏輯 (修正：自訂區間的含括範圍)
const filteredExpenseData = computed(() => {
    const data = realRecords.value
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    if (period.value === 'month') {
        return data.filter(r => {
            const d = new Date(r.add_date)
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth
        })
    }
    
    if (period.value === 'year') {
        return data.filter(r => new Date(r.add_date).getFullYear() === currentYear)
    }

    if (period.value === 'custom') {
        if (!startDate.value || !endDate.value) return []
        const start = new Date(startDate.value)
        const end = new Date(endDate.value)
        // 確保包含結束當天
        end.setHours(23, 59, 59, 999)
        return data.filter(r => {
            const d = new Date(r.add_date)
            return d >= start && d <= end
        })
    }
    return data
})

// 🌟 4. 計算分類加總 (使用後端欄位：add_class, add_amount)
const categoryTableData = computed(() => {
    const map = {}
    let total = 0

    filteredExpenseData.value.forEach(item => {
        const catName = item.add_class || '未分類'
        const amount = parseFloat(item.add_amount || 0)

        if (!map[catName]) {
            map[catName] = { category: catName, amount: 0 }
        }
        map[catName].amount += amount
        total += amount
    })

    return Object.values(map)
        .sort((a, b) => b.amount - a.amount)
        .map((item, index) => ({
            id: index + 1,
            category: item.category,
            amount: item.amount,
            ratio: total ? (item.amount / total) * 100 : 0
        }))
})

// 合計金額
const totalAmount = computed(() => {
    return categoryTableData.value.reduce((sum, item) => sum + item.amount, 0)
})

// 🌟 修正：動態計算天數，讓「平均每天」在切換年份/自訂時是正確的
const periodDays = computed(() => {
    const now = new Date()
    if (period.value === 'month') {
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    }
    if (period.value === 'year') {
        const year = now.getFullYear()
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 366 : 365
    }
    if (period.value === 'custom' && startDate.value && endDate.value) {
        const diff = new Date(endDate.value) - new Date(startDate.value)
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
    }
    return 1
})

const averagePerDay = computed(() => {
    return totalAmount.value > 0 ? Math.round(totalAmount.value / periodDays.value) : 0
})

// 5. 繪製圖表
const renderChart = () => {
    if (!dailyChartRef.value) return
    if (chartInstance) chartInstance.destroy()

    const chartData = categoryTableData.value
    if (chartData.length === 0) return

    chartInstance = new Chart(dailyChartRef.value, {
        type: 'doughnut',
        data: {
            labels: chartData.map(i => i.category),
            datasets: [{
                data: chartData.map(i => i.amount),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    })
}

// 🌟 監聽篩選條件變化 (包含自訂日期變化)
watch([categoryTableData, period, startDate, endDate], () => {
    nextTick(() => renderChart())
}, { deep: true })
</script>

<template>
    <Nav>
        <Chart_Preface />
        <div style="display: flex; min-height: 100vh;">
            <div class="dashboard-container_1" style="flex: 1;">
                <h3>支出分析</h3>
                <span class="date">{{ today }}</span>
                <hr>

                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header chart-description">
                            <span>檢視期間：</span>
                            <select class="my-select" v-model="period">
                                <option value="month">當月</option>
                                <option value="year">當年</option>
                                <option value="custom">自訂</option>
                            </select>
                            <div v-if="period === 'custom'" style="display: inline-block; margin-left: 10px;">
                                <input type="date" v-model="startDate" class="custom-select" />
                                <span style="margin: 0 5px;">～</span>
                                <input type="date" v-model="endDate" class="custom-select" />
                            </div>
                        </div>

                        <div class="chart-wrapper" style="position: relative; height: 350px; width: 100%;">
                            <canvas ref="dailyChartRef"></canvas>
                        </div>

                        <div class="summary">
                            <div>合計：NT${{ totalAmount.toLocaleString() }}</div>
                            <div>平均每天：NT${{ averagePerDay.toLocaleString() }}</div>
                        </div>
                    </div>
                </div>

                <table class="money-table">
                    <thead>
                        <tr><th>排序</th><th>類別</th><th>金額</th><th>比例</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in categoryTableData" :key="row.category">
                            <td>{{ row.id }}</td>
                            <td>{{ row.category }}</td>
                            <td>NT${{ row.amount.toLocaleString() }}</td>
                            <td>{{ row.ratio.toFixed(1) }}%</td>
                        </tr>
                        <tr v-if="categoryTableData.length === 0">
                            <td colspan="4" style="text-align: center; padding: 40px; color: #999;">
                                此期間尚無支出資料 (檢索天數：{{ periodDays }} 天)
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </Nav>
</template>

<style scoped>
@import '../assets/css/dashboard.css';

.PageTurn {
    display: flex;
    justify-content: center;
}

h2 {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
}

.page {
    max-width: 820px;
    margin: 0 auto;
    /* padding: 24px; */
    background: linear-gradient(135deg, rgba(69, 179, 243, 0.05), rgba(161, 187, 243, 0.05));
    padding: 1rem;
    border-radius: 12px;
    /* height: 100vh; */
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
}

.chart-card {
    background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #e5e7eb;
}

.chart-header {
    margin-bottom: 20px;
}

.chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.chart-description {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    height: 350px;
}

/* 文字趨勢_日期的格式 */
.TitleForm {
    font-size: 18px;
    background-color: #779FBF;
    color: white;
    margin: 20px;
    padding: 3px;
    line-height: 30px;
    font-weight: 700;
    letter-spacing: 0.5em;
    text-indent: 1em;
    text-align: center;
}

/* 表格格式 */
.money-table {
    table-layout: fixed;
    text-align: center;
    margin: 20px;
    line-height: 10px;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    width: 100%;
    margin-left: 1px;
}

.money-table th {
    background-color: #779FBF;
    color: white;
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
    padding: 12px 24px;
}

.money-table td {
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
    padding: 12px 24px;
}

/* 最上面（thead 第一列）不要線 */
.money-table thead tr:first-child th {
    border-top: none;
}

/* 最下面（tbody 最後一列）不要線 */
.money-table tbody tr:last-child td {
    border-bottom: none;
}

/* 合計/平均每天統計的樣式 */
.summary {
    width: 100%;
    /* 跟表格同寬 */
    margin: 0 auto;
    /* 整排置中 */
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* 兩欄等寬 */
    text-align: center;
    font-weight: 700;
}

.summary>div {
    padding: 8px 0;
}

.summary>div:first-child {
    border-right: 1px solid #ccc;
    /* 中間那條直線 */
}

.dashboard-container_1 {
    padding: 12px 24px 24px 24px;
    max-width: 1400px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
    min-height: 100vh;
}

/* 下拉選單格式 */
.my-select {
    width: 5em;
    /* 約 3 個中文字 */
    padding: 1px 0px 1px 0px;
    border: 0.5px solid #94a3b8;
    /* 邊框顏色 */
    border-radius: 6px;
    /* 框內背景色 */
    background-color: #ffffff;
    /* 文字設定 */
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
}

.custom-select {
    width: 10em;
    padding: 1px 0px 1px 0px;
    border: 0.5px solid #94a3b8;
    border-radius: 6px;
    background-color: #ffffff;
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    letter-spacing: 0.15em;
    margin-top: 5pt;
}

.custom-select:focus {
    border-color: #94a3b8;
    outline: none;
}
</style>
