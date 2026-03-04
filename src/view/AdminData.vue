<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import AdminsComments from './AdminsComments.vue'
import AdminModel from './AdminModel.vue'

// 接收父組件狀態
const props = defineProps({
    activeTab: String,
    tabs: Array,
    currentStyle: Object,
    currentLoginAdmin: Object,
    themes: Object,
    currentTheme: String
})

// 通知父組件動作
const emit = defineEmits(['open-edit', 'set-theme'])

const userStore = useUserStore()
const categoryStore = useCategoryStore()
const searchQuery = ref('')

/* ========================
   分頁邏輯
   ======================== */
const currentPage = ref(1)
const perPage = 20
const skip = computed(() => (currentPage.value - 1) * perPage)

const changePage = async (page) => {
    currentPage.value = page
    const skipVal = (page - 1) * perPage
    await userStore.fetchUsers(skipVal, perPage)
}

/* ========================
   數據分析：子分頁切換
   ======================== */
const subActiveTab = ref('topSpenders')
const subTabs = [
    { id: 'topSpenders', label: '用戶價值分析' },
    { id: 'categories', label: '支出/收入類別統計' },
    { id: 'activeBees', label: '資產/負債帳戶分析' }
]

// 表格切換鈕
const currentCategoryType = ref(0)

/* ========================
   初始載入
   ======================== */
onMounted(async () => {
    await userStore.fetchUsers(0, perPage)
    await categoryStore.fetchDashboardSummary() //小卡
    await categoryStore.fetchAllRankings() // 確保排行榜數據有抓取
    await categoryStore.fetchCategoryAnalysis() //類別支出統計
    await categoryStore.fetchAccountAnalysis() //資產/負債
})

/* ========================
   數據計算與過濾
   ======================== */
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
}).format(val || 0)

const rankingsFilter = (list) => {
    if (!list) return [];
    return list.filter(u => u.role === 'user');
};

const totalTransactionAmount = computed(() => {
    if (!userStore.users) return 0
    return userStore.users
        .filter(u => u.role === 'user')
        .reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
})

const adminFiltered = computed(() => {
    return userStore.formattedAdmins.filter(a =>
        (a.name || '').includes(searchQuery.value) ||
        (a.username || '').includes(searchQuery.value)
    )
})

const normalUsersFiltered = computed(() => {
    return userStore.formattedNormalUsers.filter(u => {
        const search = searchQuery.value.toLowerCase();
        return (
            (u.username || '').toLowerCase().includes(search) ||
            (u.name || '').toLowerCase().includes(search) ||
            (u.email || '').toLowerCase().includes(search)
        );
    });
});


// 紀錄目前的排序設定
const sortConfig = ref({
    key: null,    // 目前排序的欄位 (例如: 'financials.monthly_income')
    order: 'desc' // 'asc' 或 'desc'
});

// 處理排序的方法
const handleSort = (key) => {
    if (sortConfig.value.key === key) {
        sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.value.key = key;
        sortConfig.value.order = 'desc'; // 新點擊欄位預設由大到小
    }
};
const sortedUsers = computed(() => {
    const items = [...userStore.userInsights];
    if (!sortConfig.value.key) return items;

    const { key, order } = sortConfig.value;

    return items.sort((a, b) => {
        let valA, valB;

        // ✨ 關鍵修正：如果是收支比，手動計算數值
        if (key === 'financials.ratio') {
            valA = a.financials.monthly_income > 0 ? (a.financials.monthly_spent / a.financials.monthly_income) : 0;
            valB = b.financials.monthly_income > 0 ? (b.financials.monthly_spent / b.financials.monthly_income) : 0;
        } else {
            // 其他一般欄位
            const getVal = (obj, path) => path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
            valA = getVal(a, key);
            valB = getVal(b, key);
        }

        const nA = Number(valA ?? 0);
        const nB = Number(valB ?? 0);

        if (nA === nB) return 0;
        return order === 'asc' ? (nA > nB ? 1 : -1) : (nA < nB ? 1 : -1);
    });
});

