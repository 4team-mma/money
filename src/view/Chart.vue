<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Nav from '@/components/Nav.vue'
import Chart_Preface from '@/components/ChartPreface.vue'
import { statsApi } from '@/api/stats'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

// --- 狀態定義 ---
const dailyChartRef = ref(null)
const period = ref('month')
const startDate = ref(null) 
const endDate = ref(null) 
const monthlyData = ref([]) 
const yearlyData = ref([])  
const isLoading = ref(true)
let chartInstance = null

// 當前日期顯示
const today = computed(() => {
    const now = new Date()
    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日・${weekMap[now.getDay()]}`
})

// --- 資料邏輯 (必須放在 watch 之前) ---
const tableData = computed(() => {
    if (period.value === 'month') return monthlyData.value
    if (period.value === 'year') return yearlyData.value
    if (period.value === 'custom') {
        if (!startDate.value || !endDate.value) return []
        const start = new Date(startDate.value)
        const end = new Date(endDate.value)
        return monthlyData.value
            .filter(row => {
                const d = new Date(row.date)
                return d >= start && d <= end
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }
    return []
})

// --- 圖表渲染 ---
const renderChart = () => {
    if (!dailyChartRef.value || tableData.value.length === 0) {
        if (chartInstance) chartInstance.destroy()
        return
    }
    
    if (chartInstance) chartInstance.destroy()

    // --- 修改這部分 ---
    // 1. 從 tableData (新->舊) 中先切出前 12 筆最新的資料
    // 2. 使用 reverse() 將其轉為 (舊->新) 以符合圖表時間軸
    const chartData = tableData.value.slice(0, 12).reverse()
    // ----------------

    const ctx = dailyChartRef.value.getContext('2d')
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.period),
            datasets: [{
                label: '淨資產',
                data: chartData.map(d => d.net),
                borderColor: '#779FBF',
                backgroundColor: 'rgba(119, 159, 191, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#779FBF'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                // 增加提示框，標註當前點的數值
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: { 
                    ticks: { callback: (val) => 'NT$' + val.toLocaleString() } 
                }
            }
        }
    })
}

// --- 監聽與生命週期 ---
watch(tableData, async () => {
    await nextTick()
    renderChart()
}, { deep: true })

onMounted(async () => {
    try {
        isLoading.value = true
        // 建議：之後可改從 Pinia 或 LocalStorage 獲取真實 userId
        const res = await statsApi.getNetWorthTrend()
        const data = res.data || res
        monthlyData.value = data.monthly || []
        yearlyData.value = data.yearly || []
    } catch (error) {
        console.error("獲取淨資產歷史失敗:", error)
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <Nav>
        <Chart_Preface />
        <div class="dashboard-container_1">
            <h3>淨資產趨勢</h3>
            <span class="date">{{ today }}</span>
            <hr>
            
            <div class="chart-card">
                <div class="chart-header">
                    <span class="label-text">檢視期間單位：</span>
                    <select class="my-select" v-model="period">
                        <option value="month">月</option>
                        <option value="year">年</option>
                        <option value="custom">自訂</option>
                    </select>
                    <div v-if="period === 'custom'" class="custom-date-group">
                        <input type="date" v-model="startDate" class="custom-input"/>
                        <span class="separator">～</span>
                        <input type="date" v-model="endDate" class="custom-input"/>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas ref="dailyChartRef"></canvas>
                    <div v-if="isLoading" class="loading-overlay">數據加載中...</div>
                </div>
            </div>

            <table class="money-table">
                <thead>
                    <tr>
                        <th>時間範圍</th>
                        <th>期末淨資產</th>
                        <th>淨資產增減</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="isLoading"><td colspan="3">正在連線至伺服器...</td></tr>
                    <tr v-else-if="tableData.length === 0"><td colspan="3">尚無該期間的資料</td></tr>
                    <tr v-for="row in tableData" :key="row.id">
                        <td>{{ row.period }}</td>
                        <td>NT${{ row.net?.toLocaleString() }}</td>
                        <td :style="{ color: row.diff > 0 ? '#3b82f6' : '#ef4444' }">
                            {{ row.diff > 0 ? '+' : '' }}{{ row.diff?.toLocaleString() }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </Nav>
</template>

<style scoped>
@import '../assets/css/dashboard.css';

.dashboard-container_1 {
    padding: 24px;
    max-width: 1300px;
    margin: 0 auto;
    min-height: 100vh;
}

.chart-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #e5e7eb;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.chart-header {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: #64748b;
}

.chart-wrapper {
    position: relative;
    height: 350px;
    width: 100%;
}

.my-select, .custom-input {
    padding: 4px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #475569;
}

.loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, 0.7);
    color: #94a3b8;
}

.money-table {
    width: 100%;
    border-collapse: collapse;
    text-align: center;
}

.money-table th {
    background-color: #779FBF;
    color: white;
    padding: 12px;
}

.money-table td {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
}
</style>