<script setup>
import { ref } from 'vue'

/* ---------- 面板狀態 ---------- */
const showCategoryPanel = ref(false)

/* ---------- 類別列表 ---------- */
const categoryItems = ref([
    { id: 1, itemName: '衝動', color: '#ef4444' },
    { id: 2, itemName: '必要', color: '#3b82f6' },
    { id: 3, itemName: '旅遊', color: '#22c55e' },
])

const selectedCategory = ref(categoryItems.value[0])
const newAdd = ref('')
const newColor = ref('#000000')

// 顏色池（最多10個）
const colors = ref(['#ef4444', '#3b82f6', '#22c55e', '#f97316'])

// 暫存預覽顏色，不直接改類別
const previewColor = ref(selectedCategory.value.color)

// 選擇類別
const selectCategory = (item) => {
    selectedCategory.value = item
    previewColor.value = item.color
}

// 確定修改顏色
const applyColor = (color) => {
    selectedCategory.value.color = color
    previewColor.value = color
    // 加入顏色池（最多10個）
    if (!colors.value.includes(color) && colors.value.length < 10) {
        colors.value.push(color)
    }
}

// 新增類別
const addNewItem = () => {
    if (!newAdd.value.trim()) return
    const newItem = { id: Date.now(), itemName: newAdd.value, color: newColor.value }
    categoryItems.value.push(newItem)
    selectedCategory.value = newItem
    previewColor.value = newItem.color

    // 加入顏色池（最多10個）
    if (!colors.value.includes(newColor.value) && colors.value.length < 10) {
        colors.value.push(newColor.value)
    }

    newAdd.value = ''
    newColor.value = '#000000'
}

// 刪除類別
const removeItem = (id) => {
    categoryItems.value = categoryItems.value.filter(i => i.id !== id)
}
</script>

<template>
    <!-- 主按鈕 -->
    <button class="btn btn-outline-primary" @click="showCategoryPanel = !showCategoryPanel">
        <span class="color-dot" :style="{ backgroundColor: selectedCategory.color }"></span>
        {{ selectedCategory.itemName }}
    </button>

    <!-- 類別面板 -->
    <div v-if="showCategoryPanel" class="category-panel">
        <div class="box1">

            <!-- 類別列表 -->
            <div class="category-buttons">
                <button v-for="item in categoryItems" :key="item.id" @click="selectCategory(item)"
                    :class="{ active: selectedCategory.id === item.id }">
                    <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
                    {{ item.itemName }}
                </button>
            </div>
        </div>
        <div class="box2">
            <!-- 編輯顏色 -->
            <div class="color-picker">
                <input type="color" v-model="newColor" @input="onColorInput" />
                <span v-for="color in colors" :key="color" class="color-dot"
                    :class="{ selected: previewColor === color }" :style="{ backgroundColor: color }"
                    @click="applyColor(color)"></span>
            </div>

            <!-- 新增類別 -->
            <div class="add-category">
                <input v-model="newAdd" placeholder="新增類別名稱" @keyup.enter="addNewItem" />
                <!-- <input type="color" v-model="newColor" /> -->
                <button @click="applyColor(newColor)">新增/套用顏色</button>
            </div>
        </div>
    </div>

</template>

<style scoped>

.add-category{
    
    padding-bottom: 5px;

}
.category-panel {
    margin-top: 12px;

}

.box1 {
    display: flex;
    justify-content: center;
    /* 水平置中 */

}

.box2 {
    display: flex;
    justify-content: center;
    /* 水平置中 */

}

/* 類別列表 */
.category-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 12px;
}

.category-buttons button {
    padding: 6px 12px;
    border-radius: 6px;
    background: #eee;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
}

.category-buttons button.active {
    background: #dbeafe;
}

/* 顏色圓點 */
.color-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-block;
    border: 1px solid #ccc;


}

.color-dot.selected {
    outline: 2px solid #000;

}

/* 色盤 */
.color-picker {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding-right: 10px;
    margin-bottom: 12px;
}

/* 新增 */
.add-category {
    display: flex;
    align-items: center;
    gap: 6px;
}

.add-category input {
    padding: 6px 8px;

}

.add-category button {
    padding: 6px 10px;
}
</style>