// 針對類別分析數據的排序邏輯
const sortedCategories = computed(() => {
    // 1. 複製資料，避免直接修改 Store 原生數據
    const items = [...categoryStore.categoryAnalysis];

    // 2. 如果沒有排序 key，直接回傳
    if (!sortConfig.value.key) return items;

    const { key, order } = sortConfig.value;

    return items.sort((a, b) => {
        // ✨ 關鍵邏輯：判斷是否為「其他」類別
        const isAOther = a.category === '其他';
        const isBOther = b.category === '其他';

        // 如果 a 是其他，b 不是，a 往後排 (回傳 1)
        if (isAOther && !isBOther) return 1;
        // 如果 b 是其他，a 不是，b 往後排 (回傳 -1)
        if (!isAOther && isBOther) return -1;
        // 如果兩者都是其他，則不移動位置
        if (isAOther && isBOther) return 0;

        // --- 以下為原本的排序邏輯 (僅在兩者皆非「其他」時執行) ---
        if (!key) return 0;

        let valA = a[key];
        let valB = b[key];

        // 處理字串排序
        if (typeof valA === 'string') {
            return order === 'asc'
                ? valA.localeCompare(valB, 'zh-Hant')
                : valB.localeCompare(valA, 'zh-Hant');
        }

        // 處理數字排序
        const nA = Number(valA ?? 0);
        const nB = Number(valB ?? 0);

        if (nA === nB) return 0;
        return order === 'asc' ? nA - nB : nB - nA;
    });
});

// 針對帳戶資產/負債分析數據的排序邏輯
const sortedAccounts = computed(() => {
    let items = [...(categoryStore.accountAnalysis || [])];
    const assetKeys = ['cash', 'bank', 'investment', 'savings', 'other'];

    // 1. 分離資產與負債清單
    const assets = items.filter(item => assetKeys.includes(item.account_type));
    const debts = items.filter(item => !assetKeys.includes(item.account_type));

    // 2. 根據目前分頁決定顯示哪一組，並計算該組的「局部總額」作為分母
    let displayItems = [];
    let groupTotal = 0;

    if (currentCategoryType.value === 0) {
        displayItems = assets;
        // 計算總資產 (加總所有正數)
        groupTotal = assets.reduce((sum, item) => sum + Math.abs(item.total_amount), 0);
    } else {
        displayItems = debts;
        // 計算總負債 (加總所有負債絕對值)
        groupTotal = debts.reduce((sum, item) => sum + Math.abs(item.total_amount), 0);
    }

    // 3. ✨ 動態重新計算配置比例
    const finalizedItems = displayItems.map(item => {
        const ratio = groupTotal > 0 
            ? ((Math.abs(item.total_amount) / groupTotal) * 100).toFixed(1) 
            : 0;
        return {
            ...item,
            allocation_ratio: ratio // 覆蓋後端原本的全局比例
        };
    });

    // 4. 執行排序
    if (!sortConfig.value.key) return finalizedItems;

    const { key, order } = sortConfig.value;
    return finalizedItems.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (typeof valA === 'string') {
            return order === 'asc' ? valA.localeCompare(valB, 'zh-Hant') : valB.localeCompare(valA, 'zh-Hant');
        }

        const nA = Number(valA ?? 0);
        const nB = Number(valB ?? 0);
        return order === 'asc' ? nA - nB : nB - nA;
    });
});


</script>

<template>
    <main class="main-content">

