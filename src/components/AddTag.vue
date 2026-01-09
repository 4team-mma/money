<script setup>
import { ref, computed } from 'vue'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { storeToRefs } from 'pinia'

/* ---------- 狀態控制 ---------- */
const showModal = ref(false)
const showAdd = ref(false)
const categoryStore = useCategoryStore()
const { tags: categoryItems } = storeToRefs(categoryStore) // 2. 連結 Store 資料
const selectedIds = ref([1])
const newAdd = ref('')
const newColor = ref('#ef4444')

// 圖片中的顏色序列
const colors = ['#ef4444', '#3b82f6','#004B97', '#22c55e', '#f97316', '#a855f7', '#ec4899']

/* ---------- 計算屬性 ---------- */

// 1. 找出所有「被選中」的完整標籤物件
const selectedItems = computed(() => {
    return categoryItems.value.filter(i => selectedIds.value.includes(i.id))
})

// 2. 計算主頁面按鈕要顯示的文字
const displayText = computed(() => {
    if (selectedItems.value.length === 0) return '選擇標籤'
    return selectedItems.value.map(i => i.itemName).join(', ')
})

/* ---------- 方法 ---------- */
const emit = defineEmits(['update:modelValue'])
const toggleTag = (id) => {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
        selectedIds.value.splice(index, 1)
    } else {
        selectedIds.value.push(id)
    }
    //  每次切換都要傳送最新選中的列表給父組件
    emit('update:modelValue', selectedItems.value)
}

const addNewItem = () => {
    if (!newAdd.value.trim()) return

    const newItem = { id: Date.now(), itemName: newAdd.value, color: newColor.value }

// 3. 呼叫 Store 新增標籤，使其持久化
    categoryStore.addCustomTag(newItem)
// 4. 將新標籤加入選中狀態
    selectedIds.value.push(newItem.id)
    newAdd.value = ''
    showAdd.value = false
    //  每次切換都要傳送最新選中的列表給父組件
    emit('update:modelValue', selectedItems.value)
}
// 如果需要刪除功能，也要同步修改 Store
const removeItem = (id) => {
    categoryStore.$patch((state) => {
        state.tags = state.tags.filter(i => i.id !== id)
    })
    // 移除選中狀態
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
    emit('update:modelValue', selectedItems.value)
}


</script>

<template>
    <div class="picker-trigger" @click="showModal = true">
        <div class="dot-group" v-if="selectedItems.length > 0">
            <span v-for="item in selectedItems" :key="item.id" class="color-dot"
                :style="{ backgroundColor: item.color }"></span>
        </div>
        <span class="current-name">{{ displayText }}</span>
    </div>

    <Teleport to="body">
        <transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click="showModal = false">
                <div class="modal-content" @click.stop>

                    <div class="modal-header">
                        <h3>選擇標籤 (多選)</h3>
                        <button class="confirm-btn" @click="showModal = false">完成</button>
                    </div>

                    <div class="tag-flex">
                        <div v-for="item in categoryItems" :key="item.id" class="tag-pill"
                            :class="{ active: selectedIds.includes(item.id) }" @click="toggleTag(item.id)">
                            <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
                            {{ item.itemName }}
                        </div>
                    </div>

                    <div class="add-section">
                        <div class="add-form" style="margin-top: 0;">
                            <input v-model="newAdd" placeholder="新增標籤名稱" class="tag-input" @keyup.enter="addNewItem" />

                            <div class="color-picker-wrapper">
                                <div v-for="c in colors" :key="c" class="color-option-container" @click="newColor = c">
                                    <span class="color-dot-large" :style="{ backgroundColor: c }"
                                        :class="{ 'is-selected': newColor === c }">
                                    </span>
                                </div>
                            </div>

                            <button class="btn-submit-large" @click="addNewItem">新增並選取</button>
                        </div>
                    </div>

                </div>
            </div>
        </transition>
    </Teleport>
</template>

<style scoped>
@import '../assets/css/add.css';

/* 標籤觸發器樣式 */
/* .tag-trigger {
    border-color: #3b82f6;
    justify-content: center;
    gap: 8px;
}

.tag-trigger .current-name {
    color: #3b82f6;
} */

/* 修正點：讓多個圓點水平排列 */
.dot-group {
    display: flex;
    gap: 4px;
    align-items: center;
}

/* 顏色選擇圓點樣式 */
.color-picker-wrapper {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin: 15px 0;
}

.color-dot-large {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    cursor: pointer;
    display: block;
    transition: transform 0.2s;
    border: 2px solid transparent;
}

.color-dot-large.is-selected {
    outline: 2px solid #3b82f6;
    outline-offset: 3px;
    transform: scale(1.1);
}

.btn-submit-large {
    width: 100%;
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 12px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
}

.tag-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-sizing: border-box;
}
</style>