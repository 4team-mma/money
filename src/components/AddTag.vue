<script setup>
import { ref, computed, watch, onMounted } from 'vue' // 
import { useCategoryStore } from '@/stores/useCategoryStore'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'

/* ---------- 狀態控制 ---------- */
const showModal = ref(false)
const showAdd = ref(false)
const categoryStore = useCategoryStore()
const { tags: categoryItems } = storeToRefs(categoryStore)

const selectedIds = ref([]) // 初始為空，交給監聽器或掛載邏輯處理
const newAdd = ref('')
const newColor = ref('#ef4444')
const colors = ['#ef4444', '#3b82f6', '#004B97', '#22c55e', '#f97316', '#a855f7', '#ec4899']

const props = defineProps({
    modelValue: [Array, String]
})
const emit = defineEmits(['update:modelValue'])

/**
 * 🌟 監聽器：負責編輯時的資料回填
 */
watch(() => props.modelValue, (newVal) => {
    if (!newVal) return;

    let targetNames = [];
    if (typeof newVal === 'string') {
        targetNames = newVal.split(',').map(s => s.trim());
    } else if (Array.isArray(newVal)) {
        targetNames = newVal.map(i => typeof i === 'object' ? i.itemName : i);
    }

    const matchedIds = [];

    targetNames.forEach(name => {
        // 1. 先去 Store 找看看有沒有現成的標籤
        const found = categoryItems.value.find(tag => tag.itemName === name);

        if (found) {
            matchedIds.push(found.id);
        } else {
            // 2. 🌟 關鍵修正：如果在 Store 找不到 (代表自定義標籤因重新整理消失了)
            // 我們手動幫它重建一個臨時標籤，並加回 Store，這樣畫面就能顯示「可可愛愛」
            const tempId = Date.now() + Math.random(); // 產生臨時 ID
            const newTempTag = {
                id: tempId,
                itemName: name,
                color: '#94a3b8' // 給個預設的灰色 先暫時用這個方法QQ
            };
            // 將這個消失的自定義標籤塞回 Store 的 tags 陣列中
            categoryStore.tags.push(newTempTag);
            matchedIds.push(tempId);
        }
    });
    // 最後更新選中的 ID 列表
    selectedIds.value = matchedIds;
}, { immediate: true });


/**
 * 組件掛載時的預設值處理
 */
onMounted(() => {
    // 如果是「新增模式」(沒有傳入 modelValue) 且目前沒選中任何標籤
    if (!props.modelValue && selectedIds.value.length === 0) {
        // 預設選中 ID 為 1 的標籤 (假設 1 是「一般」)
        const hasGeneral = categoryItems.value.some(t => t.id === 1);
        if (hasGeneral) {
            selectedIds.value = [1];
            // 💡 重要：通知父組件現在選中的是「一般」，這樣儲存時才會有資料
            emit('update:modelValue', selectedItems.value);
        }
    }
});

/* ---------- 計算屬性與方法 (保持不變) ---------- */
const selectedItems = computed(() => {
    return categoryItems.value.filter(i => selectedIds.value.includes(i.id))
})

const displayText = computed(() => {
    if (selectedItems.value.length === 0) return '選擇標籤'
    return selectedItems.value.map(i => i.itemName).join(', ')
})

const toggleTag = (id) => {
    const index = selectedIds.value.indexOf(id)
    if (index > -1) {
        selectedIds.value.splice(index, 1)
        emit('update:modelValue', selectedItems.value)
    } else {
        // 計算「如果加上這個標籤」後的總長度
        const targetTag = categoryItems.value.find(t => t.id === id);
        if (!targetTag) return;

        // 計算目前已選標籤組合後的預估字串長度 (名稱 + 逗點)
        const currentNames = selectedItems.value.map(i => i.itemName);
        const nextTotalText = [...currentNames, targetTag.itemName].join(', ');

        if (nextTotalText.length > 100) {
            ElMessage.warning('已達到標籤總長度上限 (100 字)！');
            return;
        }

        selectedIds.value.push(id)
        emit('update:modelValue', selectedItems.value)
    }
}

