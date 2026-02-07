<script setup>
import { ref, watch,onMounted } from 'vue' 
import { useCategoryStore } from '@/stores/useCategoryStore'
import { storeToRefs } from 'pinia'

// 1. 先定義 Props 與 Emits
const props = defineProps({
    modelValue: [Object, String] // 🌟 支援物件或成員名稱字串
})
const emit = defineEmits(['update:modelValue'])

// 2. 初始化狀態
const showModal = ref(false)
const showAdd = ref(false)
const categoryStore = useCategoryStore()
const { members: categoryItems } = storeToRefs(categoryStore)

// 預設選中第一筆，若之後有 props 傳入會被 watch 覆蓋
const selectedCategory = ref(categoryItems.value[0])
const newAdd = ref('')

/**
 * 🌟 核心監聽邏輯：支援編輯模式與自定義成員復原
 * 使用 async 確保在 Store 持久化資料載入後再進行比對
 */
watch(() => props.modelValue, async(newVal) => {
    if (!newVal) return;

    // 取得目標名稱
    const targetName = typeof newVal === 'object' ? newVal.itemName : newVal;
    
    // 從成員清單中查找
    const found = categoryItems.value.find(m => m.itemName === targetName);
    
    if (found) {
        selectedCategory.value = found;
    } else {
        // 🌟 關鍵防禦：若資料庫有這筆成員，但 Store 裡沒有（例如換電腦或清空緩存）
        // 我們手動重建它，並利用你的 addCustomMember action 存入 Store
        const tempId = Date.now() + Math.random();
        const newTempMember = { 
            id: tempId, 
            itemName: targetName 
        };
        
        // 呼叫你的 Store Action 確保資料同步
        categoryStore.addCustomMember(newTempMember);
        selectedCategory.value = newTempMember;
    }
}, { immediate: true });
onMounted(() => {
    // 若沒有傳入值且目前沒選中，預設選第一筆 (自己)
    if (!props.modelValue && categoryItems.value.length > 0) {
        selectedCategory.value = categoryItems.value[0];
        emit('update:modelValue', selectedCategory.value);
    }
});

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    emit('update:modelValue', item)
}
const addNewItem = () => {
    const name = newAdd.value.trim();
    if (!name) return

    // 🌟 1. 核心限制：對應 add_member VARCHAR(10)
    // 扣除一些 buffer，建議限制在 8 個字以內
    if (name.length > 8) {
        alert('成員名稱太長囉，請控制在 8 個字以內');
        return;
    }

    const newItem = { id: Date.now(), itemName: name }
    categoryItems.value.push(newItem)

    selectedCategory.value = newItem
    emit('update:modelValue', newItem)

    newAdd.value = ''
    showAdd.value = false
    showModal.value = false
}

const removeItem = (id) => {
    // 🌟 2. 加入刪除二次確認
    const targetItem = categoryItems.value.find(item => item.id === id);
    if (confirm(`確定要刪除成員「${targetItem?.itemName}」嗎？`)) {
        categoryItems.value = categoryItems.value.filter(i => i.id !== id)
        
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
        <span class="current-icon">👤</span>
        <span class="current-name">{{ selectedCategory?.itemName || '請選擇成員' }}</span>
    </div>

    <Teleport to="body">
        <transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click="showModal = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>選擇成員</h3>
                        <button class="close-btn" @click="showModal = false">✕</button>
                    </div>

                    <div class="tag-flex">
                        <div v-for="item in categoryItems" :key="item.id" class="tag-pill"
                            @click="selectCategory(item)">
                            {{ item.itemName }}
                            <span class="remove-x" @click.stop="removeItem(item.id)">✕</span>
                        </div>
                    </div>

                    <div class="add-section">
                        <div class="add-form compact-form">
                            <input v-model="newAdd" 
                            placeholder="輸入新成員名稱" 
                            @keyup.enter="addNewItem"
                            maxlength="8"
                            />
                            <button class="btn-submit" @click="addNewItem">新增成員</button>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<style scoped>
@import '../assets/css/add.css';

/* 針對移除按鈕的樣式 */
.remove-x {
    margin-left: 8px;
    font-size: 10px;
    color: var(--text-secondary); /* 原本是 #94a3b8 */
    cursor: pointer;
    transition: color 0.2s;
}

.remove-x:hover {
    color: var(--color-danger); /* hover 時變紅色 */
}

/* 針對表單的微調 */
.compact-form {
    margin-top: 0;
}

/* 確保輸入框在深色模式下正確顯示 */
/* 因為 add.css 已經定義了 .add-form input 的通用樣式，這裡通常不需要額外寫 */
/* 但為了保險起見，再次確認 */
.add-form input {
    background: var(--bg-input);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}
</style>