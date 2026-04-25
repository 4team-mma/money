<script setup>
//BookTransactionDetails.vue
import { ref, onMounted, onUnmounted, computed } from "vue";
import EditTransferForm from './EditTransferForm.vue'
import EditRecordForm from './EditRecordForm.vue'
import { useAddRecord } from '@/composables/useAddRecord'
import BookEditEventForm from "./BookEditEventForm.vue";
const props = defineProps({
    selectedDate: String,
    transactions: Array,
    displayMode: String
});



const emit = defineEmits(["deleteTransaction", "refreshList", "change-view", "trigger-cleanup"]);

// 點擊日期標題的處理函數
const handleDateClick = (date) => {
    // 只有在月模式時點擊才有效
    if (props.displayMode === 'month') {
        emit("change-view", { mode: 'day', date: date });
    }
};

// 根據目前資料是否有跨日期，決定是否顯示日期標籤
const groupedTransactions = computed(() => {
    const groups = {};
    filteredTransactions.value.forEach(t => {
        const itemDate = t.add_date; // 取得日期
        if (!groups[itemDate]) {
            groups[itemDate] = {
                date: itemDate,
                list: [],
                dayTransfer: 0,
                dayIncome: 0,
                dayExpense: 0
            };
        }
        groups[itemDate].list.push(t);

        // 加總每日小計
        if (t.add_type === 'transfer') {
            groups[itemDate].dayTransfer += Number(t.add_amount);
        } else if (t.add_type === true) {
            groups[itemDate].dayIncome += Number(t.add_amount);
        } else if (t.add_type === false) {
            groups[itemDate].dayExpense += Number(t.add_amount);
        }
    });

    // 由新到舊排序
    return Object.keys(groups)
        .sort((a, b) => b.localeCompare(a))
        .map(key => groups[key]);
});

// 標題顯示邏輯
const displayTitle = computed(() => {
    // 1. 如果是日模式，直接顯示選中的日期
    if (props.displayMode === 'day') {
        return props.selectedDate || "請選擇日期";
    }

    // 2. 如果是月模式，且有交易資料，顯示「年份-月份 全月紀錄」
    if (props.displayMode === 'month' && props.transactions?.length > 0) {
        const firstDate = props.transactions[0].add_date;
        return firstDate ? `${firstDate.substring(0, 7)} 全月紀錄` : "無資料";
    }

    // 3. 預設回傳
    return "請選擇日期";
});

// 定義頁籤狀態：'all' (收支+轉帳), 'record' (收支), 'transfer' (轉帳)
const currentTab = ref('all');

// 根據頁籤過濾資料
const filteredTransactions = computed(() => {
    if (currentTab.value === 'record') {
        // 只留收支 (add_type 是 boolean true/false)
        return props.transactions.filter(t => typeof t.add_type === 'boolean');
    } else if (currentTab.value === 'transfer') {
        // 只留轉帳 (add_type 為 'transfer')
        return props.transactions.filter(t => t.add_type === 'transfer');

    } else if (currentTab.value === 'event') {
        // 🌟 新增：只顯示 Google 行程
        return props.transactions.filter(t => t.add_type === 'event');

    }
    // 預設顯示全部
    return props.transactions;
});

// 控制哪一個項目的下拉選單是開啟的 (存儲 index)
const activeMenuIndex = ref(null);

// 切換選單顯示/隱藏
const toggleMenu = (event, id) => {
    event.stopPropagation(); // 防止點擊事件冒泡
    activeMenuIndex.value = activeMenuIndex.value === id ? null : id;
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
    // 1. 只有我們確定的 'event' 才用新表單
    if (selectedTransaction.value?.add_type === 'event') {
        return BookEditEventForm;
    }

    // 2. 其餘所有情況 (包含隊友原本的收支與轉帳) 走原本邏輯
    return selectedTransaction.value?.add_type === 'transfer'
        ? EditTransferForm
        : EditRecordForm;
});

</script>

