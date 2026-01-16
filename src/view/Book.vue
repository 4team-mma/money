<script setup>
    import Nav from "@/components/Nav.vue";
    import BookCalendarSection from "@/components/BookCalendarSection.vue";
    import BookTransactionDetails from "@/components/BookTransactionDetails.vue";
    import BookSummaryCard from "@/components/BookSummaryCard.vue";
    import api from "@/api";
    import { ref, computed, onMounted, watch } from "vue";
    import { ElMessage } from 'element-plus';

    const transactions = ref([]);

    // 修正日期為本地時間 yyyy-mm-dd
    const today = new Date()
        .toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
        .replace(/\//g, "-");

    const selectedDate = ref(today);
    const year = ref(new Date().getFullYear());
    const month = ref(new Date().getMonth() + 1);
    const monthlyIncome = ref(0);
    const monthlyExpenses = ref(0);
    const monthlyBalance = ref(0);

    // API 請求函數
    const fetchTransactions = async () => {
        try {
            // 呼叫 FastAPI 接口，傳遞 year 與 month 參數
            const response = await api.get('/records/calendar/monthly', {
                params: {
                    year: year.value,
                    month: month.value
                }
            });

            if (response.success) {
                transactions.value = response.data;
                monthlyIncome.value = response.monthly_income;
                monthlyExpenses.value = response.monthly_expenses;
                monthlyBalance.value = response.monthly_balance;
            }
        } catch (error) {
            console.error("交易記錄 加載失敗:", error);
        }
    }

    // 初始化
    onMounted(() => {
        fetchTransactions();
    });

    // 當年份或月份改變時，重新抓取 API
    watch([year, month], () => {
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
    const selectedDateTransactions = computed(() => transactions.value.filter(e => e.add_date === selectedDate.value));

    // v-calendar attributes (含重複事件)
    const calendarAttributes = computed(() => {
        const attr = transactions.value.map(e => ({
            dates: new Date(e.add_date),
            bar: { color: e.add_type ? "green" : "red" },
            popover: { label: `${e.add_class} NT$ ${e.add_amount.toLocaleString()}` },
        }));
        attr.push({ key: "today", dates: today, highlight: { color: "orange", fillMode: "outline" } });
        return attr;
    });

    // 接收來自 BookCalendarSection 的資料並更新
    const updateBookDate = (payload) => {
        year.value = payload.year;
        month.value = payload.month;
        selectedDate.value = null;
    };

    const refreshList = async () => {
        await fetchTransactions();
    }

    /**
     * 刪除資料
     */
    const deleteTransaction = async (id) => {
        const confirmDelete = window.confirm('確定要刪除這筆交易嗎？此操作無法復原！');
        if (!confirmDelete) return;
        try {
            await api.delete(`/records/${id}`);
            // 刪除成功後重新載入搜尋結果
            await fetchTransactions();
            ElMessage.success('刪除成功！');
        } catch (error) {
            ElMessage.error('刪除失敗：' + (err.response?.data?.detail || '連線異常'));
        }
    };
</script>

<template>
    <Nav>
        <h1 class="page-title">行事曆</h1>
        <div class="calendar-page-layout">
            <div class="calendar-grid">
                <BookCalendarSection
                    :key="transactions.length"
                    :attributes="calendarAttributes"
                    :today="today" @select-date="selectDate"
                    @move-today="selectedDate = today"
                    @update-date="updateBookDate"
                    :selectedDate="selectedDate"
                />
                <BookTransactionDetails
                    :selectedDate="selectedDate"
                    :transactions="selectedDateTransactions"
                    @deleteTransaction="deleteTransaction"
                    @refreshList="refreshList"
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
    .page-title {
        font-size: 32px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 8px 0;
    }

    .calendar-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* 左右等寬 */
        gap: 24px;
        margin-bottom: 24px;
    }

    @media (max-width: 1024px) {
        .calendar-grid {
            grid-template-columns: 1fr; /* 手機版改單欄 */
        }
    }
</style>
