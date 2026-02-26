<script setup>
import { ref, onMounted, computed } from 'vue';
import { accountApi } from '@/api/account';
import AccountAdd1 from '@/components/AccountAdd1.vue';
import AccountEdit from '@/components/AccountEdit.vue';
import Nav from '@/components/Nav.vue';
import { ElMessage } from 'element-plus';
import { triggerMissionAction } from '@/api/gamification';
const accounts = ref([])

const assetTypes = [
    { value: 'cash', label: '現金 (資產項)' },
    { value: 'bank', label: '銀行帳戶 (資產項)' },
    { value: 'investment', label: '投資帳戶 (資產項)' },
    { value: 'savings', label: '儲蓄帳戶' },
    { value: 'other', label: '其他資產 (資產項)' }
];

const debtTypes = [
    { value: 'credit', label: '信用卡 (負債項)' },
    { value: 'loan', label: '貸款 (負債項)' },
    { value: 'installment', label: '分期付款 (負債項)' },
    { value: 'debt_other', label: '其他負債 (負債項)' }
];

const accountTypes = [...assetTypes, ...debtTypes, { value: 'other', label: '其他' }];
const debtTypeValues = ['credit', 'loan', 'installment', 'debt_other'];

// 分組邏輯
const groupedAccounts = computed(() => {
    const groups = {};
    accountTypes.forEach(type => { groups[type.value] = []; });
    accounts.value.forEach(acc => {
        if (groups[acc.type]) {
            groups[acc.type].push(acc);
        } else {
            groups['other'].push(acc);
        }
    });
    return groups;
});

// 計算屬性 (資產、負債、淨值)
const totalAssets = computed(() => {
    return accounts.value
        .filter(acc => !debtTypeValues.includes(acc.type) && !acc.exclude) 
        .reduce((sum, acc) => sum + acc.balance, 0)
})

const totalDebt = computed(() => {
    return accounts.value
        .filter(acc => debtTypeValues.includes(acc.type) && !acc.exclude)
        .reduce((sum, acc) => {
            return sum + Math.abs(acc.balance);
        }, 0)
})

const netWorth = computed(() => {
    return accounts.value
        .filter(acc => !acc.exclude)
        .reduce((sum, acc) => sum + acc.balance, 0)
})

const mapApiToAppTransactions = (apiData) => {
    return apiData.map(item => ({
        id: item.account_id,
        name: item.account_name,
        type: item.account_type,
        currency: item.currency,
        balance: Number(item.current_balance),
        icon: item.account_icon,
        initial: Number(item.initial_balance), 
        exclude: item.exclude_from_assets
    }));
};

// 下拉選單控制
const activeMenuIndex = ref(null);
const toggleMenu = (event, index) => {
    event.stopPropagation();
    activeMenuIndex.value = activeMenuIndex.value === index ? null : index;
};
const closeMenu = (event) => {
    if (!event.target.closest('.custom-dropdown')) {
        activeMenuIndex.value = null;
    }
};

onMounted(() => {
    window.addEventListener('click', closeMenu);
    fetchAccounts();
    triggerMissionAction('view_accounts');
});

// API 操作
const fetchAccounts = async () => {
    try {
        const response = await accountApi.getList();
        const rawData = response.data ? response.data : response;
        if (Array.isArray(rawData)) {
            accounts.value = mapApiToAppTransactions(rawData);
        }
    } catch (error) {
        console.error("加載失敗:", error);
    }
};

const handleAddAccount = async (newAccountData) => {
    try {
        await accountApi.create(newAccountData);
        await fetchAccounts();
    } catch (err) {
        console.error('新增帳戶失敗', err);
    }
};

const handleDelete = async (id) => {
    const targetAccount = accounts.value.find(acc => acc.id === id);
    const accountName = targetAccount ? targetAccount.name : '此帳戶';
    if (!window.confirm(`確定刪除「${accountName}」嗎？\n這將會：\n1. 永久刪除此帳戶\n2. 刪除此帳戶的所有收支紀錄\n3. 相關轉帳紀錄將標記為「帳戶已刪除」`)) return;
    try {
        await accountApi.delete(id);
        ElMessage({
            message: '帳戶及其相關紀錄已成功處理！',
            type: 'success',
        });
        await fetchAccounts();
        if (activeId.value === id) {
            activeId.value = null;
        }
    } catch (error) {
        console.error("Delete failed:", error);
        // 捕捉後端傳回的詳細錯誤訊息
        const errorMsg = error.response?.data?.detail || '刪除失敗';
        ElMessage.error(errorMsg);
    }
};

const activeId = ref(null);
const toggleActive = (id) => {
    activeId.value = activeId.value === id ? null : id;
};

// 編輯 Modal
const showModal = ref(false);
const selectedTransaction = ref(null);
const openEditModal = (item) => {
    selectedTransaction.value = { ...item };
    showModal.value = true;
};
const handleSaveSuccess = () => {
    showModal.value = false;
    activeMenuIndex.value = null;
    fetchAccounts();
};