<div class="stat-container">
    <div class="stat-glass-card border-blue">
        <div class="stat-info">
            <span class="stat-label">總註冊用戶</span>
            <div class="stat-value text-blue">{{ categoryStore.summary.total_users || 0 }}</div>
        </div>
        <div class="stat-icon-bg">👥</div>
    </div>

    <div class="stat-glass-card border-purple">
        <div class="stat-info">
            <span class="stat-label">收/支總筆數</span>
            <div class="stat-value text-purple">{{ categoryStore.summary.total_transactions || 0 }}</div>
        </div>
        <div class="stat-icon-bg">📝</div>
    </div>

    <div class="stat-glass-card border-orange">
        <div class="stat-info">
            <span class="stat-label">平均操作活躍度</span>
            <div class="stat-value text-orange">{{ categoryStore.summary.avg_activity || '0%' }}</div>
        </div>
        <div class="stat-icon-bg">💻</div>
    </div>

    <div class="stat-glass-card border-cyan">
        <div class="stat-info">
            <span class="stat-label">平均帳務覆蓋率</span>
            <div class="stat-value text-cyan">{{ categoryStore.summary.avg_coverage || '0%' }}</div>
        </div>
        <div class="stat-icon-bg">🗓️</div>
    </div>
</div>

            <div class="content-glass-card"
                :style="{ backgroundColor: currentStyle.cardBg, borderColor: currentStyle.border }">

                <section class="tab-content">
                    <div class="sub-tab-nav">
                        <button v-for="sub in subTabs" :key="sub.id" class="sub-tab-item"
                            :class="{ active: subActiveTab === sub.id }" @click="subActiveTab = sub.id">
                            <span class="sub-tab-icon">{{ sub.icon }}</span>
                            {{ sub.label }}
                        </button>
                    </div>

                    <div v-if="subActiveTab === 'topSpenders'" class="animate-fade-in">
                        <div class="section-header">
                        </div>
                        <div class="table-wrapper mma-main-table">
                            <table class="mma-table">
                                <thead>
                                    <tr>
                                        <th>序號</th>
                                        <th @click="handleSort('username')" class="sortable-th">
                                            帳號
                                            <span class="sort-indicator" v-if="sortConfig.key === 'username'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>

                                        </th>

                                        <th @click="handleSort('status')" class="sortable-th">
                                            狀態
                                            <span class="sort-indicator" v-if="sortConfig.key === 'status'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>

                                            <span class="info-icon-wrapper">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>用戶狀態定義：</strong>
                                                    🟢 活躍：3天內有紀錄<br>
                                                    🟡 轉冷：14天內有紀錄<br>
                                                    🔴 流失：超過14天未上線
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('financials.monthly_income')" class="sortable-th">均月收入
                                            <span class="sort-indicator"
                                                v-if="sortConfig.key === 'financials.monthly_income'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                        </th>


                                        <th @click="handleSort('financials.monthly_spent')" class="sortable-th">
                                            均月支出
                                            <span class="sort-indicator"
                                                v-if="sortConfig.key === 'financials.monthly_spent'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>

                                        </th>

                                        <th @click="handleSort('financials.ratio')" class="sortable-th">
                                            收支比
                                            <span class="sort-indicator" v-if="sortConfig.key === 'financials.ratio'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                            <span class="info-icon-wrapper">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>計算公式：</strong>
                                                    平均月支出 / 平均月收入
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('financials.net_worth')" class="sortable-th">
                                            淨資產
                                            <span class="sort-indicator"
                                                v-if="sortConfig.key === 'financials.net_worth'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>

                                        </th>

                                        <th @click="handleSort('engagement.active_rate')" class="sortable-th">
                                            操作活躍度
                                            <span class="sort-indicator"
                                                v-if="sortConfig.key === 'engagement.active_rate'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>

                                            <span class="info-icon-wrapper is-right">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>計算公式：</strong>
                                                    實際操作的天數 / 註冊總天數<br>
                                                    (反映用戶的上線頻率)
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('engagement.coverage_rate')" class="sortable-th">
                                            帳務覆蓋率
                                            <span class="sort-indicator"
                                                v-if="sortConfig.key === 'engagement.coverage_rate'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>

                                            <span class="info-icon-wrapper is-right">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>計算公式：</strong>
                                                    有帳務紀錄的天數 / 註冊總天數<br>
                                                    (反映用戶記帳完整度)
                                                </div>
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(u, i) in sortedUsers" :key="u.username">
                                        <td><span class="rank-badge">{{ i + 1 }}</span></td>
                                        <td class="font-bold opacity-80">{{ u.username }}</td>
                                        <td>
                                            <span :class="['status-badge', u.status]">
                                                {{ u.status === 'green' ? '🟢 活躍' : u.status === 'yellow' ? '🟡 轉冷' :
                                                    '🔴 流失' }}
                                            </span>
                                        </td>
                                        <td class="amount-text income">{{ formatCurrency(u.financials.monthly_income) }}
                                        </td>
                                        <td class="amount-text expense">{{ formatCurrency(u.financials.monthly_spent) }}
                                        </td>

                                        <td class="opacity-80">
                                            {{ u.financials.monthly_income > 0 ? (u.financials.monthly_spent /
                                                u.financials.monthly_income).toFixed(2) : 'N/A' }}
                                        </td>

                                        <td class="font-bold">{{
                                            formatCurrency(u.financials.net_worth) }}</td>

                                        <td class="opacity-80">
                                            {{ (u.engagement.active_rate || 0).toFixed(1) }}%
                                        </td>

                                        <td class="opacity-80">
                                            {{ (u.engagement.coverage_rate || 0).toFixed(1) }}%
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <!-- 收支類別統計 -->
                    <div v-if="subActiveTab === 'categories'" class="animate-fade-in">

                        <div class="analysis-tab-group">
                            <button @click="currentCategoryType = 0; categoryStore.fetchCategoryAnalysis(0)"
                                :class="['tab-btn', currentCategoryType === 0 ? 'active' : '']">
                                支出分析
                            </button>
                            <button @click="currentCategoryType = 1; categoryStore.fetchCategoryAnalysis(1)"
                                :class="['tab-btn', currentCategoryType === 1 ? 'active' : '']">
                                收入分析
                            </button>
                        </div>

                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead>
                                    <tr>
                                        <th>序號</th>
                                        <th @click="handleSort('category')" class="sortable-th">
                                            {{ currentCategoryType === 0 ? '支出類別' : '收入類別' }}
                                            <span class="sort-indicator" v-if="sortConfig.key === 'category'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                        </th>

                                        <th @click="handleSort('avg_value')" class="sortable-th">
                                            均值
                                            <span class="sort-indicator" v-if="sortConfig.key === 'avg_value'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                            <span class="info-icon-wrapper">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>均值定義：</strong>
                                                    該類別所有支出金額的平均值<br>
                                                    (已排除無效 NULL 資料)
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('median_value')" class="sortable-th">
                                            中位數
                                            <span class="sort-indicator" v-if="sortConfig.key === 'median_value'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                            <span class="info-icon-wrapper">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>中位數定義：</strong>
                                                    金額排序後的中間值<br>
                                                    (已排除無效 NULL 資料)
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('amount_ratio')" class="sortable-th">
                                            金額佔比
                                            <span class="sort-indicator" v-if="sortConfig.key === 'amount_ratio'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                            <span class="info-icon-wrapper">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>計算公式：</strong>
                                                    該項目總金額 / 所有項目總金額
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('user_coverage')" class="sortable-th">
                                            使用者覆蓋率
                                            <span class="sort-indicator" v-if="sortConfig.key === 'user_coverage'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                            <span class="info-icon-wrapper is-right">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>計算公式：</strong>
                                                    有使用該類別的人數 / 總用戶數
                                                </div>
                                            </span>
                                        </th>

                                        <th @click="handleSort('freq_ratio')" class="sortable-th">
                                            頻次佔比
                                            <span class="sort-indicator" v-if="sortConfig.key === 'freq_ratio'">
                                                <span v-if="sortConfig.order === 'asc'">▲</span>
                                                <span v-else>▼</span>
                                            </span>
                                            <span class="info-icon-wrapper is-right">
                                                <i class="info-i">i</i>
                                                <div class="info-tooltip">
                                                    <strong>計算公式：</strong>
                                                    該類別記錄筆數 / 總記錄筆數
                                                </div>
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(cat, i) in sortedCategories" :key="`cat-${cat.category}-${i}`">
                                        <td><span class="rank-badge">{{ i + 1 }}</span></td>
                                        <td class="font-bold opacity-80">{{ cat.category }}</td>

                                        <td :class="['amount-text', currentCategoryType === 0 ? 'expense' : 'income']">
                                            {{ formatCurrency(cat.avg_value) }}
                                        </td>

                                        <td class="amount-text">
                                            {{ formatCurrency(cat.median_value) }}
                                        </td>

                                        <td class="font-bold">
                                            {{ (cat.amount_ratio || 0).toFixed(1) }}%
                                        </td>

                                        <td class="opacity-80">
                                            {{ (cat.user_coverage || 0).toFixed(1) }}%
                                        </td>

                                        <td class="opacity-80">
                                            {{ (cat.freq_ratio || 0).toFixed(1) }}%
                                        </td>
                                    </tr>
                                    <tr v-if="sortedCategories.length === 0">
                                        <td colspan="7" style="text-align: center; padding: 40px; opacity: 0.5;">
                                            暫無 {{ currentCategoryType === 0 ? '支出' : '收入' }} 類別數據
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <!-- 資產負債 -->
                <div v-if="subActiveTab === 'activeBees'" class="animate-fade-in">
                    <div class="analysis-tab-group">
                        <button @click="currentCategoryType = 0; categoryStore.fetchAccountAnalysis(0)"
                            :class="['tab-btn', currentCategoryType === 0 ? 'active' : '']">
                            資產分析
                        </button>
                        <button @click="currentCategoryType = 1; categoryStore.fetchAccountAnalysis(1)"
                            :class="['tab-btn', currentCategoryType === 1 ? 'active' : '']">
                            負債分析
                        </button>
                    </div>
                    <div class="section-header">
                    </div>
                    <div class="table-wrapper mma-main-table">
                        <table class="mma-table">
                            <thead>
                                <tr>
                                    <th>序號</th>
                                    <th @click="handleSort('account_type')" class="sortable-th">
                                        {{ currentCategoryType === 0 ? '資產類別' : '負債類別' }}
                                        <span class="sort-indicator" v-if="sortConfig.key === 'account_type'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                    </th>

                                    <th @click="handleSort('total_amount')" class="sortable-th">
                                        帳戶總額
                                        <span class="sort-indicator" v-if="sortConfig.key === 'total_amount'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                        <span class="info-icon-wrapper">
                                            <i class="info-i">i</i>
                                            <div class="info-tooltip">
                                                <strong>定義：</strong>
                                                該類別所有帳戶金額加總
                                            </div>
                                        </span>
                                    </th>

                                    <th @click="handleSort('allocation_ratio')" class="sortable-th">
                                        配置比例
                                        <span class="sort-indicator" v-if="sortConfig.key === 'allocation_ratio'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                        <span class="info-icon-wrapper">
                                            <i class="info-i">i</i>
                                            <div class="info-tooltip">
                                                <strong>計算公式：</strong>
                                                此類別金額 / 所有類別總額
                                            </div>
                                        </span>
                                    </th>

                                    <th @click="handleSort('penetration_rate')" class="sortable-th">
                                        滲透率
                                        <span class="sort-indicator" v-if="sortConfig.key === 'penetration_rate'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                        <span class="info-icon-wrapper">
                                            <i class="info-i">i</i>
                                            <div class="info-tooltip">
                                                <strong>計算公式：</strong>
                                                持有該帳戶類型的用戶數 / 總用戶數
                                            </div>
                                        </span>
                                    </th>

                                    <th @click="handleSort('avg_count_per_user')" class="sortable-th">
                                        平均帳戶數
                                        <span class="sort-indicator" v-if="sortConfig.key === 'avg_count_per_user'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                        <span class="info-icon-wrapper is-right">
                                            <i class="info-i">i</i>
                                            <div class="info-tooltip">
                                                <strong>定義：</strong>
                                                擁有該類別帳戶的用戶中，<br>
                                                平均擁有的帳戶個數
                                            </div>
                                        </span>
                                    </th>

                                    <th @click="handleSort('avg_amount_per_user')" class="sortable-th">
                                        帳戶平均總額
                                        <span class="sort-indicator" v-if="sortConfig.key === 'avg_amount_per_user'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                        <span class="info-icon-wrapper is-right">
                                            <i class="info-i">i</i>
                                            <div class="info-tooltip">
                                                <strong>計算公式：</strong>
                                                該類別所有帳戶的總金額  / <br>
                                                該類別的持有者人數
                                            </div>
                                        </span>
                                    </th>
                                    <th @click="handleSort('median_amount')" class="sortable-th">
                                        帳戶總額中位數
                                        <span class="sort-indicator" v-if="sortConfig.key === 'median_amount'">
                                            <span v-if="sortConfig.order === 'asc'">▲</span>
                                            <span v-else>▼</span>
                                        </span>
                                        <span class="info-icon-wrapper is-right">
                                            <i class="info-i">i</i>
                                            <div class="info-tooltip">
                                                <strong>定義：</strong>
                                                該類別下所有帳戶金額排序後的中間值
                                            </div>
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(item, i) in sortedAccounts" :key="`acc-${item.account_type}-${i}`">

                                    <td><span class="rank-badge">{{ i + 1 }}</span></td>

                                    <td class="opacity-80">{{ item.account_type }}</td>

                                    <td
                                        :class="['opacity-80', item.total_amount >= 0 ? 'income' : 'expense']">
                                        {{ formatCurrency(item.total_amount) }}
                                    </td>

                                    <td class="opacity-80">{{ item.allocation_ratio }}%</td>
                                    <td class="opacity-80">{{ item.penetration_rate }}%</td>
                                    <td class="opacity-80">{{ item.avg_count_per_user }} 個</td>
                                    <td class="opacity-80">{{ formatCurrency(item.avg_amount_per_user) }}
                                    </td>
                                    <td class="opacity-80">{{ formatCurrency(item.median_amount) }}</td>
                                </tr>

                                <tr v-if="!sortedAccounts || sortedAccounts.length === 0">
                                    <td colspan="8" style="text-align: center; padding: 40px; opacity: 0.5;">
                                        暫無帳戶分析數據
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>




                <!-- 模型區塊 -->
                <section v-if="activeTab === 'api'" class="tab-content animate-fade-in">
                    <AdminModel :currentStyle="currentStyle" />
                </section>
                <!-- 模型區塊結尾 -->


                <!-- 回饋區塊 -->
                <section v-if="activeTab === 'feedback'" class="tab-content">
                    <AdminsComments />
                </section>
                <!-- 回饋區塊結尾 -->

                <section v-if="activeTab === 'system'" class="tab-content">
                    <div class="section-header">
                        <h3>🎨 視覺主題設定</h3>
                    </div>
                    <div class="theme-picker">
                        <div v-for="(style, id) in themes" :key="id" class="theme-item"
                            :class="{ 'is-selected': currentTheme === id }" @click="emit('set-theme', id)">
                            <div class="theme-preview" :style="{ background: style.bgGradient }">
                                <div class="preview-sidebar" :style="{ background: style.sidebarBg }"></div>
                                <div class="preview-accent" :style="{ background: style.primary }"></div>
                            </div>
                            <span>{{ style.name }}</span>
                        </div>
                    </div>
                </section>
            </div>
    </main>