<template>
    <div class="details-section">
        <h3 class="details-title">{{ displayTitle }}</h3>

        <!-- 頁籤切換器 -->
        <div class="tab-container">
            <button :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'">全部</button>
            <button :class="{ active: currentTab === 'record' }" @click="currentTab = 'record'">收支</button>
            <button :class="{ active: currentTab === 'transfer' }" @click="currentTab = 'transfer'">轉帳</button>
            <button :class="{ active: currentTab === 'event' }" @click="currentTab = 'event'">行程</button>
        </div>

        <div v-if="groupedTransactions.length > 0" class="transactions-scroll">
            <div v-for="group in groupedTransactions" :key="group.date" class="date-group">
                <!-- 如果是「按月顯示」，顯示日期分隔線 -->
                <div v-if="displayMode === 'month'" class="date-divider clickable" @click="handleDateClick(group.date)"
                    title="切換至此日檢視">
                    <span class="divider-date">{{ group.date }} 🔍</span>
                    <div class="divider-totals">
                        <span v-if="group.dayIncome > 0" class="day-income">收入: {{ formatNumber(group.dayIncome)
                            }}</span>
                        <span v-if="group.dayExpense > 0" class="day-expense">支出: {{ formatNumber(group.dayExpense)
                            }}</span>
                        <span v-if="group.dayTransfer > 0">轉帳: {{ formatNumber(group.dayTransfer) }}</span>
                    </div>
                </div>

                <!-- 內層：交易項目 -->
                <div v-for="(t, index) in group.list" :key="t.add_id" class="transaction-item">
                    <!-- 左側：內容 -->
                    <div class="transaction-info">
                        <div class="transaction-icon"
                            :class="{ 'income': t.add_type === true, 'expense': t.add_type === false, 'transfer': t.add_type === 'transfer' }">
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
                                
                                <template v-else-if="t.add_type === 'event'">
                                    <span style="font-weight: bold; color: var(--color-primary);">
                                        {{ t.add_class }} </span>
                                    <span style="margin-left: 8px; font-size: 0.85em; color: #666;">
                                        {{ t.add_note }} </span>
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
                                    <div v-if="t.add_tag" class="tag-group">
                                        <span v-for="tag in t.add_tag.split(',')" :key="tag" class="tag-item">
                                            {{ tag.trim() }}
                                        </span>
                                    </div>
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
                            <div class="transaction-amount" :class="{ income: t.add_type }"
                                v-if="t.add_type !== 'event'">
                                {{ t.add_type ? '+' : '-' }}{{ t.currency }} {{ formatNumber(t.add_amount) }}
                            </div>
                            <div class="transaction-amount" v-else>
                                查看詳情
                            </div>
                        </template>
                    </div>

                    <!-- 🌟 純 Vue 下拉選單結構 -->
                    <div class="custom-dropdown">
                        <button class="menu-btn" @click="toggleMenu($event, t.add_id)">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path
                                    d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                            </svg>
                        </button>

                        <!-- 使用 Vue 的 v-if 控制顯示 -->
                        <ul v-if="activeMenuIndex === t.add_id" class="custom-dropdown-menu">
                            <li @click="openEditModal(t)">編輯</li>
                            <li class="delete-opt" @click="emit('deleteTransaction', t.add_type, t.add_id)">刪除</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- 若過濾後沒資料的顯示 -->
        <div v-else class="no-data">
    <p>目前沒有相關紀錄</p>
    
    <div v-if="currentTab === 'event'" style="margin-top: 15px;">
        <p style="font-size: 12px; color: #999; margin-bottom: 8px;">(開發測試) 如果手機出現重複行程，請點擊下方按鈕清理喵！</p>
        <button class="btn-cleanup-dev" @click="$emit('trigger-cleanup')">
            🧹 清除 Google 重複行程
        </button>
    </div>
</div>

    </div>

    <!-- 編輯彈窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-card">
            <!-- 使用動態組件 -->
            <component :is="currentFormComponent" :key="selectedTransaction?.add_id" :initialData="selectedTransaction"
                @save-success="handleSaveSuccess" @cancel="showModal = false" />
        </div>
    </div>

</template>

<style scoped>
@import "../assets/css/bookTransactionDetails.css";

.tab-container button.active {
    background: var(--color-primary);
    color: var(--text-inverse);
}

.btn-cleanup-dev {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-cleanup-dev:hover {
  background: #fde68a;
}


</style>
