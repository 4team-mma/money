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
    handleSaveNext, 
} = useAddRecord(false)


//引用餘額近來(錢多的=轉入帳戶)
const now_money = computed(()=>{
    return accountStore.formatAccountBalance(form.account)
})

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
                        <div class="change-text">-可自定義類別-</div>
                    </div>

                    <div class="form-group">
                        <label>帳戶</label>
                        <Add_account v-model:account="form.account" />
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
                    <button @click="handleSave" class="btn-primary">儲存支出</button>
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
    /* 建議加上邊框，讓深色模式下的卡片邊緣更清晰 */
    border: 1px solid var(--border-color);
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

/* 日期選擇器相關 (雖然在 template 裡有寫 style="border:0"，但這裡可以補強) */
.date-input-container button {
    background: none;
    font-size: 1.2rem;
}
.date-display-input {
    background: transparent;
    border: none;
    font-size: 1rem;
    color: var(--text-secondary);
    width: 120px;
    cursor: pointer;
}

/* 3. 標籤 */
label {
    font-size: 0.85rem;
    color: var(--text-secondary); /* 原本 #475569 */
    margin-bottom: 8px; /* 增加一點間距比較好看 */
    display: block;
}

/* 4. 金額輸入框 */
.amount-input {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid var(--border-color); /* 原本 #e2e8f0 */
    background: var(--bg-input); /* 補上背景 */
    color: var(--text-primary);  /* 補上文字 */
    width: 100%; /* 確保寬度正確 */
    box-sizing: border-box;
}

/* 5. 備註輸入框 (Textarea) */
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
    font-family: inherit; /* 確保字體一致 */
}

/* 6. 按鈕區 */
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
    border: 0px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

.btn-secondary {
    background: var(--bg-hover); /* 原本 #e7eef5 (淺灰) */
    color: var(--text-secondary); /* 原本 #334155 (深灰) */
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-color); /* 補個邊框讓它在深色模式更清楚 */
    cursor: pointer;
    font-weight: 600;
}
.btn-secondary:hover {
    background: var(--border-color); /* hover 時稍微深一點 */
    color: var(--text-primary);
}
</style>