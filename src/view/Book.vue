<script setup>
import "v-calendar/style.css";
import Nav from "@/components/Nav.vue";
import axios from '@/api/interceptors';
import { Calendar } from "v-calendar";
import { ref, computed, onMounted } from "vue";

// 存放從 API 抓回來的「活資料」
const transactions = ref([]);

// 輔助函數：將 API 資料轉換為應用程式格式
const mapApiToAppTransactions = (apiTransactions) => {
    if (!Array.isArray(apiTransactions)) {
        console.error("mapApiToAppTransactions 接收到的不是陣列:", apiTransactions);
        return [];
    }

    return apiTransactions.map(apiItem => {
        return {
            id: apiItem.id, // 欄位名稱對應
            userId: apiItem.user_id,
            date: apiItem.add_date,
            amount: Number(apiItem.add_amount),
            type: apiItem.add_type,
            addClass: apiItem.add_class,
            icon: apiItem.add_class_icon,
            accountId: apiItem.account_id,
            addMember: apiItem.add_member,
            // 確保需要用的欄位都正確對應
        };
    });
};

const fetchTransactions = async () => {
    try {
        const response = await axios.get('/records/');

        // 在賦值前進行資料轉換(假設 response 已經是 API 返回的陣列)
        // 後端現在回傳的是 { success: true, data: [...], pagination: {...} }
        // 所以我們要取 response.data 才是原本的陣列
        const apiData = response.data;

        if (apiData && Array.isArray(apiData)) {
            const mappedData = mapApiToAppTransactions(apiData);
            transactions.value = mappedData;
        } else {
            console.error("API 回傳格式異常:", response);
        }
    } catch (error) {
        console.error("交易記錄 加載失敗:", error);
    }
}

// 修正日期為本地時間 yyyy-mm-dd
const today = new Date()
    .toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
    .replace(/\//g, "-");

const selectedDate = ref(today);

// 用按鈕使行事曆跳轉回今天
const calendar = ref(null);
function moveToday() {
    calendar.value.move(today);
    selectedDate.value = today;
}

onMounted(() => {
    moveToday();
    fetchTransactions();
});

const selectDate = (day) => {
    selectedDate.value = day.date
        .toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        .replace(/\//g, "-");
};

// 選擇日期的事件清單
const selectedDateTransactions = computed(() => {
    return transactions.value.filter((e) => {
        if (e.repeat == undefined) {
            return e.date === selectedDate.value;
        }
        if (e.repeat === "weekly") {
            return (
                new Date(e.date).getDay() === new Date(selectedDate.value).getDay()
            );
        }
        if (e.repeat === "monthly") {
            return (
                new Date(e.date).getDate() === new Date(selectedDate.value).getDate()
            );
        }
        return false;
    });
});

// v-calendar attributes (含重複事件)
const calendarAttributes = computed(() => {
    const attr = transactions.value.map((e) => ({
        dates:
            e.repeat === "weekly"
                ? {
                    repeat: {
                        weekdays:
                            new Date(e.date).getDay() + 1 === 0
                                ? 7
                                : new Date(e.date).getDay() + 1,
                    },
                }
                : e.repeat === "monthly"
                    ? { repeat: { days: new Date(e.date).getDate() } }
                    : new Date(e.date),
        dot: {
            color:
                e.type ? "green" : "red",
        },
        popover: {
            label: `${e.addClass} NT$ ${formatNumber(e.amount)}`,
        },
    }));

    // 當天高亮
    attr.push({
        key: "today",
        dates: today,
        highlight: { color: "orange", fillMode: "outline" },
    });

    return attr;
});

// 輔助函數：檢查日期是否在目標月份
const isSameMonthAndYear = (transactionDate, selectedDate) => {
    const d1 = new Date(transactionDate);
    const d2 = new Date(selectedDate);

    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth();
};

// 計算該月總收入
const monthlyIncome = computed(() =>
    transactions.value
        .filter((t) => {
            // 條件 A: t.type 必須為 true (代表收入)
            const isIncome = t.type === true;
            // 條件 B: 交易日期與當前選中的日期同月同年
            const isInSelectedMonth = isSameMonthAndYear(t.date, selectedDate.value);
            return isIncome && isInSelectedMonth;
        })
        .reduce((sum, t) => sum + t.amount, 0)
);

// 計算該月的總支出
const monthlyExpenses = computed(() =>
    transactions.value
        .filter((t) => {
            // 條件 A: t.type 必須為 false (代表支出)
            const isExpense = t.type === false;
            // 條件 B: 交易日期與當前選中的日期同月同年
            const isInSelectedMonth = isSameMonthAndYear(t.date, selectedDate.value);
            return isExpense && isInSelectedMonth;
        })
        .reduce((sum, t) => sum + t.amount, 0)
);

const monthlyBalance = computed(() => {
    return monthlyIncome.value - monthlyExpenses.value;
});

const formatNumber = (num) => {
    return num ? num.toLocaleString() : 0
}
const isShow = ref(false);
// 用來儲存目前被點選的項目 id


</script>

<template>
    <Nav>
        <h1 class="page-title">行事曆</h1>

        <div class="calendar-page-layout">
            <div class="calendar-grid">
                <!-- 左側：行事曆 -->
                <div class="calendar-section">
                    <Calendar ref="calendar" expanded borderless
                        :masks="{ title: 'YYYY年 MMM', dayPopover: 'YYYY年 MMM DD日, WWW' }"
                        :attributes="calendarAttributes" locale="zh-TW" @dayclick="selectDate">
                        <template #footer>
                            <button class="btn-icon" @click="moveToday">今天</button>
                        </template>
                    </Calendar>
                </div>

                <!-- 右側：交易詳情（可滾動） -->
                <div class="details-section">
                    <h3 class="details-title">
                        {{ selectedDate ? selectedDate : "選擇日期" }}
                    </h3>

                    <div v-if="selectedDateTransactions.length > 0" class="transactions-scroll">
                        <div v-for="(t, index) in selectedDateTransactions" :key="index" class="transaction-item"
                            @click="isShow = true">
                            <div class="transaction-info">
                                <div class="transaction-icon" :class="t.type ? 'income' : 'expense'">
                                    <span v-if="t.icon">{{ t.icon }}</span>
                                    <svg v-else-if="t.type" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                    </svg>
                                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                                    </svg>
                                </div>

                                <div>
                                    <div class="transaction-name">{{ t.addClass }}</div>
                                    <div class="transaction-category">{{ t.addMember }}</div>
                                </div>
                                <button v-if="isShow">修改</button>
                                <button v-if="isShow">刪除</button>
                            </div>
                            <div class="transaction-details">
                                <div class="transaction-amount" :class="{ income: t.type }">
                                    {{ t.type ? '+' : '-' }}NT$ {{ formatNumber(t.amount) }}
                                </div>
                                <div class="transaction-account-name">{{ t.accountId }}現金</div>
                            </div>
                        </div>
                    </div>
                    <div v-else-if="selectedDate" class="empty-state">
                        這天沒有交易記錄
                    </div>
                    <div v-else class="empty-state">點擊日期查看交易詳情</div>
                </div>
            </div>

            <!-- 月度摘要 -->
            <div class="summary-card">
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-label">{{ new Date(selectedDate).getFullYear() }}年{{ new
                            Date(selectedDate).getMonth()+1
                            }}月收入</div>
                        <div class="summary-value income">
                            NT$ {{ formatNumber(monthlyIncome) }}
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">{{ new Date(selectedDate).getFullYear() }}年{{ new
                            Date(selectedDate).getMonth()+1
                            }}月支出</div>
                        <div class="summary-value expense">
                            NT$ {{ formatNumber(monthlyExpenses) }}
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">{{ new Date(selectedDate).getFullYear() }}年{{ new
                            Date(selectedDate).getMonth()+1
                            }}月結餘</div>
                        <div class="summary-value balance">
                            NT$ {{ formatNumber(monthlyBalance) }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Nav>
</template>

<style scoped>
.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.calendar-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    /* 左大右小 */
    gap: 24px;
    margin-bottom: 24px;
}

