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


</script>

<template>
    <div class="full-width">
        <!-- <Nav> -->
        <h2>圖表分析</h2>
        <!-- 跳頁設定 -->
        <div class="PageTurn">
            <div class="btn-group t-btn-group" role="group" aria-label="Basic outlined example">
                <RouterLink class="btn btn-outline-primary" to="/Chart">淨資產趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartSecondBalance">收支趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartThirdExpense">支出分析</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartForthIncome">收入分析</RouterLink>
            </div>
        </div>
        <!-- overview 小卡 -->
        <div div class="dashboard-page-layout" style="display: flex" min height:100vh>
            <!-- 本月收入 -->
            <div class=dashboard-page-layout style="flex: 1;">
                <div class="overview-grid_1">
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
                            <p class="change-text_1">較上月增加/減少＿＿%</p>
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
                            <p class="change-text_1">較上月增加/減少＿＿＿%</p>
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
            </div>
        </div>
    </div>


    <!-- </Nav> -->
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



.dashboard-page-layout {
    margin: 13px auto 10px auto;
    /* ← 關鍵 */
    width: 100%;
    max-width: 1400px;
}



.full-width {
    width: 100%;
}

.overview-grid_1 {
    display: flex;
    gap: 16px;
    flex-wrap: nowrap;
    justify-content: flex-start;
    overflow-x: auto;/* 接受滾輪 */
    scroll-behavior: smooth;/* 滑動更順 */
    padding: 0 clamp(16px, 4vw, 40px);
    scrollbar-width: none;
}

.stat-card {
    flex: 0 0 230px;
}

.card-title {
    font-size: 10px;
    font-weight: 500;
    color: #64748b;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.card-content .amount {
    font-size: 20px;
    font-weight: 700;
    color: #000000;
    margin-bottom: 4px;
}

.change-text_1 {
    font-size: 11px;
    color: #64748b;
    margin: 0;
}
</style>
