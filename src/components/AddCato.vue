<script setup>
import { ref, watch } from 'vue' // 🌟 匯總 import
import { useCategoryStore } from '@/stores/useCategoryStore'
import { storeToRefs } from 'pinia'

// 1. 先定義 Props 和 Emits
const props = defineProps({
    modelValue: [Object, String], // 🌟 支援物件或字串
    account: Object
})
const emit = defineEmits(['update:modelValue'])

// 2. 初始化 Store
const categoryStore = useCategoryStore()
const { categories: categoryItems } = storeToRefs(categoryStore)

// 3. 定義內部的響應式變數
const showModal = ref(false)
const showAdd = ref(false)
const selectedCategory = ref(categoryItems.value[0]) // 預設值
const newAdd = ref('')
const newIcon = ref('🍔')




// 4. 🌟 核心監聽邏輯 (放在 props 定義之後)
watch(() => props.modelValue, (newVal) => {
    if (!newVal) return;

    // 判斷傳進來的是「名稱字串」還是「整個物件」
    const targetName = typeof newVal === 'string' ? newVal : newVal.itemName;
    
    // 從清單中找回對應的完整物件，這樣圖示 (icon) 才能對上
    const found = categoryItems.value.find(c => c.itemName === targetName);
    
    if (found) {
        selectedCategory.value = found;
    } else if (typeof newVal === 'object') {
        // 如果找不到但傳進來的是物件，就直接使用它（適用於剛新增的項目）
        selectedCategory.value = newVal;
    }
}, { immediate: true }); // immediate 確保一開啟編輯時就會觸發同步

// ... 以下 addNewItem, selectCategory, removeItem 邏輯保持不變 ...
const iconOptions = [
    '🍔', '🚗', '🏠', '🎮', '💡', '💊', '📚', '✈️', '🚆', '🎬', '🎁',
    '🎨', '🎵', '🏃', '🛍️', '🏖️', '🍕', '🍩', '☕', '🥗', '🍎'
]

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    emit('update:modelValue', item)
}

const addNewItem = () => {
    const name = newAdd.value.trim();
    
    // 🌟 1. 檢查名稱是否為空
    if (!name) return;

    // 🌟 2. 限制類別名稱長度 (對應 add_class VARCHAR(20))
    if (name.length > 15) {
        // 如果你有引入 ElMessage 
        // ElMessage.warning('類別名稱太長囉，請控制在 15 字以內');
        alert('類別名稱太長囉，請控制在 15 字以內');
        return;
    }

    // 🌟 3. 限制圖示長度 (對應 add_class_icon VARCHAR(20))
    // 雖然選單是固定的，但防止未來有其他輸入方式
    if (newIcon.value.length > 10) { 
        alert('圖示資料異常');
        return;
    }

    const newItem = { 
        id: Date.now(), 
        itemName: name, 
        icon: newIcon.value 
    };

    categoryItems.value.push(newItem);
    selectedCategory.value = newItem;
    emit('update:modelValue', newItem);
    
    // 重置
    newAdd.value = '';
    showAdd.value = false;
    showModal.value = false;
}

const removeItem = (id) => {
    // 1. 找出要被刪除的項目名稱，讓提示更親切
    const targetItem = categoryItems.value.find(item => item.id === id);
    const itemName = targetItem ? targetItem.itemName : '此項目';

    // 2. 彈出二次確認視窗
    const isConfirmed = confirm(`確定要刪除「${itemName}」類別嗎？`);

    if (isConfirmed) {
        // 執行刪除邏輯
        categoryItems.value = categoryItems.value.filter(item => item.id !== id)
        
        // 3. 如果刪掉的是目前選中的，就跳回第一個預設值
        if (selectedCategory.value?.id === id) {
            const fallback = categoryItems.value[0] || null
            selectedCategory.value = fallback
            emit('update:modelValue', fallback)
        }
    }
}
</script>

