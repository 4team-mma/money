<script setup>
import Nav from '@/components/Nav.vue'
import Add_bar from '@/components/AddBar.vue'
import Add_cato_inn from '@/components/AddCatoInn.vue'
import Add_account from '@/components/AddAccount.vue'
import Add_member from '@/components/AddMember.vue'
import Add_tag from '@/components/AddTag.vue'
import { useAddRecord } from '@/composables/useAddRecord'
import { onMounted } from 'vue';
import { useAccountStore } from '@/stores/useAccountStore'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import {computed} from 'vue'

// 🌟 修正：傳入 true 代表收入模式
const { 
    form, handleCatoUpdate, handleAccountUpdate,
    handleMemberUpdate, handleTagUpdate, handleSave, 
    handleSaveNext,currentCurrency 
} = useAddRecord(true)

const accountStore = useAccountStore()
onMounted(async () => {
    await accountStore.loadAccounts()
    
    // 🌟 補回自動預設值：預設選第一個帳戶
    if (accountStore.accounts.length > 0) {
        handleAccountUpdate(accountStore.accounts[0])
    }

    if (window.history.state?.date) {
        form.add_date = window.history.state?.date;
    }
})
const now_money = computed(()=>{
    return accountStore.formatAccountBalance(form.account)
})
</script>

<template>
    <Nav>
        <div class="page">
            <Add_bar />

            <div class="card">
                <div class="header">
                    <h2>新增收入</h2>
                    <DatePicker v-model="form.add_date" mode="date" :popover="{ visibility: 'click' }" :transition="'none'" :masks="{ title: 'YYYY年 MMM' }">
                        <template #default="{ togglePopover, inputValue, inputEvents }">
                            <div class="date-input-container">
                                <button type="button" @click="togglePopover" style="border:0; cursor:pointer">🗓</button>
                                <input :value="inputValue || ''" v-on="inputEvents" readonly class="date-display-input" />
                            </div>
                        </template>
                    </DatePicker>
                </div>

                <div class="form-group">
                    <label>收入金額</label>
                    <input v-model.number="form.add_amount" type="number" :placeholder="`${currentCurrency}`"
                    class="amount-input" />
                </div>

                <div class="grid">
                    <div class="form-group">
                        <label>收入類別</label>
                        <Add_cato_inn @update:model-value="handleCatoUpdate" />
                        <div class="change-text">-可自定義類別-</div>
                    </div>

                    <div class="form-group">
                        <label>帳戶</label>
                        <Add_account v-model:account="form.account" @update:model-value="handleAccountUpdate" />
                        <div class="change-text">餘額 : {{ now_money }}</div>
                    </div>

                    <div class="form-group">
                        <label>成員</label>
                        <Add_member @update:model-value="handleMemberUpdate" />
                    </div>

                    <div class="form-group">
                        <label>標籤</label>
                        <Add_tag @update:model-value="handleTagUpdate" />
                    </div>
                </div>

                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>備註: ({{ form.add_note.length }}/500)</label>
                    </div>
                    <textarea v-model="form.add_note" placeholder="補充說明（選填）"></textarea>
                </div>

                <div class="actions">
                    <button @click="handleSave" class="btn-primary">儲存收入</button>
                    <button @click="handleSaveNext" class="btn-secondary">再記一筆</button>
                </div>
            </div>
        </div>
    </Nav>
</template>

<style scoped>
/* 引用共用 CSS */
@import '../assets/css/add.css';

/* 1. 卡片樣式 */
.card {
    background: var(--bg-card); /* 原本 #ffffff */
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--shadow-card); /* 原本 0 10px 25px... */
    border: 1px solid var(--border-color); /* 補上邊框 */
}

/* 2. 標題與日期 */
.header {
    margin-bottom: 24px;
}

.header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-primary); /* 補上標題顏色 */
}

.date-input-container button {
    background: none;
    font-size: 1.2rem;
}

.date-display-input {
    background: transparent;
    border: none;
    font-size: 1rem;
    color: var(--text-secondary); /* 補上日期文字顏色 */
    width: 120px;
    cursor: pointer;
}

/* 3. 表單通用群組 */
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;
}

/* 修正檔案上傳寬度問題 */
.form-group input[type="file"] {
    align-self: flex-start;
    cursor: pointer;
    width: auto;
    color: var(--text-primary); /* 確保檔案名稱可見 */
}

label {
    font-size: 0.85rem;
    color: var(--text-secondary); /* 原本 #475569 */
    margin-bottom: 4px;
}

/* 4. 金額輸入框樣式 */
.amount-input {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid var(--border-color); /* 原本 #e2e8f0 */
    background: var(--bg-input); /* 補上背景 */
    color: var(--text-primary);  /* 補上文字 */
    width: 100%;
    box-sizing: border-box;
}

/* 5. 二欄式網格佈局 */
.grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr)); 
    gap: 12px;
    width: 100%;
}

/* 手機版自動切換為一欄 */
@media (max-width: 480px) {
    .grid {
        grid-template-columns: 1fr;
    }
}

/* 6. 備註輸入框樣式 */
textarea {
    min-height: 120px;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid var(--border-color); /* 原本 #e2e8f0 */
    background: var(--bg-input); /* 補上背景 */
    color: var(--text-primary);  /* 補上文字 */
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit;
}

/* 7. 下方按鈕區 */
.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

.btn-primary {
    background: var(--color-primary); /* 原本 #2563eb */
    color: var(--text-inverse); /* 原本 white */
    padding: 10px 20px;
    border: 0;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

.btn-secondary {
    background: var(--bg-hover); /* 原本 #e7eef5 */
    color: var(--text-secondary); /* 原本 #334155 */
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-color); /* 補上邊框 */
    cursor: pointer;
    font-weight: 600;
}

.btn-secondary:hover {
    background: var(--border-color);
    color: var(--text-primary);
}
</style>