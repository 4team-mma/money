<script setup>
    const props = defineProps({
        year: Number,
        month: Number,
        monthlyIncome: Number,
        monthlyExpenses: Number,
        monthlyBalance: Number,
    });

    const formatNumber = (num) => num ? num.toLocaleString() : 0;
</script>

<template>
    <!-- 月度摘要 -->
    <div class="summary-card">
        <div class="summary-grid">
            <div class="summary-item">
                <div class="summary-label">{{ year }}年{{ month }}月收入</div>
                <div class="summary-value income">NT$ {{ formatNumber(monthlyIncome) }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">{{ year }}年{{ month }}月支出</div>
                <div class="summary-value expense">NT$ {{ formatNumber(monthlyExpenses) }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">{{ year }}年{{ month }}月結餘</div>
                <div class="summary-value balance">NT$ {{ formatNumber(monthlyBalance) }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
</style>