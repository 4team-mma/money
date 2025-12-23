<script setup>
import Nav from '@/components/Nav.vue';

// 數值計算
import { ref } from 'vue'
const formatNumber = (num) => {
    return num.toLocaleString()
}

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
// 日期
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
        <h2>圖表分析</h2>
        <!-- 跳頁設定(連結尚未抓) -->
        <div class="turnto">
            <div class="btn-group t-btn-group" role="group" aria-label="Basic outlined example">
                <RouterLink class="btn btn-outline-primary" to="/Add">淨資產趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/Inn">收支趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/Trans">支出分析</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/Trans">收入分析</RouterLink>
            </div>
        </div>
        <!-- overview 小卡 -->
        <div class="dashboard-page-layout" style="display: flex; min-height: 100vh;">
            <!-- 本月收入 -->
            <div class="dashboard-container" style="flex: 1;">
                <div class="overview-grid">
                    <div class="stat-card income-card">
                        <div class="card-header">
                            <span class="card-title">本月收入</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                <polyline points="17 6 23 6 23 12"></polyline>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount">NT$ {{ formatNumber(currentMonth.income) }}</div>
                            <p class="change-text">較上月增加 12.5%</p>
                        </div>
                    </div>
                    <!-- 本月支出 -->
                    <div class="stat-card expense-card">
                        <div class="card-header">
                            <span class="card-title">本月支出</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount">NT$ {{ formatNumber(currentMonth.expense) }}</div>
                            <p class="change-text">較上月減少 8.3%</p>
                        </div>
                    </div>
                    <!-- 本月淨收支 -->
                    <div class="stat-card balance-card">
                        <div class="card-header">
                            <span class="card-title">本月淨收支</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount balance">NT$ {{ formatNumber(currentMonth.balance) }}</div>
                        </div>
                    </div>
                    <!-- 淨資產 -->
                    <div class="stat-card balance-card">
                        <div class="card-header">
                            <span class="card-title">淨資產</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount balance">NT$ {{ formatNumber(currentMonth.balance) }}</div>
                        </div>
                    </div>
                </div>
                <h3>淨資產趨勢</h3>
                <span class="date">{{ today }}</span>
                <!-- 頁面試作 -->
                <!-- 折線圖 -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header">
                            <p class="chart-description">切換年/月/日</p>
                        </div>
                        <div class="chart-wrapper small">
                            <canvas ref="dailyChartRef"></canvas>
                        </div>
                        </div>
                    </div>
                </div>
        </div>









    </Nav>
</template>
<style scoped>
;

@import '../assets/css/dashboard.css';

.turnto {
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

.chart-wrapper.small {
    height: 200px;
}

.chart-wrapper.medium {
    height: 300px;
}
</style>
