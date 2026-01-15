<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAccountStore } from '@/stores/useAccountStore'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['update:modelValue', 'update:account'])
const props = defineProps({
    modelValue: Object,
    // 🌟 修改：支援 Object 或 ID (Number/String)，增加編輯時的彈性
    account: [Object, Number, String] 
})

const accountStore = useAccountStore()
const { accounts: categoryItems, loading } = storeToRefs(accountStore)

const showModal = ref(false)
const showAdd = ref(false)
const initialBalance = ref(0)
const selectedCategory = ref(null) // 🌟 先設為空，交給監聽器初始化

const newAdd = ref('')
const newIcon = ref('💰')
const iconOptions = [
    '💰', '💳', '💵', '🏦', '📈', '📉', '🧾', '📱', '🪙', '🐵', '🐶', '🐷'
]

onMounted(async () => {
    // 確保 Store 資料已載入
    if (categoryItems.value.length === 0) {
        await accountStore.loadAccounts()
    }
    
    // 初始化時，如果沒有傳入 props，預設選第一筆
    if (categoryItems.value.length > 0 && !selectedCategory.value) {
        selectedCategory.value = categoryItems.value[0]
        emit('update:account', selectedCategory.value)
    }
})

/**
 * 🌟 核心改動：強化監聽器
 * 當父組件（編輯視窗）傳入帳戶資料時，自動比對並找出完整物件
 */
watch(() => props.account, (newVal) => {
    if (!newVal) return;

    // 1. 取得目標 ID (判斷傳進來的是 ID 還是整個物件)
    const targetId = typeof newVal === 'object' ? newVal.account_id : newVal;

    // 2. 從目前帳戶清單中找出匹配的項目
    const found = categoryItems.value.find(acc => acc.account_id === targetId);

    if (found) {
        selectedCategory.value = found;
    } else if (typeof newVal === 'object') {
        // 如果清單中找不到(可能是剛刪除)，但傳進來的是完整物件，則暫時使用它
        selectedCategory.value = newVal;
    }
}, { immediate: true });

// 當內部選中項改變時，通知父組件同步
watch(selectedCategory, (val) => {
    if (val) emit('update:account', val)
})

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    emit('update:account', item)
}

// ... addNewItem 與 removeItem 邏輯保持不變 ...
const addNewItem = async () => {
    if (!newAdd.value.trim()) return
    const payload = {
        account_name: newAdd.value,
        account_icon: newIcon.value,
        account_type: 'cash',
        initial_balance: initialBalance.value || 0,
        exclude_from_assets: false,
        currency: 'TWD'
    }
    const success = await accountStore.addAccount(payload)
    if (success) {
        selectedCategory.value = categoryItems.value[categoryItems.value.length - 1]
        newAdd.value = ''; showAdd.value = false; showModal.value = false;
    }
}

const removeItem = async (account_id) => {
    if (confirm('確定要刪除此帳戶嗎？')) {
        const success = await accountStore.deleteAccount(account_id);
        if (success && selectedCategory.value?.account_id === account_id) {
            selectedCategory.value = categoryItems.value[0] ?? null;
        }
    }
}
</script>

<template>
    <div class="picker-trigger" @click="showModal = true">
        <span v-if="loading" class="current-name">載入中...</span>
        <template v-else>
            <span class="current-icon">{{ selectedCategory?.icon || '❓' }}</span>
            <span class="current-name">{{ selectedCategory?.itemName || '請選擇帳戶' }}</span>
        </template>
    </div>

    <Teleport to="body">
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
</style>