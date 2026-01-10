<script setup>
import { ref, onMounted } from 'vue'
import { useCategoryStore } from '@/stores/useCategoryStore'
import { storeToRefs } from 'pinia'

/* ---------- 狀態控制 ---------- */
const showModal = ref(false)
const showAdd = ref(false)

const categoryStore = useCategoryStore()
// 🌟 假設你在 Store 裡新增了 incomeCategories，或直接用 categories 並過濾
const { incomeCategories: categoryItems } = storeToRefs(categoryStore)

const props = defineProps({
    modelValue: Object,
    account: Object // 消除 Extraneous attributes 警告
})
const emit = defineEmits(['update:modelValue'])

const selectedCategory = ref(null)
const newAdd = ref('')
const newIcon = ref('💰')
const iconOptions = ['💰', '💳', '💵', '🏦', '📈', '📉', '🧾', '📱', '🪙', '🏃', "🐵", "🐶", "🐷", "🐻", "🐨", "🐮", "🦁", "🐯", "🐰", "🐭", "🦉", "🐸"]

onMounted(() => {
    if (categoryItems.value && categoryItems.value.length > 0) {
        selectedCategory.value = categoryItems.value[0]
        emit('update:modelValue', selectedCategory.value)
    }
})

const selectCategory = (item) => {
    selectedCategory.value = item
    showModal.value = false
    emit('update:modelValue', item)
}

const addNewItem = () => {
    if (!newAdd.value.trim()) return
    const newItem = { id: Date.now(), itemName: newAdd.value, icon: newIcon.value }
    categoryStore.addCustomIncomeCategory(newItem) // 🌟 需在 Store 增加此 Action
    selectedCategory.value = newItem
    emit('update:modelValue', newItem)
    newAdd.value = ''; showAdd.value = false; showModal.value = false
}
</script>

<template>
    <div class="category-inn-root">
        <div class="picker-trigger" @click="showModal = true">
            <span class="current-icon">{{ selectedCategory?.icon || '❓' }}</span>
            <span class="current-name">{{ selectedCategory?.itemName || '請選擇類別' }}</span>
        </div>

        <Teleport to="body">
            <transition name="fade">
                <div v-if="showModal" class="modal-overlay" @click="showModal = false">
                    <div class="modal-content" @click.stop>
                        <div class="modal-header">
                            <h3>選擇收入類別</h3>
                            <button class="close-btn" @click="showModal = false">✕</button>
                        </div>
                        <div class="item-grid-four">
                            <div v-for="item in categoryItems" :key="item.id" class="grid-card"
                                @click="selectCategory(item)">
                                <span class="card-icon">{{ item.icon }}</span>
                                <span class="card-name">{{ item.itemName }}</span>
                            </div>
                        </div>
                        <div class="add-section-box">
                            <button class="toggle-btn" @click="showAdd = !showAdd">
                                <span>➕ 新增收入類別</span>
                                <span :class="{ rotate: showAdd }">⌄</span>
                            </button>
                            <div v-if="showAdd" class="expand-form">
                                <input v-model="newAdd" placeholder="類別名稱..." class="full-input" />
                                <div class="icon-selector-grid">
                                    <span v-for="icon in iconOptions" :key="icon" @click="newIcon = icon"
                                        :class="{ active: newIcon === icon }" class="icon-option">{{ icon }}</span>
                                </div>
                                <button class="btn-submit" @click="addNewItem">完成新增</button>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </Teleport>
    </div>
</template>

<style scoped>
/* 引用共用 CSS */
@import '../assets/css/add.css';

/* 內部微調：維持網格樣式一致性 */
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

/* 新增區塊 */
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
    color: #2563eb;
    cursor: pointer;
    padding-bottom: 10px;
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
    border-color: #2563eb;
    background: #eff6ff;
}

.btn-submit {
    width: 100%;
    background: #2563eb;
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