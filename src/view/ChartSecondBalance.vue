<script setup>
import Nav from '@/components/Nav.vue';
import Chart_Preface from '@/components/ChartPreface.vue';
import { ref, computed } from 'vue'




// 預設數值
const currentMonth = ref({
    income: 85000,
    expense: 52340,
    balance: 32660
})

const budgets = ref([
    { category: '飲食', spent: 8500, limit: 12000, color: 'color-1' },
    { category: '交通', spent: 3200, limit: 5000, color: 'color-2' },
    { category: '娛樂', spent: 6800, limit: 8000, color: 'color-3' }
])

// 顯示當天日期
const today = computed(() => {
    const now = new Date()

    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const date = now.getDate()

    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
    const week = weekMap[now.getDay()]

    return `${year} 年 ${month} 月 ${date} 日・${week}`
})
// 繪製淨資產分析_折線圖
const dailyChartRef = ref(null)


// 表格連動下拉選單設定
// 下拉選單控制，預設月
const period = ref('month')
// 自訂區間
const startDate = ref(null) // '2025-02-01'
const endDate = ref(null)   // '2025-04-30'

// 月資料
const monthlyData = [
    {
        id: 1,
        date: '2025-05-01',
        period: '2025年5月',
        income: 40000,
        expense: 20456,
        diff: 12532,
        total: 56279
    },
    {
        id: 2,
        date: '2025-04-01',
        period: '2025年4月',
        income: 39000,
        expense: 17428,
        diff: 10532,
        total: 53795
    },
    {
        id: 3,
        date: '2025-03-01',
        period: '2025年3月',
        income: 39000,
        expense: 16488,
        diff: 15342,
        total: 34859
    },
    {
        id: 4,
        date: '2025-02-01',
        period: '2025年2月',
        income: 39000,
        expense: 18778,
        diff: 13532,
        total: 33426
    },
    {
        id: 5,
        date: '2025-01-01',
        period: '2025年1月',
        income: 39000,
        expense: 16468,
        diff: 18532,
        total: 35797
    }
]



// 年資料
const yearlyData = [
    {
        id: 1,
        period: '2025年',
        income: 480000,
        expense: 356000,
        diff: 124000,
        total: 5635830
    },
    {
        id: 2,
        period: '2024年',
        income: 468000,
        expense: 500450,
        diff: -32450,
        total: 5401230
    },
    {
        id: 3,
        period: '2023年',
        income: 495000,
        expense: 449700,
        diff: 45300,
        total: 5723450
    }
]


// 根據 period 切換資料
const tableData = computed(() => {
    if (period.value === 'month') {
        return monthlyData
            .slice() // 避免改到原始資料（好習慣）
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    if (period.value === 'year') {
        return yearlyData
    }

    if (period.value === 'custom') {
        if (!startDate.value || !endDate.value) return []

        const start = new Date(startDate.value)
        const end = new Date(endDate.value)

        return monthlyData
            .filter(row => {
                const rowDate = new Date(row.date)
                return rowDate >= start && rowDate <= end
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date))
    }

    return []
})


</script>
<template>
    <Nav>
        <Chart_Preface />
        <!-- 藍底背景 -->
        <div style="display: flex; min-height: 100vh;">
            <div class="dashboard-container_1" style="flex: 1;">
                <h3>收支趨勢</h3>
                <span class="date">{{ today }}</span>
                <hr>
                <!-- 收支趨勢頁面 -->
                <!-- 收支趨勢_(支出/收入/總收支) -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header chart-description">
                            <!-- 下拉選單 -->
                            <span>檢視期間單位：</span>
                            <select class="my-select" v-model="period">
                                <option value="month">月</option>
                                <option value="year">年</option>
                                <option value="custom">自訂</option>
                            </select>
                            <div v-if="period === 'custom'">
                                <input type="date" v-model="startDate" class="custom-select" />
                                <span style="margin: 0 6px;">～</span>
                                <input type="date" v-model="endDate" class="custom-select" />
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <canvas ref="dailyChartRef"></canvas>
                        </div>
                    </div>
                </div>
                <!-- 收支趨勢_表格 -->
                <table class="money-table">
                    <thead>
                        <tr>
                            <th>期間</th>
                            <th>收入</th>
                            <th>支出</th>
                            <th>期末收支</th>
                            <th>期末淨資產</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in tableData" :key="row.id">
                            <!-- 月份 -->
                            <td>{{ row.period ?? '-' }}</td>

                            <!-- 收入 -->
                            <td>
                                {{ typeof row.income === 'number'
                                    ? 'NT$' + row.income.toLocaleString()
                                    : '-' }}
                            </td>

                            <!-- 支出 -->
                            <td>
                                {{ typeof row.expense === 'number'
                                    ? 'NT$' + row.expense.toLocaleString()
                                    : '-' }}
                            </td>

                            <!-- 本期收支 -->
                            <td>
                                <span v-if="row.diff === null || row.diff === undefined">-</span>
                                <span v-else :style="{ color: row.diff >= 0 ? '#3b82f6' : '#ef4444' }">
                                    {{ row.diff > 0 ? '+' : '' }}{{ row.diff.toLocaleString() }}
                                </span>
                            </td>

                            <!-- 總資產 -->
                            <td>
                                {{ typeof row.total === 'number'
                                    ? 'NT$' + row.total.toLocaleString()
                                    : '-' }}
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
