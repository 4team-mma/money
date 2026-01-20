<script setup>
import { computed, onMounted } from 'vue'
import { useAccountStore } from '@/stores/useAccountStore'
import { useAddRecord } from '@/composables/useAddRecord'

// 1. 使用 Pinia 拿資料庫的帳戶
const accountStore = useAccountStore()

// 2. 使用你的 Composable (傳入 'transfer' 模式)
const { form, handleSave, handleSaveNext } = useAddRecord('transfer')

onMounted(() => {
    accountStore.loadAccounts() // 確保帳戶資料已從 API 載入
})

// --- 核心過濾邏輯 ---

// 轉出帳戶選單：過濾掉「轉入帳戶」選中的 ID
const availableFromAccounts = computed(() => {
    const toId = form.account?.account_id
    return accountStore.accounts.filter(acc => acc.account_id !== toId)
})

// 轉入帳戶選單：過濾掉「轉出帳戶」選中的 ID
const availableToAccounts = computed(() => {
    const fromId = form.source_account?.account_id
    return accountStore.accounts.filter(acc => acc.account_id !== fromId)
})
</script>

<template>
    <form @submit.prevent="handleSave" class="transaction-form">
        <div class="form-group">
            <label>轉帳金額</label>
            <div class="amount-input-wrapper">
                <span class="currency">NT$</span>
                <input v-model.number="form.add_amount" type="number" placeholder="0" class="amount-input" required />
            </div>
        </div>

        <div class="form-group">
            <label>從帳戶</label>
            <select v-model="form.source_account" class="select-input" required>
                <option :value="null" disabled>請選擇轉出帳戶</option>
                <option v-for="acc in availableFromAccounts" :key="acc.account_id" :value="acc">
                    {{ acc.icon }} {{ acc.itemName }}
                </option>
            </select>
        </div>

        <div class="form-group">
            <label>到帳戶</label>
            <select v-model="form.account" class="select-input" required>
                <option :value="null" disabled>請選擇轉入帳戶</option>
                <option v-for="acc in availableToAccounts" :key="acc.account_id" :value="acc">
                    {{ acc.icon }} {{ acc.itemName }}
                </option>
            </select>
        </div>

        <div class="form-group">
            <label>交易日期</label>
            <input v-model="form.add_date" type="date" class="date-input" />
        </div>

        <div class="form-group">
            <label>備註</label>
            <textarea v-model="form.add_note" rows="3" class="textarea-input"></textarea>
        </div>

        <div class="form-actions">
            <button type="submit" class="submit-button">✓ 儲存轉帳</button>
            <button type="button" @click="handleSaveNext" class="submit-button secondary">✓ 再記一筆</button>
        </div>
    </form>
</template>

<style scoped>
form.transaction-form {
    max-width: 400px;
    margin: 0 auto;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
