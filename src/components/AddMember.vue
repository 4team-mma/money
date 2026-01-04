<script setup>
import { ref } from 'vue'

const showModal = ref(false)
const showAdd = ref(false)


const categoryItems = ref([
    { id: 1, itemName: '自己' },
    { id: 2, itemName: '父母' },
    { id: 3, itemName: '孩子' },
])
const selectedCategory = ref(categoryItems.value[0])
const newAdd = ref('')

const emit = defineEmits(['update:modelValue'])
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
    newAdd.value = ''
    showAdd.value = false
    showModal.value = false
}

const removeItem = (id) => {
    categoryItems.value = categoryItems.value.filter(i => i.id !== id)
    if (selectedCategory.value?.id === id) {
        selectedCategory.value = categoryItems.value[0] || null
        emit('update:modelValue', selectedCategory.value)
    }
}
</script>

<template>
<div class="picker-trigger" @click="showModal = true">
        <span class="current-icon">👤</span> <span class="current-name">{{ selectedCategory?.itemName }}</span>

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
                        <div v-for="item in categoryItems" :key="item.id" 
                             class="tag-pill" @click="selectCategory(item)">
                            {{ item.itemName }}
                            <span style="margin-left:8px; font-size:10px; color:#94a3b8" @click.stop="removeItem(item.id)">✕</span>
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