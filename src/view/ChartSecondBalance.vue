<script setup>
import { ref, computed, onMounted, watch, shallowRef, nextTick } from 'vue'
import { statsApi } from '@/api/stats'
import Chart from 'chart.js/auto'
import Nav from '@/components/Nav.vue'
import Chart_Preface from '@/components/ChartPreface.vue'

const dailyChartRef = ref(null)
const chartInstance = shallowRef(null)

// 狀態管理
const rawTrendData = ref([]) 
const is_loading = ref(false)

const period = ref('month')
// 🌟 預設日期初始化 (與支出圖表一致)
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const loadData = async () => {
    is_loading.value = true
    try {
        const params = {
            start_date: startDate.value,
            end_date: endDate.value
        }
        // 呼叫 API
        const data = await statsApi.getCashFlowTrend(params)
        rawTrendData.value = data 
        
        await nextTick()
        renderChart()
    } catch (error) {
        console.error("趨勢資料讀取失敗:", error)
    } finally {
        is_loading.value = false
    }
}

onMounted(() => loadData())

const renderChart = () => {
    if (!dailyChartRef.value) return
    if (chartInstance.value) chartInstance.value.destroy()

    const chartData = rawTrendData.value
    if (chartData.length === 0) return

    const ctx = dailyChartRef.value.getContext('2d')
    chartInstance.value = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.date),
            datasets: [
                {
                    label: '收入',
                    data: chartData.map(d => d.income),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: '支出',
                    data: chartData.map(d => d.expense),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
    })
}

// 🌟 日期監聽邏輯 (與支出圖表同步)
watch([period, startDate, endDate], () => {
    if (period.value === 'month') {
        startDate.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
        endDate.value = new Date().toISOString().split('T')[0]
    } else if (period.value === 'year') {
        startDate.value = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
        endDate.value = new Date().toISOString().split('T')[0]
    }
    loadData()
})

const today = computed(() => {
    const now = new Date()
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`
})
</script>

<template>
    <Nav>
        <Chart_Preface />
        <div class="dashboard-container_1">
            <h3>收支趨勢</h3>
            <span class="date">{{ today }}</span>
            <hr>
            <div class="chart-card">
                <div class="chart-header">
                    <span>檢視期間：</span>
                    <select class="my-select" v-model="period">
                        <option value="month">當月趨勢</option>
                        <option value="year">當年趨勢</option>
                        <option value="custom">自訂區間</option>
                    </select>
                    <div v-if="period === 'custom'" style="display: inline-block; margin-left: 10px;">
                        <input type="date" v-model="startDate" class="custom-select" />
                        <span> ～ </span>
                        <input type="date" v-model="endDate" class="custom-select" />
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas ref="dailyChartRef"></canvas>
                </div>
            </div>

            <table class="money-table">
                <thead>
                    <tr><th>期間</th><th>收入</th><th>支出</th><th>淨額</th></tr>
                </thead>
                <tbody>
                    <tr v-for="row in rawTrendData" :key="row.date">
                        <td>{{ row.date }}</td>
                        <td style="color: #3b82f6;">NT${{ row.income.toLocaleString() }}</td>
                        <td style="color: #ef4444;">NT${{ row.expense.toLocaleString() }}</td>
                        <td :style="{ color: row.net >= 0 ? '#10b981' : '#ef4444' }">
                            {{ row.net > 0 ? '+' : '' }}{{ row.net.toLocaleString() }}
                        </td>
                    </tr>
                </tbody>
            </table>
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
    grid-template-columns: repeat(auto-fit, minmax(120x, 1fr));
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
    width: 100%;
    max-width: 1290px;
    margin: 20px;
    padding: 30px;
    font-variant-numeric: tabular-nums;
    width: 100%;
    margin-left: 1px;
    line-height: 30px;
    font-size: 14px;
}

.money-table th {
    background-color: #779FBF;
    color: white;
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
}

.money-table td {
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
}

/* 最上面（thead 第一列）不要線 */
.money-table thead tr:first-child th {
    border-top: none;
}

/* 最下面（tbody 最後一列）不要線 */
.money-table tbody tr:last-child td {
    border-bottom: none;
}

.dashboard-container_1 {
    padding: 12px 24px 24px 24px;
    max-width: 1400px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
    min-height: 100vh;
}
</style>
