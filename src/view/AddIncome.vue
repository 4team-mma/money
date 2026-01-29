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
                    </div>

                    <div class="form-group">
                        <label>帳戶 (存入)</label>
                        <Add_account v-model:account="form.account" @update:model-value="handleAccountUpdate" />
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
/* 引用共用樣式 */
@import '../assets/css/add.css';



.card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
}

.header {
    margin-bottom: 24px;
}

.header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.date {
    font-size: 0.9rem;
    color: #64748b;
}

/* 表單通用群組 */
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
}

label {
    font-size: 0.85rem;
    color: #475569;
}

/* 金額輸入框樣式 */
.amount-input {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
}

/* 二欄式網格佈局 */
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

/* 備註輸入框樣式 */
textarea {
    min-height: 120px;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    resize: vertical;
}

/* 下方按鈕區 */
.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

.btn-primary {
    background: #2563eb;
    color: white;
    padding: 10px 20px;
    border: 0;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

.btn-secondary {
    background: #e7eef5;
    color: #334155;
    padding: 10px 20px;
    border-radius: 10px;
    border: 0;
    cursor: pointer;
}
</style>