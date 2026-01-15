<script setup>
import { ref, watch } from 'vue' // 🌟 引入 watch
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
 * 🌟 核心監聽邏輯：支援編輯模式
 * 當父組件傳入成員資料時，自動從 Store 清單找回對應的物件
 */
watch(() => props.modelValue, (newVal) => {
    if (!newVal) return;

    // 判斷傳進來的是成員名稱字串還是物件
    const targetName = typeof newVal === 'object' ? newVal.itemName : newVal;
    
    // 從成員清單中查找
    const found = categoryItems.value.find(m => m.itemName === targetName);
    
    if (found) {
        selectedCategory.value = found;
    } else if (typeof newVal === 'object') {
        selectedCategory.value = newVal;
    }
}, { immediate: true });

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    emit('update:modelValue', item)
}

const addNewItem = () => {
    if (!newAdd.value.trim()) return
    const newItem = { id: Date.now(), itemName: newAdd.value }
    categoryItems.value.push(newItem)

    selectedCategory.value = newItem
    emit('update:modelValue', newItem)

    newAdd.value = ''
    showAdd.value = false
    showModal.value = false
}

const removeItem = (id) => {
    categoryItems.value = categoryItems.value.filter(i => i.id !== id)
    if (selectedCategory.value?.id === id) {
        const fallback = categoryItems.value[0] || null
        selectedCategory.value = fallback
        emit('update:modelValue', fallback)
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
                            <span style="margin-left:8px; font-size:10px; color:#94a3b8"
                                @click.stop="removeItem(item.id)">✕</span>
                        </div>
                    </div>

                    <div class="add-section">
                        <div class="add-form" style="margin-top:0">
                            <input v-model="newAdd" placeholder="輸入新成員名稱" @keyup.enter="addNewItem" />
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
</style>