<script setup>

import { ref, nextTick } from 'vue'
/* ---------- 狀態 ---------- */
const showCategoryPanel = ref(false)

const categoryItems = ref([
    { id: 1, itemName: '自己'},
    { id: 2, itemName: '父母' },
    { id: 3, itemName: '孩子' },
])

const selectedCategory = ref(categoryItems.value[0])
const newAdd = ref('')

/* ---------- 類別操作 ---------- */
const selectCategory = (item) => {
    selectedCategory.value = item
    collapsePanel()
}

const addNewItem = () => {
    if (!newAdd.value.trim()) return

    const newItem = {
        id: Date.now(),
        itemName: newAdd.value,
    }

    categoryItems.value.push(newItem)
    selectedCategory.value = newItem
    newAdd.value = ''
    collapsePanel()
}

const removeItem = (id) => {
    categoryItems.value = categoryItems.value.filter(item => item.id !== id)

    if (selectedCategory.value?.id === id) {
        selectedCategory.value = categoryItems.value[0] || null
    }
}

/* ---------- 面板動畫 ---------- */
const togglePanel = () => {
    showCategoryPanel.value = !showCategoryPanel.value
}
</script>
<template>
<button @click="togglePanel" class="btn btn-secondary">
        {{ selectedCategory.icon }} {{ selectedCategory.itemName }}
    </button>

    <!-- 類別面板 -->
    <transition name="fade-slide">
        <div v-if="showCategoryPanel" class="category-panel">
            <!-- 類別列表 -->
            <div class="category-buttons">
                <button v-for="item in categoryItems" :key="item.id" @click="selectCategory(item)">
                    {{ item.icon }} {{ item.itemName }}
                    <span @click.stop="removeItem(item.id)"> ✕ </span>
                </button>
            </div>

            <!-- 新增類別 -->
            <div class="add-category">
                <input v-model="newAdd" @keyup.enter="addNewItem" placeholder="新增類別" />
 
            </div>
        </div>
    </transition>
</template>
<style scoped>

/* 類別面板 */
.category-panel {
    margin-top: 12px;
}

/* 類別列表按鈕 */
.category-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-bottom: 10px;
}

.category-buttons button {
    padding: 6px 12px;
    border-radius: 6px;
    background: #eee;
    border: none;
    cursor: pointer;
}

.category-buttons button:hover {
    background: #ddd;
}

/* 新增類別 */
.add-category {
    margin-top: 10px;
    padding-bottom: 5px;
}

/* Icon 選擇器 */
.icon-picker {
    display: flex;
    flex-wrap: wrap; /* ✅ 重要，自動換行 */
    gap: 10px;
    margin: 10px 0;
    justify-content: center;
}

.icon-picker span {
    cursor: pointer;
    font-size: 24px;
    padding: 4px 8px;
    border-radius: 6px;
}

.icon-picker .selected {
    background: #cce5ff;
}

/* 展開/收起動畫 */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: all 0.25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>