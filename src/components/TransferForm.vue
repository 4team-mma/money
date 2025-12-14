<script setup>
import { ref } from 'vue'

const amount = ref('')
const account = ref('main')
const fromAccount = ref('main')
const date = ref(new Date().toISOString().split('T')[0])
const note = ref('')

const handleSubmit = () => {
    console.log('transfer submit', {
        amount: amount.value,
        fromAccount: fromAccount.value,
        account: account.value,
        date: date.value,
        note: note.value
    })
}
</script>

<template>
    <form @submit.prevent="handleSubmit" class="transaction-form">
        <!-- 轉帳金額 -->
        <div class="form-group">
            <label>轉帳金額</label>
            <div class="amount-input-wrapper">
                <span class="currency">NT$</span>
                <input v-model="amount" type="number" placeholder="0" class="amount-input" required />
            </div>
        </div>

        <!-- 從帳戶 -->
        <div class="form-group">
            <label>從帳戶</label>
            <select v-model="fromAccount" class="select-input">
                <option value="main">🏦 主要帳戶</option>
                <option value="cash">💵 現金</option>
                <option value="credit">💳 信用卡</option>
            </select>
        </div>

        <!-- 到帳戶 -->
        <div class="form-group">
            <label>到帳戶</label>
            <select v-model="account" class="select-input">
                <option value="main">🏦 主要帳戶</option>
                <option value="cash">💵 現金</option>
                <option value="credit">💳 信用卡</option>
            </select>
        </div>

        <!-- 日期 -->
        <div class="form-group">
            <label>交易日期</label>
            <input v-model="date" type="date" class="date-input" />
        </div>
        照片:
        <input type="file">
        <p></p>
        <!-- 備註 -->
        <div class="form-group">
            <label>備註</label>
            <textarea v-model="note" rows="3" class="textarea-input"></textarea>
        </div>

        <!-- 按鈕 -->
        <div class="form-actions">
            <button type="submit" class="submit-button">
                ✓ 儲存轉帳
            </button>
            <button type="submit" class="submit-button">
                ✓ 再記一筆
            </button>
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