.calendar-section {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.details-section {
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    height: 450px;
    /* 固定高度 */
}

.details-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
}

.transactions-scroll {
    flex: 1;
    overflow-y: auto;
    padding-right: 8px;
}

.transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: 10px;
    transition: background 0.2s;
}

.transaction-item:hover {
    background: #f8fafc;
}

.transaction-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.transaction-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.transaction-icon.income {
    background: rgba(16, 185, 129, 0.1);
}

.transaction-icon.expense {
    background: rgba(239, 68, 68, 0.1);
}

.transaction-icon svg {
    width: 16px;
    height: 16px;
    stroke-width: 2;
    fill: none;
}

.transaction-icon.income svg {
    stroke: #10b981;
}

.transaction-icon.expense svg {
    stroke: #ef4444;
}

.transaction-name {
    font-size: 14px;
    font-weight: 500;
    color: #1e293b;
}

.transaction-category {
    font-size: 12px;
    color: #94a3b8;
}

.transaction-details {
    text-align: right;
}

.transaction-amount {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.transaction-amount.income {
    color: #10b981;
}

.transaction-account-name {
    font-size: 12px;
    color: #94a3b8;
}

.empty-state {
    text-align: center;
    color: #94a3b8;
    margin-top: 20px;
}

@media (max-width: 1024px) {
    .calendar-grid {
        grid-template-columns: 1fr;
        /* 手機版改單欄 */
    }
}

.btn-icon {
    background: #2563eb;
    color: white;
    padding: 10px 20px;
    border: 0px;
    margin: 1px;
    border-radius: 10px;
    font-weight: 600;
}

.summary-card {
    margin-top: 24px;
    background: #fff;
    padding: 16px;
    border-radius: 12px;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
}

.summary-value.income {
    color: #10b981;
}

.summary-value.expense {
    color: #ef4444;
}

.summary-value.balance {
    color: #0ea5e9;
}

:deep(.vc-day) {
    min-height: 50px;
}

:deep(.vc-title) {
    background: none;
}

:deep(.vc-arrow) {
    background: none;
}

.transaction-item {
    padding: 20px;
    
    cursor: pointer;
}
</style>
