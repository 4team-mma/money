<script setup>
    import Nav from "@/components/Nav.vue";

    import { Calendar } from "v-calendar";
    import "v-calendar/style.css";
    import { ref, computed } from "vue";

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
    }

    // 初始事件（測試資料）
    const mockTransactions = ref([
        { id: 1, date: "2025-12-05", name: "薪水", amount: 85000.0, type: "income" },
        { id: 2, date: "2025-12-23", name: "健身", amount: -1250.0, type: "expense" },
        { id: 3, date: "2025-12-05", name: "繳費", amount: -1280.0, type: "expense" },
    ]);

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
        return mockTransactions.value.filter((e) => {
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
        const attr = mockTransactions.value.map((e) => ({
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
                    e.type === "income" ? "green" : e.type === "expense" ? "red" : "blue",
            },
            popover: {
                label: `${e.name} NT$ ${formatNumber(e.amount)}`,
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

    const monthlyIncome = computed(() =>
        mockTransactions.value
            .filter((t) => t.type === "income")
            .reduce((sum, t) => sum + t.amount, 0)
    );

    const monthlyExpense = computed(() =>
        Math.abs(
            mockTransactions.value
                .filter((t) => t.type === "expense")
                .reduce((sum, t) => sum + t.amount, 0)
        )
    );

    const monthlyBalance = computed(() =>
        mockTransactions.value.reduce((sum, t) => sum + t.amount, 0)
    );

    const formatNumber = (num) => {
        return num ? num.toLocaleString() : 0
    }
</script>

<template>
    <Nav>
        <h1 class="page-title">行事曆</h1>

        <div class="calendar-page-layout">
            <div class="calendar-grid">
                <!-- 左側：行事曆 -->
                <div class="calendar-section">
                    <Calendar
                        ref="calendar"
                        expanded
                        borderless
                        :masks="{ title: 'YYYY年 MMM', dayPopover: 'YYYY年 MMM DD日, WWW' }"
                        :attributes="calendarAttributes"
                        locale="zh-TW"
                        @dayclick="selectDate"
                    >
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
                    <div
                        v-if="selectedDateTransactions.length > 0"
                        class="transactions-scroll"
                    >
                        <div
                            v-for="(t, i) in selectedDateTransactions"
                            :key="t.id"
                            class="transaction-item"
                        >
                            <span>{{ t.name }}</span>
                            <span :class="{ income: t.amount > 0, expense: t.amount < 0 }">
                                {{ t.amount > 0 ? "+" : "" }}NT$
                                {{ formatNumber(Math.abs(t.amount)) }}
                            </span>
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
                        <div class="summary-label">本月收入</div>
                        <div class="summary-value income">
                            NT$ {{ formatNumber(monthlyIncome) }}
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">本月支出</div>
                        <div class="summary-value expense">
                            NT$ {{ formatNumber(monthlyExpense) }}
                        </div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-label">本月結餘</div>
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
        grid-template-columns: 2fr 1fr; /* 左大右小 */
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
        height: 450px; /* 固定高度 */
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
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
    }

    .transaction-item .income {
        color: #10b981;
    }

    .transaction-item .expense {
        color: #ef4444;
    }

    .empty-state {
        text-align: center;
        color: #94a3b8;
        margin-top: 20px;
    }

    @media (max-width: 1024px) {
        .calendar-grid {
            grid-template-columns: 1fr; /* 手機版改單欄 */
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
</style>
