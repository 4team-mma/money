<script setup>
import Nav from '@/components/Nav.vue';
import Chart_Preface from '@/components/ChartPreface.vue';
import { ref, computed } from 'vue'


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

// 假資料
const rawIncomeData = [
    { id: 1, date: '2025-01-05', category: '薪資收入', amount: 48000 },
    { id: 2, date: '2025-05-10', category: '兼職收入', amount: 8500 },
    { id: 3, date: '2025-05-20', category: '投資利息', amount: 3200 },
    { id: 4, date: '2026-01-01', category: '薪資收入', amount: 52000 },
    { id: 5, date: '2026-01-08', category: '獎金', amount: 12000 },
    { id: 6, date: '2026-01-15', category: '其他收入', amount: 3000 }
]

// 根據 period 切換資料
const filteredExpenseData = computed(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    if (period.value === 'month') {
        const start = new Date(year, month, 1)
        const end = new Date(year, month + 1, 0)
        return rawIncomeData.filter(r => {
            const d = new Date(r.date)
            return d >= start && d <= end
        })
    }

    if (period.value === 'year') {
        const start = new Date(year, 0, 1)
        const end = new Date(year, 11, 31)
        return rawIncomeData.filter(r => {
            const d = new Date(r.date)
            return d >= start && d <= end
        })
    }

    if (period.value === 'custom') {
        if (!startDate.value || !endDate.value) return []
        const start = new Date(startDate.value)
        const end = new Date(endDate.value)
        return rawIncomeData.filter(r => {
            const d = new Date(r.date)
            return d >= start && d <= end
        })
    }

    return []
})

const categoryTableData = computed(() => {
    const map = {}
    let total = 0

    filteredExpenseData.value.forEach(item => {
        if (!map[item.category]) {
            map[item.category] = {
                category: item.category,
                amount: 0
            }
        }
        map[item.category].amount += item.amount
        total += item.amount
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
    return filteredExpenseData.value.reduce(
        (sum, item) => sum + item.amount,
        0
    )
})

// 計算期間等效月數（平均每月用）
const periodMonths = computed(() => {
    if (period.value === 'month') {
        // 當月 → 1 個月（但後面會被擋掉）
        return 1
    }

    if (period.value === 'year') {
        return 12
    }

    if (period.value === 'custom') {
        if (!startDate.value || !endDate.value) return 0

        const start = new Date(startDate.value)
        const end = new Date(endDate.value)

        const diffDays =
            Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1

        // 1 個月 ≈ 30.44 天
        return diffDays / 30.44
    }

    return 0
})

// 平均每月收入（期間需 >= 2 個月）
const averagePerMonth = computed(() => {
    if (periodMonths.value < 2) {
        return null // 前端顯示 "-"
    }

    return Math.round(
        totalAmount.value / periodMonths.value
    )
})




</script>
<template>
    <Nav>
        <Chart_Preface />

        <!-- overview 小卡 -->
        <div style="display: flex; min-height: 100vh;">
            <!-- 本月收入 -->
            <div class="dashboard-container_1" style="flex: 1;">
                <h3>收入分析</h3>
                <span class="date">{{ today }}</span>
                <hr>
                <!-- 支出分析頁面 -->
                <!-- 支出分析圖表_(圓餅圖支出項目分析) -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header chart-description">
                            <!-- 下拉選單 -->
                            <span>檢視期間：</span>
                            <select class="my-select" v-model="period">
                                <option value="month">當月</option>
                                <option value="year">當年</option>
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
                        <div class="summary">
                            <div>合計：NT${{ totalAmount.toLocaleString() }}</div>
                            <div>
                                平均每月：
                                <span v-if="averagePerMonth === null">-</span>
                                <span v-else>
                                    NT${{ averagePerMonth.toLocaleString() }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- 支出_文字 -->
                <table class="money-table">
                    <colgroup>
                        <col style="width: 10%;"> <!-- 排序（窄） -->
                        <col style="width: 45%;"> <!-- 類別 -->
                        <col style="width: 25%;"> <!-- 金額 -->
                        <col style="width: 20%;"> <!-- 比例（吃剩下的） -->
                    </colgroup>
                    <thead>
                        <tr>
                            <th>排序</th>
                            <th>類別</th>
                            <th>金額</th>
                            <th>比例</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>工資</td>
                            <td>NT$8,935</td>
                            <td>21.1%</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>獎金</td>
                            <td>NT$2,680</td>
                            <td>10.3%</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>副業</td>
                            <td>NT$2,000</td>
                            <td>10.0%</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>投資</td>
                            <td>NT$1,292</td>
                            <td>8.2%</td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td>其他</td>
                            <td>NT$700</td>
                            <td>5.2%</td>
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
    /* width: 100%;
    max-width: 1290px; */
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