</script>

<template>
    <Nav>
        <div class="page-container">
            <div class="acc_head0">
                <h1 class="page-title">帳戶管理</h1>
                <p class="page-subtitle">管理您的所有帳戶與資產</p>
            </div>

            <div class="acc_head2">
                <div class="box assets-card">
                    <div class="acc_head1">
                        <p class="card-title">總資產</p>
                        <svg class="icon assets-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                    </div>
                    <h3 class="amount">NT$ {{ totalAssets.toLocaleString() }}</h3>
                    <p class="change-text">正資產總和</p>
                </div>
                <div class="box debt-card">
                    <div class="acc_head1">
                        <p class="card-title">總負債</p>
                        <svg class="icon debt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                            <polyline points="17 18 23 18 23 12"></polyline>
                        </svg>
                    </div>
                    <h3 class="amount">NT$ {{ totalDebt.toLocaleString() }}</h3>
                    <p class="change-text">負債總和</p>
                </div>
                <div class="box value-card">
                    <div class="acc_head1">
                        <p class="card-title">總淨值</p>
                        <svg class="icon value-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                        </svg>
                    </div>
                    <h3 class="amount">NT$ {{ netWorth.toLocaleString() }}</h3>
                    <p class="change-text">資產 - 負債</p>
                </div>
            </div>

            <div class="sec_box overview-container">
                <div class="acc_head1 overview-header">
                    <div>
                        <h2>帳戶總覽</h2>
                        <p class="change-text">即時帳戶餘額</p>
                    </div>
                    <AccountAdd1 @add-account="handleAddAccount" />
                </div>

                <div class="dual-column-layout">
                    <div class="column asset-column">
                        <div v-for="typeObj in assetTypes" :key="typeObj.value" class="category-group">
                            <div class="category-title-row is-asset">
                                <span class="category-label">{{ typeObj.label }}</span>
                                <span class="category-count">{{ groupedAccounts[typeObj.value]?.length || 0 }} 個項目</span>
                            </div>
                            
                            <div v-if="groupedAccounts[typeObj.value]?.length > 0">
                                <div class="account-card mini" 
                                    v-for="acc in groupedAccounts[typeObj.value]" 
                                    :key="acc.id" 
                                    @click="toggleActive(acc.id)" 
                                    :class="{ 'is-transparent': activeId === acc.id, 'is-excluded': acc.exclude }">

                                    <span class="emoji-small">{{ acc.icon }}</span>
                                    <div class="acc-info">
                                        <div class="account-name-small">{{ acc.name }}</div>
                                        <span v-if="acc.exclude" class="exclude-mini-tag">不計入資產</span>
                                    </div>
                                    <div class="acc-amount-group">
                                        <div class="balance-small"> {{ acc.currency }} {{ acc.balance.toLocaleString() }}</div>
                                        <div class="change-text">初始: {{ acc.currency }}{{ acc.initial.toLocaleString() }}</div>
                                    </div>
                                    <div class="custom-dropdown">
                                        <button class="menu-btn-small" @click.stop="toggleMenu($event, acc.id)">⋮</button>
                                        <ul v-if="activeMenuIndex === acc.id" class="custom-dropdown-menu">
                                            <li @click.stop="openEditModal(acc)">編輯</li>
                                            <li class="delete-opt" @click.stop="handleDelete(acc.id)">刪除</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-mini">無資料</div>
                        </div>
                    </div>

                    <div class="column debt-column">
                        <div v-for="typeObj in debtTypes" :key="typeObj.value" class="category-group">
                            <div class="category-title-row is-debt">
                                <span class="category-label">{{ typeObj.label }}</span>
                                <span class="category-count">{{ groupedAccounts[typeObj.value]?.length || 0 }} 個項目</span>
                            </div>
                            
                            <div v-if="groupedAccounts[typeObj.value]?.length > 0">
                                <div class="account-card mini" 
                                    v-for="acc in groupedAccounts[typeObj.value]" 
                                    :key="acc.id" 
                                    @click="toggleActive(acc.id)" 
                                    :class="{ 'is-transparent': activeId === acc.id, 'is-excluded': acc.exclude }">
                                    
                                    <span class="emoji-small">{{ acc.icon }}</span>
                                    <div class="acc-info">
                                        <div class="account-name-small">{{ acc.name }}</div>
                                        <span v-if="acc.exclude" class="exclude-mini-tag">不計入負債</span>
                                    </div>
                                    <div class="acc-amount-group">
                                        <div class="balance-small debt-text2"> {{ acc.currency }} {{ acc.balance.toLocaleString() }}</div>
                                        <div class="change-text">初始: {{ acc.currency }}{{ acc.initial.toLocaleString() }}</div>
                                    </div>
                                    <div class="custom-dropdown">
                                        <button class="menu-btn-small" @click.stop="toggleMenu($event, acc.id)">⋮</button>
                                        <ul v-if="activeMenuIndex === acc.id" class="custom-dropdown-menu">
                                            <li @click.stop="openEditModal(acc)">編輯</li>
                                            <li class="delete-opt" @click.stop="handleDelete(acc.id)">刪除</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-mini">無資料</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showModal" class="acc_modal_overlay" @click.self="showModal = false">
            <div class="modal-card acc_modal_content" @click.stop>
                <AccountEdit v-if="selectedTransaction" :initial-data="selectedTransaction" @save-success="handleSaveSuccess" />
            </div>
        </div>
    </Nav>
