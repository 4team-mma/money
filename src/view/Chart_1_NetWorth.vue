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
                <h3>淨資產趨勢</h3>
                <span class="date">{{ today }}</span>
                <hr>
                <!-- 頁面(預設先淨資產) -->
                <!-- 淨資產趨勢_折線圖 -->
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
                <!-- 淨資產趨勢_文字 -->
                <table class="money-table">
                    <thead>
                        <tr>
                            <th>月份</th>
                            <th>本期淨資產</th>
                            <th>淨資產增減(與上月相比)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>2025年5月</td>
                            <td>NT$939,878</td>
                            <td style="color: #3b82f6;">+13,510</td>
                        </tr>
                        <tr>
                            <td>2025年4月</td>
                            <td>NT$926,368</td>
                            <td style="color: #ef4444;">-3,280</td>
                        </tr>
                        <tr>
                            <td>2025年3月</td>
                            <td>NT$929,648</td>
                            <td style="color: #3b82f6;">+16,185</td>
                        </tr>
                        <tr>
                            <td>2025年2月</td>
                            <td>NT$913,463</td>
                            <td style="color: #3b82f6;">+2,890</td>
                        </tr>
                        <tr>
                            <td>2025年1月</td>
                            <td>NT$910,573</td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>


    </Nav>
</template>
<style scoped>
@import '../assets/css/dashboard.css';



h2 {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
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

/* 表格拉寬 */
.money-table {
    table-layout: fixed;
    text-align: center;
    width: 1290px;
    margin: 20px;
    padding: 30px;
    line-height: 60px;
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
