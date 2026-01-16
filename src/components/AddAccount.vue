<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAccountStore } from '@/stores/useAccountStore'
import { storeToRefs } from 'pinia'

const emit = defineEmits(['update:account'])
const props = defineProps({
    account: [Object, Number, String] 
})

const accountStore = useAccountStore()
const { accounts: categoryItems, loading } = storeToRefs(accountStore)

const showModal = ref(false)
const showAdd = ref(false)
const selectedCategory = ref(null)

const newAdd = ref('')
const newIcon = ref('💰')
const initialBalance = ref(0)
const iconOptions = ['💰', '💳', '💵', '🏦', '📈', '📉', '🧾', '📱', '🪙', '🐵', '🐶', '🐷']

onMounted(async () => {
    // 1. 確保資料載入
    if (categoryItems.value.length === 0) {
        await accountStore.loadAccounts()
    }
    
    // 2. 如果是新增模式且沒選中，預設選第一筆
    if (categoryItems.value.length > 0 && !selectedCategory.value) {
        // 🌟 這裡要確保抓取的屬性名稱與 Store 一致
        selectedCategory.value = categoryItems.value[0]
        emit('update:account', selectedCategory.value)
    }
})

// 監聽外部傳入的 account (用於編輯模式)
watch(() => props.account, (newVal) => {
    if (!newVal) return;
    const targetId = typeof newVal === 'object' ? newVal.account_id : newVal;
    const found = categoryItems.value.find(acc => acc.account_id === targetId);
    if (found) {
        selectedCategory.value = found;
    }
}, { immediate: true });

// 監聽內部選中變化，同步給父組件
watch(selectedCategory, (val) => {
    if (val) emit('update:account', val)
})

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
}

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
</script>

<template>
    <div class="picker-trigger" @click="showModal = true" style="cursor: pointer;">
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
                        <button class="close-btn" @click="showModal = false">✕</button>
                    </div>

                    <div v-if="loading" class="loading-box">載入中...</div>
                    <div v-else class="item-grid-four">
                        <div v-for="item in categoryItems" :key="item.account_id" 
                             class="grid-card" @click="selectCategory(item)">
                            <span class="card-icon">{{ item.icon || item.account_icon }}</span>
                            <span class="card-name">{{ item.itemName || item.account_name }}</span>
                        </div>
                    </div>

                    <div class="add-section-box">
                        <button class="toggle-btn" @click="showAdd = !showAdd">
                            <span>➕ 新增帳戶</span>
                        </button>
                        <div v-if="showAdd" class="expand-form">
                            <input v-model="newAdd" placeholder="帳戶名稱" />
                            <button @click="addNewItem">完成</button>
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
</style>