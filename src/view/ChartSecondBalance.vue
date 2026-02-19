<script setup>
import { ref, computed, onMounted, watch, shallowRef, nextTick } from 'vue'
import { statsApi } from '@/api/stats'
import Chart from 'chart.js/auto'
import Nav from '@/components/Nav.vue'
import Chart_Preface from '@/components/ChartPreface.vue'
import { getLocalDate, getLocalDateString } from '@/utils/dateHelper'
import { triggerMissionAction } from '@/api/gamification';
const dailyChartRef = ref(null)
const chartInstance = shallowRef(null)

// 狀態管理
const rawTrendData = ref([])
const is_loading = ref(false)

const period = ref('month')
// 初始化日期 (使用本地時間)
const now = new Date();
const startDate = ref(getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)));
const endDate = ref(getLocalDate());

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

onMounted(() => {
    const now = new Date()

    // 預設：月（最近 1 年）
    startDate.value = getLocalDateString(new Date(now.getFullYear(), now.getMonth() - 11, 1))
    endDate.value = getLocalDate()
    loadData()
    triggerMissionAction('view_trends');
})

const baseTrendData = computed(() => {
    // === 月：逐月匯總（最近 12 個月） ===
    if (period.value === 'month') {
        const map = {}

        rawTrendData.value.forEach(d => {
            const date = new Date(d.date)
            const key = `${date.getFullYear()}-${date.getMonth()}`

            if (!map[key]) {
                map[key] = {
                    year: date.getFullYear(),
                    month: date.getMonth(), // 0-based，方便排序
                    date: `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`,
                    income: 0,
                    expense: 0,
                    net: 0
                }
            }

            map[key].income += d.income
            map[key].expense += d.expense
            map[key].net = map[key].income - map[key].expense
        })

        return Object.values(map)
            .sort((a, b) =>
                a.year !== b.year ? a.year - b.year : a.month - b.month
            )
            .slice(-12)
    }

    // === 年：逐年匯總 ===
    if (period.value === 'year') {
        const map = {}

        rawTrendData.value.forEach(d => {
            const year = new Date(d.date).getFullYear()

            if (!map[year]) {
                map[year] = {
                    date: `${year}年`,
                    income: 0,
                    expense: 0,
                    net: 0
                }
            }

            map[year].income += d.income
            map[year].expense += d.expense
            map[year].net = map[year].income - map[year].expense
        })

        return Object.values(map).sort((a, b) =>
            parseInt(a.date) - parseInt(b.date)
        )
    }

    // === 自訂日期：逐日 ===
    return rawTrendData.value.map(d => ({
        ...d,
        net: d.income - d.expense
    }))
})

const legendSpacingPlugin = {
    id: 'legendSpacing',
    beforeInit(chart) {
        const fitValue = chart.legend.fit;
        chart.legend.fit = function fit() {
            fitValue.bind(chart.legend)();
            this.height += 20; // ⭐ 控制圖例和圖表的距離
        };
    }
};


// 圖
const renderChart = () => {
    if (!dailyChartRef.value) return

    const chartData = baseTrendData.value
    if (!chartData || chartData.length === 0) return

    // 銷毀舊的 instance
    if (chartInstance.value) chartInstance.value.destroy()
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

            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        padding: 20
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: (ctx) =>
                            `${ctx.dataset.label}：NT$${ctx.parsed.y.toLocaleString()}`
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: '金額（NT$）',
                        padding: {
                            bottom: 20
                        }
                    },
                    ticks: {
                        callback: (value) => value.toLocaleString()
                    }
                }
            }
        },
        plugins: [legendSpacingPlugin]
    })
}

// 表
const tableTrendData = computed(() => {
    return [...baseTrendData.value].reverse()
})

function validateDateRange() {
    if (startDate.value && endDate.value) {
        if (startDate.value > endDate.value) {
            alert("結束日期不能早於起始日期！")
            // 自動把結束日期調整為起始日期
            endDate.value = startDate.value
        }
    }
}

// 🌟 保留自訂區間監聽
watch([startDate, endDate], () => {
    if (period.value === 'custom') {
        validateDateRange()
        nextTick(() => renderChart())
    }
    loadData()
})


// 🌟 新增簡化的 period 監聽，用於月/年切換表格 & 圖表
watch(period, async () => {
    await nextTick()
    renderChart()
})

// 當前日期顯示
const today = computed(() => {
    const now = new Date()
    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日・${weekMap[now.getDay()]}`
})

</script>

<template>
    <Nav>
        <Chart_Preface />
        <div class="dashboard-container_1">
            <h3 style="color: var(--text-primary);">收支趨勢</h3>
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
                        <input type="date" v-model="startDate" class="custom-select" />
                        <span> ～ </span>
                        <span>結束日期 </span>
                        <input type="date" v-model="endDate" class="custom-select" />
                    </div>
                </div>
                <div class="chart-wrapper">
                    <canvas ref="dailyChartRef"></canvas>
                </div>
            </div>

            <table class="money-table">
                <thead>
                    <tr>
                        <th>期間</th>
                        <th>收入</th>
                        <th>支出</th>
                        <th>淨額</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in tableTrendData" :key="row.date">
                        <td>{{ row.date }}</td>
                        <td>NT${{ row.income.toLocaleString() }}</td>
                        <td>NT${{ row.expense.toLocaleString() }}</td>
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

.chart-card {
    background: var(--bg-input);
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

/* 表格格式 */
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

th{
    color: var(--text-primary);
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


/* 1. 調整「期間」：讓它往右移一點，不要貼齊左邊緣 */
.money-table td:first-child,
.money-table th:first-child {
    padding: 0px 50px;
    /* 增加左側內距，把文字往右推 */
}

/* 2. 調整「淨額」：讓它往右邊緣靠近（減少右側留白） */
.money-table td:last-child,
.money-table th:last-child {
    padding: 0px 40px;
    /* 減少右側內距，讓它更靠近邊界 */
    /* 淨額的顏色（綠色/紅色）通常直接寫在 HTML 的 style 裡，所以這裡不寫死顏色 */
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
    background: var(--bg-card);
    min-height: 100vh;
}

.date{
    color: var(--text-primary);
}
</style>
