<script setup>
import { ref, computed, onMounted } from 'vue' // 🌟 修正：補上缺失的引入
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

// 預留預算卡片資料 (目前暫用假資料，未來可串接後端)
const budgets = ref([
    { category: '飲食', spent: 8500, limit: 12000, color: 'color-1' },
    { category: '交通', spent: 3200, limit: 5000, color: 'color-2' },
    { category: '娛樂', spent: 6800, limit: 8000, color: 'color-3' }
])
</script>

<template>
    <div class="full-width">
        <h2>圖表分析</h2>
        
        <div class="PageTurn">
            <div class="btn-group t-btn-group" role="group">
                <RouterLink class="btn btn-outline-primary" to="/Chart">淨資產趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartSecondBalance">收支趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartThirdExpense">支出分析</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/ChartForthIncome">收入分析</RouterLink>
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
                            <p class="change-text_1">數據已與雲端同步</p>
                        </div>
                    </div>

                    <div class="stat-card expense-card">
                        <div class="card-header">
                            <span class="card-title">本月支出</span>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                <polyline points="17 18 23 18 23 12"></polyline>
                            </svg>
                        </div>
                        <div class="card-content">
                            <div class="amount">NT$ {{ formatNumber(monthlyStats.expense) }}</div>
                            <p class="change-text_1">數據已與雲端同步</p>
                        </div>
                    </div>

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
                            <div class="amount balance">NT$ {{ formatNumber(monthlyStats.balance) }}</div>
                        </div>
                    </div>

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