</template>

<style scoped>
@import "../assets/css/admin.css";


.stat-icon-bg{
    transform: scale(2,2);
    padding-right: 20%;
}

.rank-badge {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    /* 改成圓角矩形也很好看 */
    color: white;
    font-weight: 900;
    font-size: 12px;
    /* ✨ 新增背景顏色，字才看得到 */
    background-color: #c7c7c7;
}

/* 1. 關鍵：確保表頭 th 容器不會切掉溢出的內容 */
.mma-table thead th {
    overflow: visible !important;
    position: relative;
    z-index: 50;
    /* 讓表頭層級高於 body 的內容 */
}

/* 小 i 的外層：微調垂直位置 */
.info-icon-wrapper {
    display: inline-flex;
    vertical-align: super;
    /* ✨ 讓它像上標一樣浮起來 */
    margin-left: 2px;
    cursor: help;
}

/* 3. 黑色彈出框：強制向下彈出並調整寬度 */
.info-tooltip {
    display: none;
    position: absolute;

    /* ✨ 關鍵修正：不要用 100%，改用固定 px */
    /* 因為 info-icon-wrapper 是在文字右上角，20px 剛好會出現在文字下方 */
    top: 20px;
    left: 50%;
    transform: translateX(-50%);

    background: rgba(0, 0, 0, 0.9);
    padding: 8px 12px;
    border-radius: 6px;
    z-index: 10000;
    width: max-content;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);

    /* 確保文字不會換行太嚴重 */
    white-space: nowrap;
}

