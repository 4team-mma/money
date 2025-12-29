<script setup>
import Nav from '@/components/Nav.vue';
import Chart_Preface from '@/components/ChartPreface.vue';
import { ref } from 'vue'




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
import { computed } from 'vue'
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



</script>
<template>
    <Nav>
        <Chart_Preface />

        <!-- 藍底背景 -->
        <div style="display: flex; min-height: 100vh;">
            <div class="dashboard-container" style="flex: 1;">
                <h3>收支趨勢</h3>
                <span class="date">{{ today }}</span>
                <hr>
                <!-- 收支趨勢頁面 -->
                <!-- 收支趨勢_(支出/收入/總收支) -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header">
                            <p class="chart-description">切換年/月/期間</p>
                        </div>
                        <div class="chart-wrapper">
                            <canvas ref="dailyChartRef"></canvas>
                        </div>
                    </div>
                </div>
                <!-- 收支趨勢_文字 -->
                <table class="money-table">
                    <thead>
                        <tr>
                            <th>月份</th>
                            <th>收入</th>
                            <th>支出</th>
                            <th>本期收支</th>
                            <th>總資產</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2025年5月</td>
                            <td>NT$40,000</td>
                            <td>NT$20,456</td>
                            <td>+12,532</td>
                            <td>NT$56,279</td>
                        </tr>
                        <tr>
                            <td>2025年4月</td>
                            <td>NT$39,000</td>
                            <td>NT$17,428</td>
                            <td>+10,532</td>
                            <td>NT$53,795</td>
                        </tr>
                        <tr>
                            <td>2025年3月</td>
                            <td>NT$39,000</td>
                            <td>NT$16,488</td>
                            <td>+15,342</td>
                            <td>NT$34,859</td>
                        </tr>
                        <tr>
                            <td>2025年2月</td>
                            <td>NT$39,000</td>
                            <td>NT$18,778</td>
                            <td>+13,532</td>
                            <td>NT$33,426</td>
                        </tr>
                        <tr>
                            <td>2025年1月</td>
                            <td>NT$39,000</td>
                            <td>NT$16,468</td>
                            <td>+18,532</td>
                            <td>NT$35,797</td>
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
    width: 1290px;
    margin: 20px;
    padding: 30px;
    line-height: 60px;
    font-size: 18px;
    font-variant-numeric: tabular-nums;
}

.money-table th {
    background-color: #779FBF;
    color: white;
    line-height: 30px;
    font-size: 18px;
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
}

.money-table td {
    font-size: 20px;
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
</style>
