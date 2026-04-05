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
    return props.accountsData ? props.accountsData : categoryItems.value
})

/* ---------- 新增帳戶的完整狀態 (參考 AccountAdd1) ---------- */
const accountForm = reactive({
    name: '',
    type: 'bank',
    currency: 'NT $',
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
watch(() => props.account, async(newVal) => {
    if (!newVal) {
        selectedCategory.value = null;
        return;
    }
    
    if (categoryItems.value.length === 0) {
        await accountStore.loadAccounts();
    }
    
    const targetId = typeof newVal === 'object' ? newVal.account_id : newVal;
    
    // 🌟 關鍵修改：從「displayItems.value」裡面找，而不是全部的 categoryItems
    const found = displayItems.value.find(acc => acc.account_id === targetId);
    
    if (found) {
        selectedCategory.value = found;
    } else if (typeof newVal === 'object') {
        selectedCategory.value = newVal;
    } else {
        // 如果在過濾後的清單找不到這個 ID，就清空選項 (防呆)
        selectedCategory.value = null;
    }
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
                                    <label>不計入資產:</label>
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
/* 引用共用 CSS */
@import '../assets/css/add.css';

/* --- 內部微調與覆寫 --- */

/* 1. 觸發按鈕內的文字顏色 */
/* 確保在深色模式下，選中的帳戶名稱是清楚的 */
.current-name {
    color: var(--text-primary);
}

/* 2. 帳戶列表網格 (覆寫 add.css 的通用設定以符合帳戶卡片需求) */
.item-grid-four {
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 帳戶卡片比較寬，改為兩欄 */
    gap: 12px;
    padding: 15px;
    overflow-y: auto;
    max-height: 40vh; /* 限制高度 */
}

.grid-card {
    background: var(--bg-body); /* 原本 #fafafa */
    border: 1px solid var(--border-color); /* 原本 #f0f0f0 */
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
}

.grid-card:hover {
    background: var(--bg-hover); /* 原本 #f0f7ff */
    border-color: var(--color-primary); /* 原本 #3b82f6 */
}

.card-icon {
    font-size: 1.5rem;
    margin-bottom: 5px;
}

.card-name {
    font-size: 0.9rem;
    color: var(--text-secondary);
}

/* 3. 新增/展開區塊 */
.add-section-box {
    border-top: 1px solid var(--border-color);
    padding: 0; /* 內距交給下面的 .expand-form-scrollable */
    background: var(--bg-card); /* 保持白色背景 */
}

.toggle-btn {
    width: 100%;
    padding: 15px;
    border: none;
    background: none;
    font-weight: 600;
    color: var(--color-primary);
    cursor: pointer;
    display: flex;
    justify-content: center; /* 讓按鈕置中 */
}

/* 4. 滾動表單區域 */
.expand-form-scrollable {
    padding: 15px 20px 20px 20px;
    background: var(--bg-card); /* 表單區域用淺灰底區分 */
    border-top: 1px solid var(--border-color);
    max-height: 300px;
    overflow-y: auto;
}

/* 表單元素 */
.input-item {
    margin-bottom: 12px;
}

.input-item label {
    font-size: 12px;
    color: var(--text-secondary); /* 原本 #666 */
    display: block;
    margin-bottom: 4px;
}

.input-row {
    display: flex;
    gap: 10px;
}

.input-row > div {
    flex: 1;
}

/* 統一輸入框樣式 */
input[type="text"], 
input[type="number"], 
select, 
.full-input {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid var(--border-color); /* 原本 #ddd */
    background: var(--bg-input); /* 重要：深色模式背景 */
    color: var(--text-primary);  /* 重要：深色模式文字 */
    box-sizing: border-box;
}

/* Checkbox 特殊處理 */
.input-item-check {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 24px; /* 對齊旁邊的輸入框 */
    color: var(--text-primary);
}

/* 5. 圖示選擇器 */
.mini-icon-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
}

.mini-icon {
    font-size: 20px;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: var(--bg-card); /* 給 icon 一個背景 */
}

.mini-icon:hover {
    background: var(--bg-hover);
}

.mini-icon.active {
    border-color: var(--color-primary);
    background: var(--bg-hover);
}

/* 6. 送出按鈕 */
.btn-blue-submit {
    width: 100%;
    background: var(--color-primary); /* 原本 #1e293b (改用品牌色比較一致) */
    color: var(--text-inverse);
    border: none;
    padding: 12px;
    border-radius: 8px;
    margin-top: 20px;
    cursor: pointer;
    font-weight: 600;
}

/* 7. 關閉按鈕 */
.close-x {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--text-secondary); /* 原本 #999 */
}
.close-x:hover {
    color: var(--color-primary);
}

/* 8. 載入中 */
.loading-box {
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
}
</style>