/* 如果你在 Tooltip 內有使用 <br>，它依然會按照你的標記換行 */
.info-tooltip strong {
    color: #4facfe;
    display: block;
    /* 確保標題自成一行 */
    margin-bottom: 4px;
    /* ✨ 設定這個數值，你可以隨意微調 (例如 2px 或 4px) */
    white-space: nowrap;
    font-weight: 600;
}

.info-tooltip {
    display: none;
    position: absolute;

    /* ✨ 關鍵修正：縮短與小 i 的垂直距離 */
    top: 120%;
    /* 原本可能是 150% 或 180%，現在縮短距離 */
    left: 50%;
    transform: translateX(-50%);

    background: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.4;
    width: max-content;
    max-width: 250px;
    white-space: normal;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 5. 滑入顯示 */
.info-icon-wrapper:hover .info-tooltip {
    display: block;
}

/* 低調極小 i 本體 */
.info-i {
    width: 10px;
    /* 縮小 */
    height: 10px;
    /* 縮小 */
    font-size: 8px;
    /* 字體縮小 */
    background: #e0e0e0;
    /* 淡灰色，不搶戲 */
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-style: normal;
    transition: all 0.2s;
}

/* 針對右邊兩欄 (is-right) 的特殊偏移處理 */
.info-icon-wrapper.is-right .info-tooltip {
    left: auto;
    right: 0;
    /* 靠右對齊，防止超出螢幕 */
    transform: none;
}

/* 讓小箭頭也跟著上移 */
.info-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    /* 箭頭在框框頂部 */
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent rgba(0, 0, 0, 0.9) transparent;
}

