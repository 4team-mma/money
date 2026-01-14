<script setup>
    import { ref } from "vue";

    const props = defineProps({
        selectedDate: String,
        transactions: Array,
    });

    const formatNumber = (num) => num ? num.toLocaleString() : 0;

    const isShow = ref(false);
</script>

<template>
    <!-- 交易詳情 -->
    <div class="details-section">
        <h3 class="details-title">{{ selectedDate || "請選擇日期" }}</h3>

        <div v-if="transactions.length > 0" class="transactions-scroll">
            <div v-for="(t, index) in transactions" :key="index" class="transaction-item" @click="isShow = true">
                <div class="transaction-info">
                    <div class="transaction-icon" :class="t.add_type ? 'income' : 'expense'">
                        <span v-if="t.add_class_icon">{{ t.add_class_icon }}</span>
                        <svg v-else-if="t.add_type" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        </svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                        </svg>
                    </div>
                    <div>
                        <div class="transaction-name">{{ t.add_class }}</div>
                        <div class="transaction-category">
                            {{ t.add_member }}<span v-if="t.add_note"> | {{ t.add_note }}</span>
                        </div>
                    </div>
                    <button v-if="isShow">修改</button>
                    <button v-if="isShow">刪除</button>
                </div>
                <div class="transaction-details">
                    <div class="transaction-amount" :class="{ income: t.add_type }">
                        {{ t.add_type ? '+' : '-' }}NT$ {{ formatNumber(t.add_amount) }}
                    </div>
                    <div class="transaction-account-name">{{ t.account_name }}</div>
                </div>
            </div>
        </div>

        <div v-else-if="selectedDate" class="empty-state">這天沒有交易記錄</div>
        <div v-else class="empty-state">點擊日期查看交易詳情</div>
    </div>
</template>

<style scoped>
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
</style>