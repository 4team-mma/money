<script setup>
    import Nav from "@/components/Nav.vue";
    import BookCalendarSection from "@/components/BookCalendarSection.vue";
    import BookTransactionDetails from "@/components/BookTransactionDetails.vue";
    import BookSummaryCard from "@/components/BookSummaryCard.vue";
    import api from "@/api";
    import { ref, computed, onMounted, watch } from "vue";
    import { ElMessage } from 'element-plus';
    import { getLocalDate, getLocalDateString } from '@/utils/dateHelper'
    import { triggerMissionAction } from '@/api/gamification';

    const transactions = ref([]);

    // 修正日期為本地時間 yyyy-mm-dd
    const today = getLocalDate();

    const selectedDate = ref(today);
    const year = ref(new Date().getFullYear());
    const month = ref(new Date().getMonth() + 1);
    const monthlyIncome = ref(0);
    const monthlyExpenses = ref(0);
    const monthlyBalance = ref(0);

    // 顯示模式狀態
    const displayMode = ref('day'); // 'day' 或 'month'

    // API 請求函數
    const fetchTransactions = async () => {
        try {
            // 同時抓取一般收支與轉帳紀錄
            const [resRecords, resTransfers] = await Promise.all([
                api.get('/records/calendar/monthly', { params: { year: year.value, month: month.value } }),
                api.get('/transfers/calendar/monthly', { params: { year: year.value, month: month.value } })
            ]);

            if (resRecords.success) {
                // 1. 處理一般收支
                let combinedData = [...resRecords.data];

                // 2. 處理轉帳資料 (將轉帳格式化為與 Record 相似的結構以便顯示)
                if (resTransfers.success) {
                    const formattedTransfers = resTransfers.data.map(t => ({
                        add_id: t.transaction_id,
                        add_date: t.transaction_date,
                        add_amount: t.amount,
                        add_type: 'transfer', // 標記為轉帳
                        add_class: '轉帳',
                        add_class_icon: t.from_account.account_icon || '🔄', 
                        from_account_id: t.from_account.account_id,
                        account_id: t.to_account.account_id,
                        source_account: t.from_account.account_name,
                        account_name: t.to_account.account_name,
                        add_note: t.transaction_note,
                        created_at: t.created_at,
                        currency: t.from_account.currency || 'NT$',
                    }));
                    combinedData = [...combinedData, ...formattedTransfers];
                }

                /** * 🚀 優化點 1：穩定賦值 
                 * 避免 API 回傳微小差異導致整個 transactions 重新觸發所有子組件更新
                 */
                transactions.value = combinedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                
                monthlyIncome.value = resRecords.monthly_income;
                monthlyExpenses.value = resRecords.monthly_expenses;
                monthlyBalance.value = resRecords.monthly_balance;
            }
        } catch (error) {
            console.error("資料加載失敗:", error);
        }
    }

    // 初始化
    onMounted(() => {
        fetchTransactions();
        triggerMissionAction('view_calendar');
    });

    // 當年份或月份改變時，重新抓取 API
    watch([year, month], () => {
        fetchTransactions();
    });

    const selectDate = (day) => {
        selectedDate.value = getLocalDateString(day.date);
        displayMode.value = 'day';
    };

    const selectedDateTransactions = computed(() => {
        if (displayMode.value === 'month') {
            return transactions.value;
        }
        if (selectedDate.value) {
            return transactions.value.filter(e => e.add_date === selectedDate.value);
        }
        return transactions.value.filter(e => e.add_date === today);
    });

    const handleChangeView = (payload) => {
        displayMode.value = payload.mode;
        selectedDate.value = payload.date;
    };

    /** * 🚀 優化點 2：快取日曆屬性 (Calendar Attributes)
     * 這是解決「未知組件更新 42 次」的關鍵。
     * 為每個對象提供穩定的 Key，避免 v-calendar 認為整個陣列都是新的而重新渲染每一天。
     */
    const calendarAttributes = computed(() => {
        const attr = transactions.value.map(e => {
            let color = "red";
            let amount = e.add_amount * 1;
            if (e.add_type === true) color = "green";
            if (e.add_type === 'transfer') color = "blue";

            return {
                key: `trans-${e.add_id}-${e.add_type}`, // 👈 穩定的 Key
                dates: new Date(e.add_date),
                bar: { color: color },
                popover: { 
                    label: `${e.add_class} ${e.currency} ${amount.toLocaleString()}`,
                    visibility: 'hover' // 👈 減少主動重繪
                },
            };
        });
        // 今日高亮標記
        attr.push({ 
            key: "today-marker", 
            dates: today, 
            highlight: { color: "orange", fillMode: "outline" } 
        });
        return attr;
    });

    const updateBookDate = (payload) => {
        year.value = payload.year;
        month.value = payload.month;
        selectedDate.value = null;
    };

    const refreshList = async () => {
        await fetchTransactions();
    }

    const deleteTransaction = async (type, id) => {
        const confirmDelete = window.confirm('確定要刪除這筆交易嗎？此操作無法復原！');
        if (!confirmDelete) return;
        try {
            const path = type === 'transfer' ? `/transfers/${id}` : `/records/${id}`;
            await api.delete(path);
            await fetchTransactions();
            ElMessage.success('刪除成功！');
        } catch (error) {
            ElMessage.error('刪除失敗：' + (error.response?.data?.detail || '連線異常'));
        }
    };