/* is-right 的箭頭也要靠右 */
.info-icon-wrapper.is-right .info-tooltip::after {
    left: auto;
    right: 5px;
    /* 箭頭指在右邊小 i 的位置 */
    transform: none;
}

/* 調整滑入時的位移動畫，確保不會跑版 */
.info-icon-wrapper.is-right:hover .info-tooltip {
    transform: translateY(0);
    /* 保持在原位，或根據需求微調 */
}

/* 讓 th 變成 flex 佈局，方便對齊文字與小 i */
.sortable-th {
    cursor: pointer;
    white-space: nowrap;
    position: relative;
    /* 僅為了讓 tooltip 參考 */
}

.sortable-th:hover {
    background-color: rgba(0, 0, 0, 0.05);
    /* 淡淡的底色 */
}

/* 排序箭頭樣式 */
.sort-arrow {
    display: inline-block;
    width: 12px;
    font-size: 10px;
    margin-left: 4px;
    color: #bbb;
    /* 未選中時顏色淡淡的 */
}

/* 被選中的欄位箭頭變深色 */
.sortable-th:hover .sort-arrow,
.sortable-th[active="true"] .sort-arrow {
    color: #4facfe;
    /* 使用你的系統主題藍色 */
}

/* 讓容器成為定位基準，且不隨表格行高撐開而偏移 */
.info-icon-wrapper {
    display: inline-flex;
    position: relative;
    /* 關鍵：讓 tooltip 相對於這個小圖示定位 */
    vertical-align: middle;
    cursor: help;
}

