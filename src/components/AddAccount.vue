<script setup>
import { ref, watch, onMounted } from 'vue'
import { useAccountStore } from '@/stores/useAccountStore'
import { storeToRefs } from 'pinia'

const props = defineProps({
    account: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:account'])

const accountStore = useAccountStore()
const { accounts: categoryItems, loading } = storeToRefs(accountStore)

const showModal = ref(false)
const showAdd = ref(false)

const selectedCategory = ref(props.account)

const newAdd = ref('')
const newIcon = ref('💰')
const iconOptions = [
    '💰', '💳', '💵', '🏦', '📈', '📉', '🧾', '📱', '🪙', '🏃',
    '🐵', '🐶', '🐷', '🐻', '🐨', '🐮', '🦁', '🐯', '🐰', '🐭', '🦉', '🐸'
]

onMounted(async () => {
    await accountStore.loadAccounts()
    if (!selectedCategory.value && categoryItems.value.length > 0) {
        selectedCategory.value = categoryItems.value[0]
    }
})

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
}

/**
 * 🔑 修正後的新增邏輯：先傳給後端 payload，再更新選單
 */
const addNewItem = async () => {
    if (!newAdd.value.trim()) return

    // 準備要送給後端的 payload
    const payload = {
        account_name: newAdd.value,
        icon_id: newIcon.value,
        account_type: 'cash',        // 預設類型
        initial_balance: 0,          // 初始餘額
        exclude_from_assets: false
    }

    // 調用 store 方法
    const success = await accountStore.addAccount(payload)

    if (success) {
        // 成功後，最新的一筆就是剛新增的
        selectedCategory.value = categoryItems.value[categoryItems.value.length - 1]
        
        // 重置欄位
        newAdd.value = ''
        showAdd.value = false
        showModal.value = false
    }
}

const removeItem = (account_id) => {
    accountStore.$patch((state) => {
        state.accounts = state.accounts.filter(item => item.account_id !== account_id)
    })
    if (selectedCategory.value?.account_id === account_id) {
        selectedCategory.value = categoryItems.value[0] ?? null
    }
}

watch(selectedCategory, (val) => {
    emit('update:account', val)
}, { immediate: true })

watch(() => props.account, (newVal) => {
    if (newVal) selectedCategory.value = newVal
})
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
                            <span class="card-icon">{{ item.icon }}</span>
                            <span class="card-name">{{ item.itemName }}</span>
                            <span class="del-x" @click.stop="removeItem(item.account_id)">✕</span>
                        </div>
                    </div>

                    <div class="add-section-box">
                        <button class="toggle-btn green-text" @click="showAdd = !showAdd">
                            <span>➕ 新增帳戶</span>
                            <span :class="{ rotate: showAdd }">⌄</span>
                        </button>

                        <transition name="slide-fade">
                            <div v-if="showAdd" class="expand-form">
                                <input v-model="newAdd" placeholder="帳戶名稱" class="full-input" @keyup.enter="addNewItem" />
                                <div class="icon-selector-grid">
                                    <span v-for="icon in iconOptions" :key="icon" @click="newIcon = icon"
                                    :class="{ active: newIcon === icon }" class="icon-option">
                                    {{ icon }}
                                    </span>
                                </div>
                                <button class="btn-green-submit" @click="addNewItem">完成新增</button>
                            </div>
                        </transition>
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