<template>
    <div class="picker-trigger" @click="showModal = true">
        <span class="current-icon">{{ selectedCategory?.icon || '❓' }}</span>
        <span class="current-name">{{ selectedCategory?.itemName || '請選擇類別' }}</span>
    </div>

    <Teleport to="body">
        <transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click="showModal = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>選擇類別</h3>
                        <button class="close-x" @click="showModal = false">✕</button>
                    </div>

                    <div class="item-grid-four">
                        <div v-for="item in categoryItems" :key="item.id" class="grid-card"
                            @click="selectCategory(item)">
                            <span class="card-icon">{{ item.icon }}</span>
                            <span class="card-name">{{ item.itemName }}</span>
                            <span 
                            v-if="item.id > 100"
                            class="del-x" 
                            @click.stop="removeItem(item.id)">✕</span>
                        </div>
                    </div>

                    <div class="add-section-box">
                        <button class="toggle-btn" @click="showAdd = !showAdd">
                            <span class="plus-icon">➕ 新增自定義類別</span>
                            <span :class="{ rotate: showAdd }">⌄</span>
                        </button>

                        <div v-if="showAdd" class="expand-form">
                            <input v-model="newAdd" placeholder="輸入名稱..." class="full-input"
                                @keyup.enter="addNewItem"
                                maxlength="15"
                                />
                            <div class="icon-selector-grid">
                                <span v-for="icon in iconOptions" :key="icon" @click="newIcon = icon"
                                    :class="{ active: newIcon === icon }" class="icon-option">
                                    {{ icon }}
                                </span>
                            </div>
                            <button class="btn-blue-submit" @click="addNewItem">完成新增</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<style scoped>
/* 引用共用樣式 (add.css) 保持不變 */
@import '../assets/css/add.css';

/* 針對圖片樣式的精確還原 */
.item-grid-four {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 20px;
    /* 建議加上 max-height 以免類別太多撐爆畫面 */
    max-height: 40vh; 
    overflow-y: auto;
}

.grid-card {
    background: var(--bg-body); /* 原本 #f8fafc */
    border-radius: 12px;
    padding: 12px 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    position: relative;
    border: 1px solid transparent; /* 預留邊框位置 */
    transition: all 0.2s;
}

/* 補上 hover 效果，讓使用者知道可以點 */
.grid-card:hover {
    background: var(--bg-hover);
}

.card-icon {
    font-size: 1.5rem;
    margin-bottom: 4px;
}

.card-name {
    font-size: 0.85rem;
    color: var(--text-secondary); /* 原本 #64748b */
}

.del-x {
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 10px;
    color: var(--text-secondary); /* 原本 #cbd5e1，改用通用灰字比較清楚 */
    opacity: 0.5;
}
.grid-card:hover .del-x {
    opacity: 1;
    color: var(--color-danger); /* hover 時變紅色，提示刪除 */
}

.add-section-box {
    border-top: 1px solid var(--border-color); /* 原本 #f1f5f9 */
    padding: 15px 20px;
    background: var(--bg-card); /* 確保底部區塊背景正確 */
}

.toggle-btn {
    width: 100%;
    display: flex;
    justify-content: space-between;
    border: none;
    background: none;
    color: var(--color-primary); /* 原本 #4f46e5 */
    font-weight: 600;
    cursor: pointer;
    padding-bottom: 10px;
}

.icon-selector-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
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
    background: var(--bg-card); /* 確保 icon 有背景 */
}

.icon-option:hover {
    background: var(--bg-hover);
}

.icon-option.active {
    border-color: var(--color-primary); /* 原本 #3b82f6 */
    background: var(--bg-hover); /* 原本 #eff6ff */
}

.btn-blue-submit {
    width: 100%;
    background: var(--color-primary); /* 原本 #2563eb */
    color: var(--text-inverse); /* 原本 white */
    border: none;
    padding: 12px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
}

.full-input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color); /* 原本 #e2e8f0 */
    border-radius: 10px;
    margin-top: 5px;
    background: var(--bg-input); /* 補上輸入框背景 */
    color: var(--text-primary);  /* 補上輸入框文字 */
}

.close-x {
    background: none;
    border: none;
    font-size: 1.2rem;
    color: var(--text-secondary); /* 原本 #94a3b8 */
    cursor: pointer;
}
.close-x:hover {
    color: var(--color-primary);
}
</style>