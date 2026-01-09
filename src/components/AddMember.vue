<script setup>
import { ref } from 'vue'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { storeToRefs } from 'pinia'

const showModal = ref(false)
const showAdd = ref(false)

const props = defineProps(['modelValue']) // 建議補上以符合 Vue 規範
const emit = defineEmits(['update:modelValue'])

const categoryStore = useCategoryStore()
// 使用 storeToRefs 保持響應式連結
const { members: categoryItems } = storeToRefs(categoryStore)
// ... selectedCategory 初始化改為從 store 拿 ...
const selectedCategory = ref(categoryItems.value[0])

const newAdd = ref('')
const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    // 通知父組件
    emit('update:modelValue', item)
}

const addNewItem = () => {
    if (!newAdd.value.trim()) return
    const newItem = { id: Date.now(), itemName: newAdd.value }
    // ✅ 改為存入 Store
    categoryItems.value.push(newItem)

    // 💡 修正：選中新項目後，必須 emit 通知父組件更新 form.add_member
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