<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRecordStore } from '@/stores/useRecordStore'
import { calculateCategoryData, calculatePeriodDays } from '@/utils/financeHelper' // 🌟 引入工具函數
import Chart from 'chart.js/auto'
import Nav from '@/components/Nav.vue'
import Chart_Preface from '@/components/ChartPreface.vue'

const recordStore = useRecordStore()
const dailyChartRef = ref(null)
let chartInstance = null

const period = ref('month')
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

// 🌟 核心：根據篩選條件動態從後端抓取
const loadData = async () => {
    const params = { page_size: 500 } // 設定安全上限
    if (period.value === 'month') {
        params.year = new Date().getFullYear()
        params.month = new Date().getMonth() + 1
    } else if (period.value === 'year') {
        params.year = new Date().getFullYear()
    }
    
    await recordStore.fetchRecords(params)
    renderChart()
}

onMounted(() => loadData())

// 🌟 使用 Utils 進行計算
const categoryTableData = computed(() => 
    calculateCategoryData(recordStore.records, period.value, startDate.value, endDate.value)
)

const periodDays = computed(() => calculatePeriodDays(period.value, startDate.value, endDate.value))

const totalAmount = computed(() => categoryTableData.value.reduce((sum, i) => sum + i.amount, 0))
const averagePerDay = computed(() => totalAmount.value > 0 ? Math.round(totalAmount.value / periodDays.value) : 0)

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
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    })
}

watch([period, startDate, endDate], () => loadData())

const today = computed(() => {
    const now = new Date();
    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日・${weekMap[now.getDay()]}`;
})
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
                            <td colspan="4" style="text-align: center; padding: 40px; color: #999;">此期間尚無支出資料</td>
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
