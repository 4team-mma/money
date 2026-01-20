<script setup>
import { ref, watch, onMounted, reactive, computed } from 'vue'
import { useAccountStore } from '@/stores/useAccountStore'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['update:account'])
const props = defineProps({
    account: [Object, Number, String] ,
    //  新增這個 Prop，用來接收爸爸傳下來的過濾清單
    accountsData: {
        type: Array,
        default: null
    }
})

const accountStore = useAccountStore()
const { accounts: categoryItems, loading } = storeToRefs(accountStore)

const showModal = ref(false)
const showAdd = ref(false)
const selectedCategory = ref(null)

//  核心修改：判斷要顯示「過濾後的」還是「全部」
const displayItems = computed(() => {
    // 如果爸爸有傳 accountsData 進來，就用爸爸的；否則用 Store 全部的
    return props.accountsData || categoryItems.value
})

/* ---------- 新增帳戶的完整狀態 (參考 AccountAdd1) ---------- */
const accountForm = reactive({
    name: '',
    type: 'bank',
    currency: 'TWD',
    initial: 0,
    exclude: false,
    icon: '💰'
})

const accountTypes = [
    { value: 'bank', label: '銀行帳戶' },
    { value: 'cash', label: '現金' },
    { value: 'credit', label: '信用卡' },
    { value: 'investment', label: '投資帳戶' },
    { value: 'other', label: '其他'}
]

const currencys = [
    { value: 'NT $', label: '新台幣 (TWD)' },
    { value: 'USD $', label: '美元 (USD)' },
    { value: 'EUR €', label: '歐元 (EUR)' },
    { value: 'JPY ¥', label: '日圓 (JPY)' }
]

const iconOptions = ['💰', '💳', '💵','🏦', '📈', '📉', '🧾', '📱', '🪙', '🏃',"🐵", "🐶", "🐷", "🐻", "🐨", "🐮", "🦁", "🐯", "🐰", "🐭", "🦉", "🐸"]

onMounted(async () => {
    if (categoryItems.value.length === 0) {
        await accountStore.loadAccounts()
    }

})

// 監聽外部傳入 (用於編輯)
watch(() => props.account, (newVal) => {
    if (!newVal) return;
    const targetId = typeof newVal === 'object' ? newVal.account_id : newVal;
    const found = categoryItems.value.find(acc => acc.account_id === targetId);
    if (found) selectedCategory.value = found;
}, { immediate: true });

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    emit('update:account', item)
}

/**
 * 🔑 強化後的新增邏輯：包含所有詳細欄位
 */
const addNewItem = async () => {
    if (!accountForm.name.trim()) {
        ElMessage.warning('請輸入帳戶名稱')
        return
    }

    const payload = {
        account_name: accountForm.name,
        account_icon: accountForm.icon,
        account_type: accountForm.type,
        initial_balance: accountForm.initial,
        exclude_from_assets: accountForm.exclude,
        currency: accountForm.currency
    }
    
    const success = await accountStore.addAccount(payload)

    if (success) {
        ElMessage.success('帳戶新增成功')
        // 選中最新的一筆
        selectedCategory.value = categoryItems.value[categoryItems.value.length - 1]
        emit('update:account', selectedCategory.value)
        
        // 重置並關閉
        Object.assign(accountForm, { name: '', type: 'bank', currency: 'NT $', initial: 0, exclude: false, icon: '💰' })
        showAdd.value = false
        showModal.value = false
    }
}
</script>