</script>

<template>
    <Nav>
        <h1 class="page-title">行事曆</h1>
        <div class="view-mode-selector">
            <button class="word" :class="{ active: displayMode === 'day' }" @click="displayMode = 'day'">按日顯示</button>
            <button class="word" :class="{ active: displayMode === 'month' }" @click="displayMode = 'month'">按月顯示</button>
        </div>
        <div class="calendar-page-layout">
            <div class="calendar-grid">
                <BookCalendarSection
                    :attributes="calendarAttributes"
                    :today="today" 
                    @select-date="selectDate"
                    @move-today="selectedDate = today"
                    @update-date="updateBookDate"
                    :selectedDate="selectedDate"
                />
                <BookTransactionDetails
                    :selectedDate="selectedDate"
                    :transactions="selectedDateTransactions"
                    :displayMode="displayMode"
                    @deleteTransaction="deleteTransaction"
                    @refreshList="refreshList"
                    @change-view="handleChangeView"
                />
            </div>
            <BookSummaryCard
                :year="year"
                :month="month"
                :monthlyIncome="monthlyIncome"
                :monthlyExpenses="monthlyExpenses"
                :monthlyBalance="monthlyBalance"
            />
        </div>
    </Nav>
</template>

<style scoped>
    /* 🚀 優化點 4：強制 GPU 渲染 */
    /* 告訴 macOS 的 WindowServer，日曆格子這塊不要用 CPU 精算，直接丟給顯卡，降低 CPU 負載。 */
    .calendar-grid :deep(.vc-pane-container),
    .calendar-grid :deep(.vc-day) {
        transform: translateZ(0);
        will-change: transform;
        backface-visibility: hidden;
    }

    .page-title {
        font-size: 32px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 8px 0;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 24px;
    }

    @media (max-width: 1024px) {
        .calendar-grid {
            grid-template-columns: 1fr;
        }
    }

    .view-mode-selector {
        display: flex;
        gap: 0;
        margin-bottom: 20px;
        background: var(--bg-input);
        padding: 4px;
        border-radius: 8px;
        width: fit-content;
    }

    .view-mode-selector button {
        padding: 6px 16px;
        border-radius: 6px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        color: #64748b;
        transition: all 0.2s;
    }

    .view-mode-selector button.active {
        background: var(--bg-card);
        color: var(--text-primary);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
</style>