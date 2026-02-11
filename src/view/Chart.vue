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
const dailyData = ref([]) // 確保定義，接收後端 daily 欄位
const isLoading = ref(true)

let chartInstance = null

// 當前日期顯示
const today = computed(() => {
    const now = new Date()
    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日・${weekMap[now.getDay()]}`
})

// --- 資料邏輯 ---
const tableData = computed(() => {
    if (period.value === 'month') return monthlyData.value
    if (period.value === 'year') return yearlyData.value
    if (period.value === 'custom') {
        if (!startDate.value || !endDate.value) return []
        
        // 使用字串直接比對 YYYY-MM-DD，最為精準
        const start = startDate.value
        const end = endDate.value

        return dailyData.value
            .filter(row => {
                const d = row.date.split('T')[0] // 處理可能帶有時間的字串
                return d >= start && d <= end
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // 表格：新 -> 舊
    }
    return []
})

// --- 圖表渲染 ---
const renderChart = () => {
    if (!dailyChartRef.value) return
    if (tableData.value.length === 0) {
        if (chartInstance) chartInstance.destroy()
        return
    }
    
    if (chartInstance) chartInstance.destroy()

    let chartData = []
    if (period.value === 'custom') {
        chartData = [...tableData.value].reverse()
    } else {
        chartData = tableData.value.slice(0, 12).reverse()
    }

    const ctx = dailyChartRef.value.getContext('2d')
    
    // --- 🚀 新增：計算漸層色邏輯 ---
    const getGradient = (canvas, chart) => {
        const { ctx, chartArea } = chart;
        if (!chartArea) return null;

        const yScale = chart.scales.y;
        const zeroPixel = yScale.getPixelForValue(0);
        
        // 計算 0 軸在圖表高度中的百分比位置
        let stop = (zeroPixel - chartArea.top) / (chartArea.bottom - chartArea.top);
        // 限制 stop 範圍在 0~1，避免超出畫布範圍報錯
        stop = Math.max(0, Math.min(1, stop));

        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, '#3b82f6');      // 最高點：藍色
        gradient.addColorStop(stop, '#3b82f6');   // 0 軸以上：藍色
        gradient.addColorStop(stop, '#ef4444');   // 0 軸以下：紅色
        gradient.addColorStop(1, '#ef4444');      // 最低點：紅色
        return gradient;
    };

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => d.period),
            datasets: [{
                label: '淨資產',
                data: chartData.map(d => d.net),
                
                // 🌟 線條顏色：使用 Function 呼叫漸層
                borderColor: (context) => {
                    const chart = context.chart;
                    return getGradient(ctx.canvas, chart) || 'black';
                },
                
                // 🌟 填滿顏色：也同步改成淡藍/淡紅漸層
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const yScale = chart.scales.y;
                    const stop = Math.max(0, Math.min(1, (yScale.getPixelForValue(0) - chartArea.top) / (chartArea.bottom - chartArea.top)));
                    
                    const bgGradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    bgGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
                    bgGradient.addColorStop(stop, 'rgba(59, 130, 246, 0.05)');
                    bgGradient.addColorStop(stop, 'rgba(239, 68, 68, 0.05)');
                    bgGradient.addColorStop(1, 'rgba(239, 68, 68, 0.2)');
                    return bgGradient;
                },

                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: chartData.length > 31 ? 0 : 5,
                
                // 🌟 點點顏色：同樣根據正負變色
                pointBackgroundColor: (context) => {
                    const val = context.dataset.data[context.dataIndex];
                    return val >= 0 ? '#3b82f6' : '#ef4444';
                },
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
    responsive: true,
    maintainAspectRatio: false,

    plugins: { 
        legend: { display: false },
        tooltip: { 
            mode: 'index',
            intersect: false,
            callbacks: {
                label: (ctx) =>
                    `NT$${ctx.parsed.y.toLocaleString()}`
            }
        }
    },

    scales: {
        y: { 
            // 保留原本行為：不強制從 0 開始
            beginAtZero: false,

            title: {
                display: true,
                text: '金額（NT$）',
                padding: {
                    bottom: 12
                }
            },

            ticks: { 
                callback: (val) => val.toLocaleString()
            }
        }
    }
}

    })
}

function validateDateRange() {
    if (startDate.value && endDate.value) {
        if (startDate.value > endDate.value) {
            alert("結束日期不能早於起始日期！")
            // 自動把結束日期調整為起始日期
            endDate.value = startDate.value
        }
    }
}

// --- 監聽與生命週期 ---
// 監聽表格資料變化時重新渲染
watch(tableData, async () => {
    await nextTick()
    renderChart()
}, { deep: true })

// 專門監聽自訂日期變動，強制渲染
watch([startDate, endDate], () => {
    if (period.value === 'custom') {
        validateDateRange()
        nextTick(() => renderChart())
    }
})

onMounted(async () => {
    try {
        isLoading.value = true
        const res = await statsApi.getNetWorthTrend()
        
        const data = res.data || res
        monthlyData.value = data.monthly || []
        yearlyData.value = data.yearly || []
        dailyData.value = data.daily || [] // 接收後端每日資料

        // 預設自訂日期的範圍
        const end = new Date()
        const start = new Date()
        start.setMonth(start.getMonth() - 12)
        startDate.value = start.toISOString().split('T')[0]
        endDate.value = end.toISOString().split('T')[0]

        await nextTick()
        renderChart()
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
            <h3 style="color: var(--text-primary);">淨資產趨勢</h3>
            <span class="date">{{ today }}</span>
            <hr>
            <div class="chart-card">
                <div class="chart-header chart-description">
                    <span>檢視期間單位：</span>
                    <select class="my-select" v-model="period">
                        <option value="month">月</option>
                        <option value="year">年</option>
                        <option value="custom">自訂</option>
                    </select>
                    <div v-if="period === 'custom'" style="display: inline-block; margin-left: 10px;">
                        <span>起始日期 </span>
                        <input type="date" v-model="startDate" class="custom-select"/>
                        <span> ～ </span>
                        <span>結束日期 </span>
                        <input type="date" v-model="endDate" class="custom-select"/>
                    </div>
                </div>
                <br>
                <div class="chart-wrapper">
                    <canvas ref="dailyChartRef" style="color: var(--text-primary);"></canvas>
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
                        <td :style="{ color: row.diff > 0 ? '#10b981' : '#ef4444' }">
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

.date{
    color: var(--text-primary);
}

.dashboard-container_1 {
    padding: 12px 24px 24px 24px;
    max-width: 1400px;
    margin: 0 auto;
    background: var(--bg-card);
    min-height: 100vh;
}

.chart-card {
    background: var(--bg-input);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #e5e7eb;
}

.chart-header {
    margin-bottom: 20px;
}

.chart-wrapper {
    position: relative;
    height: 350px;
    width: 100%;
}

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
    table-layout: fixed;
    width: 100%;
    max-width: 1290px;
    margin: 20px;
    font-variant-numeric: tabular-nums;
    width: 100%;
    margin-left: 1px;
    line-height: 30px;
    font-size: 14px;
    border-collapse: collapse;
    text-align: center;
}

.money-table th {
    background-color: #779FBF;
    color: white;
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
}

td{
    color: var(--text-primary);
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

.chart-description {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
}

</style>