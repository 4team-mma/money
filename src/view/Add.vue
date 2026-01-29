<script setup>
import Nav from '@/components/Nav.vue'
import Add_bar from '@/components/AddBar.vue'
import Add_cato from '@/components/AddCato.vue'
import Add_account from '@/components/AddAccount.vue'
import Add_member from '@/components/AddMember.vue'
import Add_tag from '@/components/AddTag.vue'
import { useAddRecord } from '@/composables/useAddRecord'
import { useAccountStore } from '@/stores/useAccountStore'
import { ref, onMounted, computed } from 'vue';

// 月曆與通知套件
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';

// 🌟 1. 修正順序：先定義 Store，這樣下面的 computed 才能用
const accountStore = useAccountStore()

// 調用 Composable
const {
    form, handleCatoUpdate, handleAccountUpdate,
    handleMemberUpdate, handleTagUpdate, handleSave,
    handleSaveNext, formatNote
} = useAddRecord(false)


// 修改 add.vue 裡面的這一段

// 修改 Add.vue 的 computed

const currentCurrency = computed(() => {
    const selected = form.account;

    // 1. 防呆：如果是 null 或 undefined
    if (!selected) return '金額';

    // 2. 🌟 關鍵修正：如果它已經是「物件」，直接讀取裡面的 currency
    if (typeof selected === 'object') {
        // 如果物件裡有 currency 就用，沒有就預設 NT$
        return selected.currency || 'NT$';
    }

    // 3. 如果它是「ID (數字或字串)」，才去 Store 列表尋找
    // (這是為了相容如果有人傳 ID 進來的情況)
    if (accountStore.accounts.length > 0) {
        const found = accountStore.accounts.find(acc => acc.account_id == selected);
        return found ? (found.currency || 'NT$') : '金額';
    }

    return '金額';
})

onMounted(async () => {
    await accountStore.loadAccounts()

    // 設定預設值
    if (accountStore.accounts.length > 0) {
        // 這裡確保 handleAccountUpdate 會正確更新 form.account
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
                    <h2>新增支出</h2>
                    <DatePicker v-model="form.add_date" mode="date" :popover="{ visibility: 'click' }"
                        :masks="{ title: 'YYYY年 MMM' }" :transition="'none'">
                        <template #default="{ togglePopover, inputValue, inputEvents }">
                            <div class="date-input-container">
                                <button type="button" @click="togglePopover"
                                    style="border:0; cursor:pointer">🗓</button>
                                <input :value="inputValue || ''" v-on="inputEvents" readonly
                                    class="date-display-input" />
                            </div>
                        </template>
                    </DatePicker>
                </div>

                <div class="form-group">
                    <label>支出金額</label>
                    <input v-model.number="form.add_amount" type="number" :placeholder="`${currentCurrency}`"
                        class="amount-input" max="999999999" />
                </div>

                <div class="grid">
                    <div class="form-group">
                        <label>消費類別</label>
                        <Add_cato @update:model-value="handleCatoUpdate" />
                    </div>

                    <div class="form-group">
                        <label>帳戶</label>
                        <Add_account v-model:account="form.account" />
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
                        <label>備註: ({{ form.add_note.length }}/200)</label> <button @click="formatNote"
                            class="btn btn-info" style="font-size: 12px;">自動整理</button>
                    </div>
                    <textarea v-model="form.add_note" placeholder="補充說明（選填）"></textarea>
                </div>

                <div class="actions">
                    <button @click="handleSave" class="btn-primary">儲存支出</button>
                    <button @click="handleSaveNext" class="btn-secondary">再記一筆</button>
                </div>
            </div>
        </div>
    </Nav>
</template>


<style scoped>
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



label {
    font-size: 0.85rem;
    color: #475569;
}

/* 金額 */
.amount-input {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
}

/* textarea */
textarea {
    min-height: 120px;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    resize: vertical;
}

/* Actions */
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
    border: 0px;
    border-radius: 10px;
    font-weight: 600;

}

.btn-secondary {
    background: #e7eef5;
    color: #334155;
    padding: 10px 20px;
    border-radius: 10px;
    border: 0px;
}
</style>