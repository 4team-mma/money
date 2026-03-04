<script setup>
import { computed, onMounted } from 'vue'
import { useRecordStore } from '@/stores/useRecordStore'
import { useAccountStore } from '@/stores/useAccountStore'

const recordStore = useRecordStore()
const accountStore = useAccountStore()

// 初始化資料抓取
onMounted(() => {
    // 如果冰箱是空的，就去外面抓一次資料
    if (recordStore.records.length === 0) recordStore.fetchAllRecords()

    // 假設帳戶 Store 有對應的 loadAccounts 方法
    if (accountStore.loadAccounts) accountStore.loadAccounts()
})

const formatNumber = (num) => {
    return num.toLocaleString()
}

/* ========================
   🌟 核心同步邏輯：計算本月數據
   ======================== */
const monthlyStats = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()

    let income = 0
    let expense = 0

    // 掃描冰箱裡所有的紀錄
    recordStore.records.forEach(r => {
        const d = new Date(r.add_date)
        // 過濾：只計算「今年」且「今月」的資料
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
            const amt = parseFloat(r.add_amount || 0)
            // add_type 為 true 是收入，false 是支出
            if (r.add_type === true || r.add_type === 1) {
                income += amt
            } else {
                expense += amt
            }
        }
    })

    return {
        income,
        expense,
        balance: income - expense
    }
})

/* ========================
   🌟 核心同步邏輯：計算淨資產
   ======================== */
const totalNetAssets = computed(() => {
    // 取得所有帳戶的餘額總和
    const accounts = accountStore.accounts || []
    return accounts.reduce((sum, acc) => sum + parseFloat(acc.current_balance || 0), 0)
})

// 與上期相比
const monthlyMOMStats = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const currentDay = now.getDate() // 今天幾號

    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const prevYear = prevMonthDate.getFullYear()
    const prevMonth = prevMonthDate.getMonth()
    const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
    const prevEndDay = Math.min(currentDay, lastDayPrevMonth)

    let currentIncome = 0, currentExpense = 0
    let prevIncome = 0, prevExpense = 0

    recordStore.records.forEach(r => {
        const d = new Date(r.add_date)
        const amt = parseFloat(r.add_amount || 0)

        // 本期：本月 1～今天
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() <= currentDay) {
            if (r.add_type === true || r.add_type === 1) currentIncome += amt
            else currentExpense += amt
        }

        // 上期：上月 1～今天同日
        if (d.getFullYear() === prevYear && d.getMonth() === prevMonth && d.getDate() <= prevEndDay) {
            if (r.add_type === true || r.add_type === 1) prevIncome += amt
            else prevExpense += amt
        }
    })

    // 計算增減文字並加上逗號
    const incomeDiff = currentIncome - prevIncome
    const expenseDiff = currentExpense - prevExpense

    const incomeChangeText = incomeDiff > 0 ? `增加 ${formatNumber(incomeDiff)}`
        : incomeDiff < 0 ? `減少 ${formatNumber(Math.abs(incomeDiff))}`
            : `持平`

    const expenseChangeText = expenseDiff > 0 ? `增加 ${formatNumber(expenseDiff)}`
        : expenseDiff < 0 ? `減少 ${formatNumber(Math.abs(expenseDiff))}`
            : `持平`

    return {
        current: {
            income: currentIncome,
            expense: currentExpense
        },
        previous: {
            income: prevIncome,
            expense: prevExpense
        },
        changeText: {
            income: incomeChangeText,
            expense: expenseChangeText
        }
    }
})

</script>

<template>
    <div class="full-width">
        <h2 style="color: var(--text-primary) ;font-weight:700">圖表分析</h2>

        <div class="PageTurn">
            <div class="btn-group t-btn-group" role="group">
                <RouterLink class="btn btn-outline-primary" to="/Chart" active-class="active">淨資產趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartSecondBalance" active-class="active">收支趨勢
                </RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartThirdExpense" active-class="active">支出分析
                </RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartForthIncome" active-class="active">收入分析
                </RouterLink>
            </div>
        </div>

        <div class="dashboard-page-layout" style="display: flex; min-height: auto;">
            <div class="dashboard-page-layout" style="flex: 1;">
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
                            <div class="amount">NT$ {{ formatNumber(monthlyStats.income) }}</div>
                            <p class="change-text_1">與上期相比，{{ monthlyMOMStats.changeText.income }}</p>
                        </div>
                    </div>

                    <div class="stat-card expenditure-card">
                        <div class="card-header">
                            <span class="card-title">本月支出</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount">NT$ {{ formatNumber(monthlyStats.expense) }}</div>
                            <p class="change-text_1">與上期相比，{{ monthlyMOMStats.changeText.expense }}</p>
                        </div>
                    </div>

                    <div class="stat-card net-card">
                        <div class="card-header">
                            <span class="card-title">本月淨收支</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount balance">NT$ {{ formatNumber(monthlyStats.balance) }}</div>
                        </div>
                    </div>

                    <div class="stat-card net-card">
                        <div class="card-header">
                            <span class="card-title">淨資產</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount balance">NT$ {{ formatNumber(totalNetAssets) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>




<style scoped>
@import '../assets/css/dashboard.css';

.btn-outline-primary{
    border-color: var(--text-primary);
    color:var(--text-primary);  
}

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
    overflow-x: auto;
    /* 接受滾輪 */
    scroll-behavior: smooth;
    /* 滑動更順 */
    padding: 0 clamp(16px, 4vw, 40px);
    scrollbar-width: none;
}

.stat-card {
    flex: 0 0 230px;
    background-color: var(--bg-card);
}

.card-title {
    font-size: 14px;
    font-weight: 500;
    color:var(--text-secondary);
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
    color: var(--text-primary);
    margin-bottom: 4px;
}

.change-text_1 {
    font-size: 11px;
    color: var(--text-secondary);
    margin: 0;
}


.t-btn-group .btn.active {
    background-color: var(--color-primary) !important; /* 原本 #0d6efd */
    color: var(--bg-body) !important; /* 原本 white */
    border-color: var(--color-primary) !important;
}

/* 2. 滑鼠移過去 (Hover) 狀態：顯示白框 */
.t-btn-group .btn:hover {
    background-color: color-mix(in srgb, var(--color-primary), transparent 90%) !important;
    color: var(--color-primary) !important;       
    border: 1px solid var(--color-primary) !important; 
    box-shadow: none !important;
}

.income-card { border-left: 4px solid #3b82f6;}
.expenditure-card   { border-left: 4px solid #ef4444;}
.net-card  { border-left: 4px solid #10b981;}
</style>