.info-tooltip {
    display: none;
    position: absolute;

    /* ✨ 修正：鎖定在小 i 下方 20px 處，不再受 th 高度影響 */
    top: 20px;
    left: 50%;
    transform: translateX(-50%);

    background: rgba(0, 0, 0, 0.9);
    padding: 8px 12px;
    border-radius: 6px;
    z-index: 10000;
    width: max-content;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 讓箭頭緊貼 tooltip 頂部 */
.info-tooltip::after {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent rgba(0, 0, 0, 0.9) transparent;
}

/* 右側兩欄 (is-right) 讓框框往左長，不超出螢幕 */
.info-icon-wrapper.is-right .info-tooltip {
    left: auto;
    right: 0;
    transform: none;
}

.info-icon-wrapper.is-right .info-tooltip::after {
    left: auto;
    right: 5px;
    transform: none;
}

/* 1. 外層容器：確保 100% 寬度並定義深色邊框 */
.analysis-tab-group {
    display: flex;
    width: 100%;
    /* ✨ 填滿視窗關鍵 */
    margin-bottom: 10px;
    /* 與下方表格保持距離 */
    border: 1px solid #4E81EE;
    /* 跟妳截圖一樣的深色邊框 */
    border-radius: 15px;
    overflow: hidden;
    /* 確保內層按鈕選中時背景不會超出圓角 */
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    /* 輕微陰影增加層次感 */
}

/* 2. 按鈕基礎樣式 */
.tab-btn {
    flex: 1;
    /* ✨ 關鍵：兩個按鈕會自動等分寬度 (50% / 50%) */
    padding: 5px 0;
    /* 增加上下高度，讓點擊感更好 */
    font-size: 16px;
    font-weight: 600;
    /* 文字加粗 */
    color: #4E81EE;
    /* 未選中時的文字顏色 */
    background: transparent;
    border: none;
    /* 移除按鈕預設邊框 */
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

/* 3. 中間的分隔線 (只加在第一個按鈕右邊) */
.tab-btn:first-child {
    border-right: 5px solid #4E81EE;
}

/* 4. ✨ 選中狀態：深色背景 (模仿截圖二的 active 風格) */
.tab-btn.active {
    background-color: #4E81EE;
    /* 深色背景 */
    color: #ffffff !important;
    /* 白色文字 */
}

/* 5. 滑鼠懸停效果 (針對未選中的按鈕) */
.tab-btn:not(.active):hover {
    background-color: #f7fafc;
}

.stat-container {
    display: flex;            /* 開啟彈性佈局 */
    flex-direction: row;      /* 確保在同一水平行 */
    justify-content: space-between; /* 讓四個小卡均勻分佈 */
    gap: 16px;                /* 設定小卡之間的間距 */
    width: 100%;              /* 佔滿寬度 */
}

.stat-glass-card {
    flex: 1;                  /* 重要：讓四個小卡等寬平分空間 */
    min-width: 0;             /* 防止內容過長撐開卡片 */
    /* 您原本的卡片樣式保持不變 */
}



</style>