const addNewItem = () => {
    const name = newAdd.value.trim();
    if (!name) return

    // 🌟 1. 限制單個標籤長度 (避免單個標籤就爆表)
    if (name.length > 15) {
        ElMessage.warning('單個標籤名稱限制 15 字以內！');
        return;
    }

    // 🌟 2. 限制總長度
    const currentNames = selectedItems.value.map(i => i.itemName);
    const nextTotalText = [...currentNames, name].join(', ');

    if (nextTotalText.length > 100) {
        ElMessage.warning('此標籤只能小於100字喔,太多標籤了!)！');
        return;
    }

    const newItem = { id: Date.now(), itemName: name, color: newColor.value }
    categoryStore.addCustomTag(newItem)
    selectedIds.value.push(newItem.id)
    newAdd.value = '';
    showAdd.value = false
    emit('update:modelValue', selectedItems.value)
}

const removeItem = (id) => {
    categoryStore.$patch((state) => {
        state.tags = state.tags.filter(i => i.id !== id)
    })
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
    emit('update:modelValue', selectedItems.value)
}

// 在 script 加入一個計算屬性
const remainingChars = computed(() => {
    const len = displayText.value === '選擇標籤' ? 0 : displayText.value.length;
    return 100 - len;
});

</script>

<template>
    <div class="picker-trigger" @click="showModal = true">
        <div class="tag-preview-group" v-if="selectedItems.length > 0">
            <span v-for="item in selectedItems" :key="item.id" class="color-dot"
                :style="{ backgroundColor: item.color }"></span>
            <span class="current-name">{{ displayText }}</span>
        </div>
        <span v-else class="current-name">選擇標籤</span>
    </div>

    <Teleport to="body">
        <transition name="fade">
            <div v-if="showModal" class="modal-overlay" @click="showModal = false">
                <div class="modal-content" @click.stop>
                    <div class="modal-header">
                        <h3>選擇標籤 (剩餘: {{ remainingChars }} 字)</h3>
                        <button class="confirm-btn" @click="showModal = false">完成</button>
                    </div>

                    <div class="tag-flex">
                        <div v-for="item in categoryItems" :key="item.id" class="tag-pill"
                            :class="{ active: selectedIds.includes(item.id) }" @click="toggleTag(item.id)">
                            <span class="color-dot" :style="{ backgroundColor: item.color }"></span>
                            {{ item.itemName }}
                            <span class="del-btn" @click.stop="removeItem(item.id)">✕</span>
                        </div>
                    </div>

                    <div class="add-section">
                        <div class="add-form">
                            <input v-model="newAdd" placeholder="新增標籤名稱" class="tag-input" @keyup.enter="addNewItem"
                                maxlength="15" />
                            
                            <div class="color-picker-wrapper">
                                <div v-for="c in colors" :key="c" @click="newColor = c" class="color-option">
                                    <span class="color-dot-large" :style="{ backgroundColor: c }"
                                        :class="{ 'is-selected': newColor === c }"></span>
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

/* 標籤預覽群組 */
.tag-preview-group {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden; /* 防止標籤太多爆版 */
}

/* 顏色選擇圓點容器 */
.color-picker-wrapper {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin: 15px 0;
    flex-wrap: wrap; /* 防止手機版顏色太多擠爆 */
}

.color-option {
    cursor: pointer;
}

.color-dot-large {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: block;
    transition: transform 0.2s;
    border: 2px solid transparent;
}

/* 選中顏色的狀態 */
.color-dot-large.is-selected {
    /* 使用變數確保在深色模式下選中框也看得清楚 */
    outline: 2px solid var(--color-primary); 
    outline-offset: 3px;
    transform: scale(1.1);
}

.btn-submit-large {
    width: 100%;
    background-color: var(--color-primary); /* 原本 #3b82f6 */
    color: var(--text-inverse); /* 原本 white */
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
    border: 1px solid var(--border-color); /* 原本 #e2e8f0 */
    border-radius: 10px;
    box-sizing: border-box;
    background: var(--bg-input); /* 補上輸入框背景 */
    color: var(--text-primary);  /* 補上輸入框文字 */
}

/* 刪除按鈕微調 */
.del-btn {
    margin-left: 8px;
    font-size: 10px;
    color: var(--text-secondary);
    cursor: pointer;
}
.del-btn:hover {
    color: var(--color-danger);
}
</style>