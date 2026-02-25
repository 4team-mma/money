<script setup>
import { onMounted, watch,computed } from 'vue'
import { useAddRecord } from '@/composables/useAddRecord'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import Add_account from './AddAccount.vue'
import { useAccountStore } from '@/stores/useAccountStore'
const props = defineProps({ initialData: Object })
const emit = defineEmits(['save-success', 'cancel'])

const accountStore = useAccountStore() //  初始化 Store
// 🌟 3. 封裝一個「同步資料」的函式
const syncAccountData = async (data) => {
    if (!data) return;

    // 確保 Store 資料已載入
    if (accountStore.accounts.length === 0) {
        await accountStore.loadAccounts();
    }

    // 先帶入基礎文字資料（金額、日期、備註等）
    setFormData(data);

    // 關鍵：根據 initialData 裡的 ID，從 Store 找出完整物件並更新 form
    const sourceAcc = accountStore.accounts.find(acc => acc.account_id === data.source_account_id);
    const targetAcc = accountStore.accounts.find(acc => acc.account_id === data.account_id);

    if (sourceAcc) handleSourceUpdate(sourceAcc);
    if (targetAcc) handleAccountUpdate(targetAcc);
}


const { 
    form, setFormData, handleAccountUpdate, handleSourceUpdate, 
    handleSave, isSubmitting 
} = useAddRecord('transfer')

onMounted(() => { 
    syncAccountData(props.initialData); // 使用新的同步函式
})

// onMounted(() => { if (props.initialData) setFormData(props.initialData) })
watch(() => props.initialData, (newVal) => {
    if (newVal && newVal.add_id !== form.add_id) {
        setFormData(newVal)
    }
}, { deep: true })

const onSave = async () => {
    const res = await handleSave()
    if (res?.success) emit('save-success')

}
const now_money = computed(() => {
    const selected_account = form.source_account;

    // 1. 如果完全沒選，顯示預設文字
    if (!selected_account) return '請選擇帳戶';

    // 2. 核心修正：從 Store 中即時對比最新的帳戶資料
    // 這樣可以確保即使 source_account 是舊的，也能抓到 Store 裡最新載入的餘額
    const accountId = typeof selected_account === 'object' 
        ? selected_account.account_id 
        : selected_account;

    const latestInfo = accountStore.accounts.find(acc => acc.account_id === accountId);

    if (latestInfo) {
        const rawBalance = Number(latestInfo.current_balance || 0);
        const integerBalance = Math.floor(rawBalance);
        const formattedBalance = integerBalance.toLocaleString();
        const currency = latestInfo.currency || 'NT$';
        return `${currency} ${formattedBalance}`;
    }

    // 3. 如果正在載入中或找不到
    return 'NT$ 0'; 
});

const in_money = computed(()=>{
    return accountStore.formatAccountBalance(form.account)
})
// 定義不能互相轉帳的負債類型
const debtTypeValues = ['credit', 'loan', 'installment', 'debt_other'];

// 轉出 (From) 帳戶：過濾掉負債項
const allFromAccounts = computed(() => {
    return accountStore.accounts.filter(acc => !debtTypeValues.includes(acc.account_type))
})

// 到 (To) 帳戶：過濾掉負債項，且排除目前選擇的轉出帳戶
const filteredToAccounts = computed(() => {
    return accountStore.accounts.filter(acc => 
        !debtTypeValues.includes(acc.account_type) && 
        acc.account_id !== form.source_account?.account_id
    )
})

</script>

<template>
    <div class="edit-form-wrap">
        <div class="edit-header">
            <h3>編輯轉帳</h3>
            <DatePicker v-model="form.add_date" mode="date" :masks="{ title: 'YYYY年 MMM' }">
                <template #default="{ togglePopover, inputValue }">
                    <div class="date-trigger" @click="togglePopover">
                        <span class="icon">🗓️</span><span>{{ inputValue }}</span>
                    </div>
                </template>
            </DatePicker>
        </div>

        <div class="form-item">
            <label>轉帳金額</label>
            <div class="amount-input-box">
                <span class="currency">NT$</span>
                <input v-model.number="form.add_amount" type="number" class="main-amount" />
            </div>
            
        </div>

        <div v-if="form.add_id || props.initialData" class="form-grid">
            <div class="form-item">
                <label>從 (轉出帳戶)</label>
                <Add_account :accounts-data="allFromAccounts" :account="form.source_account" @update:account="handleSourceUpdate" />
                <div class="change-text">餘額 : {{ now_money }}</div>
            </div>
            <div class="form-item">
                <label>到 (轉入帳戶)</label>
                <Add_account :accounts-data="filteredToAccounts" :account="form.account" @update:account="handleAccountUpdate" />
                <div class="change-text">餘額 : {{ in_money }}</div>
            </div>
        </div>

        <div class="form-item">
            <div class="note-label">
                <label>備註: ({{ form.add_note.length }}/500)</label>
            </div>
            <textarea v-model="form.add_note" placeholder="輸入備註" rows="2"></textarea>
        </div>

        <div class="actions">
            <button class="btn-cancel" @click="emit('cancel')">取消</button>
            <button class="btn-submit" @click="onSave" :disabled="isSubmitting">
                {{ isSubmitting ? '處理中...' : '更新轉帳' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
@import '../assets/css/add.css';

.edit-form-wrap { padding: 10px; font-family: sans-serif; }
.edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.date-trigger { cursor: pointer; background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }

.form-item { margin-bottom: 16px; }
.form-item label { display: block; font-size: 14px; color: #64748b; margin-bottom: 6px; }

.amount-input-box { display: flex; align-items: center; border-bottom: 2px solid #3b82f6; padding: 4px 0; }
.currency { font-size: 18px; font-weight: bold; margin-right: 8px; color: #1e293b; }
.main-amount { border: none; outline: none; font-size: 28px; font-weight: bold; width: 100%; color: #1e293b; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

.note-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.btn-auto { font-size: 12px; color: #3b82f6; background: #eff6ff; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 14px; resize: none; box-sizing: border-box; }

.actions { display: flex; gap: 10px; margin-top: 10px; }
.btn-submit { flex: 2; background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-cancel { flex: 1; background: #f1f5f9; color: #64748b; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }

.btn-submit:hover { background: #2563eb; }

.icon {
    font-size: 1.2rem;
    margin-right: 8px;
    vertical-align: middle; /* 讓圖示與文字對齊 */
    display: inline-block;
    transition: transform 0.2s; /* 增加懸停動畫 */
}

/* 滑鼠移上去時圖示稍微放大 */
.btn-icon:hover .icon {
    transform: scale(1.2);
}
</style>