<template>
    <div class="picker-trigger" @click="showModal = true">
        <span v-if="loading" class="current-name">載入中...</span>
        <template v-else>
            <span class="current-icon">{{ selectedCategory?.icon || selectedCategory?.account_icon || '🏦' }}</span>
            <span class="current-name">{{ selectedCategory?.itemName || selectedCategory?.account_name || '請選擇帳戶' }}</span>
        </template>
    </div>

    <Teleport to="body">
        <transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click="showModal = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>選擇帳戶</h3>
                        <button class="close-x" @click="showModal = false">✕</button>
                    </div>

                    <div v-if="loading" class="loading-box">載入中...</div>
                    <div v-else class="item-grid-four">
                        <div v-for="item in displayItems" :key="item.account_id" 
                             class="grid-card" @click="selectCategory(item)">
                            <span class="card-icon">{{ item.icon || item.account_icon }}</span>
                            <span class="card-name">{{ item.itemName || item.account_name }}</span>
                        </div>
                    </div>

                    <div class="add-section-box">
                        <button class="toggle-btn" @click="showAdd = !showAdd">
                            <span>{{ showAdd ? '🔼 取消新增' : '➕ 新增詳細帳戶' }}</span>
                        </button>

                        <div v-if="showAdd" class="expand-form-scrollable">
                            <div class="input-item">
                                <label>帳戶名稱:</label>
                                <input v-model="accountForm.name" placeholder="例如：玉山銀行" class="full-input" />
                            </div>
                            <div class="input-row">
                                <div class="input-item">
                                    <label>類型:</label>
                                    <select v-model="accountForm.type">
                                        <option v-for="t in accountTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
                                    </select>
                                </div>
                                <div class="input-item">
                                    <label>貨幣:</label>
                                    <select v-model="accountForm.currency">
                                        <option v-for="c in currencys" :key="c.value" :value="c.value">{{ c.label }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="input-row">
                                <div class="input-item">
                                    <label>初始餘額:</label>
                                    <input type="number" v-model.number="accountForm.initial" />
                                </div>
                                <div class="input-item-check">
                                    <label>計入資產:</label>
                                    <input type="checkbox" v-model="accountForm.exclude" />
                                </div>
                            </div>
                            <div class="input-item">
                                <label>選擇圖示:</label>
                                <div class="mini-icon-grid">
                                    <span v-for="icon in iconOptions" :key="icon" 
                                          @click="accountForm.icon = icon"
                                          :class="{ active: accountForm.icon === icon }"
                                          class="mini-icon">
                                        {{ icon }}
                                    </span>
                                </div>
                            </div>
                            <button class="btn-blue-submit" @click="addNewItem">完成新增帳戶</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>


<style scoped>
@import '../assets/css/add.css';

/* 帳戶專用綠色風格 */

.account-trigger .current-name {
    color: white;
}

/* 網格與卡片樣式 (與類別同步) */
.item-grid-four {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 20px;
}

.grid-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 12px 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
}

.card-icon {
    font-size: 1.5rem;
    margin-bottom: 4px;
}

.card-name {
    font-size: 0.85rem;
    color: #64748b;
}

.del-x {
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 10px;
    color: #cbd5e1;
}

/* 新增區塊樣式 */
.add-section-box {
    border-top: 1px solid #f1f5f9;
    padding: 15px 20px;
}

.toggle-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    border: none;
    background: none;
    font-weight: 600;
    cursor: pointer;
    padding-bottom: 10px;
}

.green-text {
    color: #15803d;
}

.icon-selector-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin: 15px 0;
    justify-items: center;
}

.icon-option {
    font-size: 1.4rem;
    cursor: pointer;
    padding: 5px;
    border-radius: 8px;
    transition: 0.2s;
    border: 2px solid transparent;
}

.icon-option.active {
    border-color: #15803d;
    background: #f0fdf4;
}

.btn-green-submit {
    width: 100%;
    background: #15803d;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
}

.full-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-top: 5px;
    box-sizing: border-box;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: #94a3b8;
    cursor: pointer;
}

.rotate {
    transform: rotate(180deg);
    transition: transform 0.2s;
}
.modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 2000; display: flex; justify-content: center; align-items: center;
}
.modal-content { 
    background: white; border-radius: 16px; width: 380px; 
    max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;
}
.modal-header { padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.item-grid-four { 
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 15px; 
    overflow-y: auto; flex: 1;
}
.grid-card { 
    border: 1px solid #f0f0f0; padding: 12px; border-radius: 12px; cursor: pointer; text-align: center;
    transition: all 0.2s; background: #fafafa;
}
.grid-card:hover { background: #f0f7ff; border-color: #3b82f6; }
.card-icon { font-size: 24px; display: block; margin-bottom: 5px; }

/* 快速新增區滾動條 */
.expand-form-scrollable { 
    padding: 15px; background: #f9f9f9; border-top: 1px solid #eee;
    max-height: 300px; overflow-y: auto;
}
.input-item { margin-bottom: 10px; }
.input-item label { font-size: 12px; color: #666; display: block; margin-bottom: 4px; }
.input-row { display: flex; gap: 10px; }
.input-row > div { flex: 1; }
input[type="text"], input[type="number"], select {
    width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd; box-sizing: border-box;
}
.input-item-check { display: flex; align-items: center; gap: 10px; margin-top: 20px; }

/* 圖示選擇 */
.mini-icon-grid { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
.mini-icon { 
    font-size: 20px; cursor: pointer; padding: 5px; border-radius: 4px; border: 1px solid transparent; 
}
.mini-icon.active { border-color: #3b82f6; background: #fff; }

.btn-blue-submit { 
    width: 100%; background: #1e293b; color: white; border: none; padding: 10px; 
    border-radius: 8px; margin-top: 15px; cursor: pointer;
}
.close-x { background: none; border: none; font-size: 20px; cursor: pointer; color: #999; }
</style>