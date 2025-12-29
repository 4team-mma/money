<script setup>
import Nav from '@/components/Nav.vue';
import Chart_Preface from '@/components/Chart_Preface.vue';
import { ref } from 'vue'


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

        <!-- overview 小卡 -->
        <div style="display: flex; min-height: 100vh;">
            <!-- 本月收入 -->
            <div class="dashboard-container" style="flex: 1;">
                <h3>收入分析</h3>
                <span class="date">{{ today }}</span>
                <hr>
                <!-- 支出分析頁面 -->
                <!-- 支出分析圖表_(圓餅圖支出項目分析) -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header">
                            <p class="chart-description">切換年/月/期間</p>
                        </div>
                        <div class="chart-wrapper">
                            <canvas ref="dailyChartRef"></canvas>
                        </div>
                        <div class="summary">
                            <div>合計：NT$58,000</div>
                            <div>平均每月：NT$53,000</div>
                        </div>
                    </div>
                </div>
                <!-- 支出_文字 -->
                <table class="money-table">
                    <colgroup>
                        <col style="width: 80px;"> <!-- 排序（窄） -->
                        <col style="width: 400px;"> <!-- 類別 -->
                        <col style="width: 400px;"> <!-- 金額 -->
                        <col style="width: auto;"> <!-- 比例（吃剩下的） -->
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

/* 合計/平均每天統計的樣式 */
.summary {
    width: 1290px;
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
</style>