</template>

<style scoped>
/* 引用共用變數 */
.page-container {
    padding: 24px;
}

.acc_head0 {
    margin-bottom: 32px;
    text-align: center;
}

.page-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 8px 0;
}

.page-subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
}

.change-text {
    font-size: 12px;
    color: var(--text-secondary);
}

/* 頂部統計卡片 */
.acc_head2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.box {
    background: var(--bg-card); /* 自動切換 */
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color);
    border-left: 4px solid;
}

.card-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
}

.amount {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 10px 0;
}

/* 卡片左邊框顏色 (功能色不隨主題變，或微調) */
.assets-card { border-left-color: #3b82f6; }
.debt-card   { border-left-color: #ef4444; }
.value-card  { border-left-color: #10b981; }

.icon { width: 20px; height: 20px; stroke-width: 2; }
.assets-icon { color: #3b82f6; }
.debt-icon   { color: #ef4444; }
.value-icon  { color: #10b981; }

.acc_head1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 帳戶總覽容器 */
.sec_box {
    margin: auto;
    border-radius: 24px;
    border: 1px solid var(--border-color);
    padding: 40px;
    background-color: var(--bg-card);
    box-shadow: var(--shadow-card);
    max-width: 1100px;
}

.overview-header {
    margin-bottom: 30px;
}

.overview-header h2 {
    color: var(--text-primary);
    margin: 0;
}

/* 雙欄佈局 */
.dual-column-layout {
    display: flex;
    gap: 30px;
    align-items: flex-start;
}

.column { flex: 1; }

.category-group { margin-bottom: 30px; }

.category-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 8px 12px;
    border-left: 4px solid #3b82f6;
    margin-bottom: 12px;
}
.category-title-row.is-debt { border-left-color: #ef4444; }

.category-label {
    font-weight: 600;
    color: var(--text-primary);
    font-size: 1.1rem;
}

.category-count { color: var(--text-secondary); font-size: 0.85rem; }

/* 帳戶卡片 (Mini) */
.account-card.mini {
    padding: 12px 15px;
    display: flex;
    justify-content: space-between;
    background: var(--bg-body); /* 使用頁面底色作為列表底色，形成層次 */
    border: 1px solid var(--border-color);
    border-radius: 12px;
    margin-bottom: 8px;
    transition: all 0.2s;
    cursor: pointer;
}

.account-card.mini:hover {
    background: var(--bg-hover);
    transform: translateY(-2px);
}

.emoji-small { font-size: 24px; margin-right: 10px; }

.acc-info { flex: 1; }

.account-name-small {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
}

.balance-small {
    font-size: 16px;
    font-family: 'Roboto Mono', monospace;
    font-weight: 600;
    color: var(--text-primary);
}

.debt-text2 { color: var(--color-danger); }

.empty-mini {
    font-size: 12px;
    color: var(--text-secondary);
    padding: 10px;
    text-align: center;
    border: 1px dashed var(--border-color);
    border-radius: 8px;
}

/* 排除項目 */
.account-card.mini.is-excluded {
    opacity: 0.7;
    filter: grayscale(0.8);
    background: var(--bg-hover);
}
.exclude-mini-tag {
    font-size: 10px;
    background: var(--bg-hover);
    padding: 2px 6px;
    border-radius: 4px;
    color: var(--text-secondary);
}

/* 下拉選單 */
.custom-dropdown { position: relative; }
.menu-btn-small {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    font-weight: bold;
    font-size: 18px;
}
.custom-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 100;
    background: var(--bg-card);
    color: var(--text-primary);
    min-width: 100px;
    padding: 8px 0;
    margin-top: 5px;
    list-style: none;
    border-radius: 8px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color);
}
.custom-dropdown-menu li {
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
}
.custom-dropdown-menu li:hover { background: var(--bg-hover); }
.custom-dropdown-menu li.delete-opt { color: var(--color-danger); }

/* Modal */
.acc_modal_overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}
.acc_modal_content {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-card);
    border-radius: 20px;
    padding: 30px;
    width: 90%;
    max-width: 440px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: hwb(0 100% 0% / 0) hwb(0 100% 0% / 0);
    max-height: 90vh;
}

@media (max-width: 768px) {
    .dual-column-layout { flex-direction: column; }
    .sec_box { padding: 20px; }
}
</style>