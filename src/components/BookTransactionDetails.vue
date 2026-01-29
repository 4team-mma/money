<script setup>
    import { ref, onMounted, onUnmounted, computed } from "vue";
    import EditTransferForm from './EditTransferForm.vue'
    import EditRecordForm from './EditRecordForm.vue'
    import { useAddRecord } from '@/composables/useAddRecord'

    const props = defineProps({
        selectedDate: String,
        transactions: Array
    });

    const emit = defineEmits(["deleteTransaction", "refreshList"]);

    // 控制哪一個項目的下拉選單是開啟的 (存儲 index)
    const activeMenuIndex = ref(null);

    // 切換選單顯示/隱藏
    const toggleMenu = (event, index) => {
        event.stopPropagation(); // 防止點擊事件冒泡
        activeMenuIndex.value = activeMenuIndex.value === index ? null : index;
    };

    // 點擊頁面其他地方時關閉選單
    const closeMenu = () => {
        activeMenuIndex.value = null;
    };

    onMounted(() => {
        window.addEventListener('click', closeMenu);
    });

    onUnmounted(() => {
        window.removeEventListener('click', closeMenu);
    });

    // 格式化金額
    const formatNumber = (num) => {
        return num ? Number(num).toLocaleString() : 0;
    };

    // 編輯 Modal 控制
    const showModal = ref(false);
    // 🌟 2. 用來存放「目前正在編輯的那一筆資料」
    const selectedTransaction = ref(null);

    const { setFormData } = useAddRecord(); 

    // 2. 修改你的 openEditModal
    const openEditModal = (item) => {
        // 1. 這裡的 item 已經是 map 過後的格式，直接存入
        selectedTransaction.value = { ...item };
        
        // 2. 呼叫解構出來的 setFormData
        // 它會自動處理 form.account = { account_id: data.account_id, ... } 的邏輯
        setFormData(item);
        
        showModal.value = true;
    };



    /**
     * 處理儲存成功後的動作
     */
    const handleSaveSuccess = () => {
        showModal.value = false; // 關閉視窗
        emit("refreshList"); // 🌟 通知父層（Book.vue）重新抓資料，畫面才會更新
    };

    // 計算目前該顯示哪一個組件
    const currentFormComponent = computed(() => {
        return selectedTransaction.value?.add_type === 'transfer' 
            ? EditTransferForm 
            : EditRecordForm
    })
</script>

<template>
    <div class="details-section">
        <h3 class="details-title">{{ selectedDate || "請選擇日期" }}</h3>

        <div v-if="transactions.length > 0" class="transactions-scroll">
            <div v-for="(t, index) in transactions" :key="index" class="transaction-item">
                <!-- 左側：內容 -->
                <div class="transaction-info">
                    <div class="transaction-icon" :class="{ 'income': t.add_type === true, 'expense': t.add_type === false, 'transfer': t.add_type === 'transfer' }">
                        <span v-if="t.add_class_icon">{{ t.add_class_icon }}</span>
                        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline v-if="t.add_type" points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline v-else points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                        </svg>
                    </div>
                    <div>
                        <div class="transaction-name">
                            <!-- 如果是轉帳，顯示從哪到哪 -->
                            <template v-if="t.add_type === 'transfer'">
                                {{ t.source_account }} ➔ {{ t.account_name }}
                            </template>
                            <template v-else>
                                {{ t.add_class }}
                            </template>
                        </div>
                        <div class="transaction-category">
                            <template v-if="t.add_type === 'transfer'">
                                {{ t.add_note }}
                            </template>
                            <template v-else>
                                {{ t.add_member }}<span v-if="t.add_note"> | {{ t.add_note }}</span>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- 右側：金額與自定義選單 -->
                <div class="transaction-details">
                    <template v-if="t.add_type === 'transfer'">
                        <div class="transaction-amount">
                            {{ t.currency }} {{ formatNumber(t.add_amount) }}
                        </div>
                    </template>
                    <template v-else>
                        <div class="transaction-amount" :class="{ income: t.add_type }">
                            {{ t.add_type ? '+' : '-' }}{{ t.currency }} {{ formatNumber(t.add_amount) }}
                        </div>
                        <div class="transaction-account-name">{{ t.account_name }}</div>
                    </template>
                </div>

                <!-- 🌟 純 Vue 下拉選單結構 -->
                <div class="custom-dropdown">
                    <button class="menu-btn" @click="toggleMenu($event, index)">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                    </button>
                    
                    <!-- 使用 Vue 的 v-if 控制顯示 -->
                    <ul v-if="activeMenuIndex === index" class="custom-dropdown-menu">
                        <li @click="openEditModal(t)">編輯</li>
                        <li class="delete-opt" @click="emit('deleteTransaction', t.add_type, t.add_id)">刪除</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- 編輯彈窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card">
            <!-- 使用動態組件 -->
            <component 
                :is="currentFormComponent"
                :key="selectedTransaction?.add_id"
                :initialData="selectedTransaction" 
                @save-success="handleSaveSuccess" 
                @cancel="showModal = false" 
            />
        </div>
    </div>

</template>

<style scoped>
    @import "../assets/css/bookTransactionDetails.css";
</style>
