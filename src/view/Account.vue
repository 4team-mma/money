<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api' // 確保使用統一的 api 設定
import { accountApi } from '@/api/account';
import AccountAdd1 from '@/components/AccountAdd1.vue';
import AccountEdit from '@/components/AccountEdit.vue';
import Nav from '@/components/Nav.vue';
import { ElMessage } from 'element-plus';





const accounts = ref([])

const assetTypes = [
    { value: 'cash', label: '現金 (資產項)' },
    { value: 'bank', label: '銀行帳戶 (資產項)' },
    { value: 'investment', label: '投資帳戶 (資產項)' },
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


// 🌟 修改：根據 accountTypes 的 value 進行分組
const groupedAccounts = computed(() => {
    const groups = {};
    
    // 初始化分組物件，Key 為 'bank', 'cash' 等
    accountTypes.forEach(type => {
        groups[type.value] = [];
    });

    // 將帳戶填入對應分組
    accounts.value.forEach(acc => {
        // 確保後端回傳的 acc.type 能對應到我們的 value
        if (groups[acc.type]) {
            groups[acc.type].push(acc);
        } else {
            groups['other'].push(acc); // 找不到對應時放進其他
        }
    });
    
    return groups;
});




// 🌟 修正後的總資產：不是負債類 且 exclude 為 false
const totalAssets = computed(() => {
    return accounts.value
        .filter(acc => !debtTypeValues.includes(acc.type) && !acc.exclude) 
        .reduce((sum, acc) => sum + acc.balance, 0)
})

// 🌟 修正後的總負債：是負債類 且 exclude 為 false
const totalDebt = computed(() => {
    return accounts.value
        .filter(acc => debtTypeValues.includes(acc.type) && !acc.exclude)
        .reduce((sum, acc) => {
            return sum + Math.abs(acc.balance);
        }, 0)
})

// 🌟 修正後的總淨值：只加總未被排除的帳戶
const netWorth = computed(() => {
    return accounts.value
        .filter(acc => !acc.exclude)
        .reduce((sum, acc) => sum + acc.balance, 0)
})

//負責將後端資料庫傳回來的名稱（通常是底線命名 account_id），轉換成前端元件好閱讀、好操作的名稱
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

//編輯刪除的三個點
// 控制哪一個項目的下拉選單是開啟的 (存儲 index)
    const activeMenuIndex = ref(null);

    // 切換選單顯示/隱藏
    const toggleMenu = (event, index) => {
        event.stopPropagation(); // 防止點擊事件冒泡
        activeMenuIndex.value = activeMenuIndex.value === index ? null : index;
    };

    const closeMenu = (event) => {
    // 如果點擊的目標「不是」選單按鈕，也不是選單內容，才關閉
    if (!event.target.closest('.custom-dropdown')) {
        activeMenuIndex.value = null;
    }
};

    onMounted(() => {
        window.addEventListener('click', closeMenu);
    });





//get
const fetchAccounts = async () => {
    try {
        const response = await accountApi.getList();
        // 如果你的 axios 直接回傳 data，或者是包裹在 response.data 裡
        const rawData = response.data ? response.data : response;

        if (Array.isArray(rawData)) {
            accounts.value = mapApiToAppTransactions(rawData);
            console.log("前端陣列已更新:", accounts.value);
        } else {
            console.error("後端回傳格式非陣列", rawData);
        }
    } catch (error) {
        console.error("加載失敗:", error);
    }
};


//post+GET
//連線到API放資料進去
const handleAddAccount = async (newAccountData) => {
    try {
    await accountApi.create(newAccountData);
    await fetchAccounts(); // 新增成功後重新拉取清單
    } catch (err) {
    console.error('新增帳戶失敗', err);
    }
};



// 刪除處理
const handleDelete = async (id) => {
    // 1. 二次確認，避免誤刪
    const isConfirmed = window.confirm('您確定要刪除這個帳戶嗎？此動作將無法復原，且可能影響相關交易紀錄。');
    
    if (!isConfirmed) return;

    try {
        // 2. 呼叫 API 進行刪除 (確保你的 accountApi 有 delete 方法)
        // 假設你的 accountApi.delete 對應的是 DELETE /api/accounts/{id}
        await accountApi.delete(id);
        
        // 3. 提示成功 (可選)
        ElMessage.success('刪除成功！');

        // 4. 重新拉取清單，讓 UI 即時更新
        await fetchAccounts();
        
        // 5. 如果目前刪除的就是 activeId，將其重置
        if (activeId.value === id) {
            activeId.value = null;
        }
    } catch (error) {
        ElMessage.error('刪除失敗：' + (err.response?.data?.detail || '連線異常'));
    }
};

const activeId = ref(null); // 紀錄目前哪一個帳戶被點擊

// 切換選中狀態，如果點擊同一個就取消選中
const toggleActive = (id) => {
    if (activeId.value === id) {
        activeId.value = null;
    } else {
        activeId.value = id;
    }
};





// 編輯處理
    // 編輯 Modal 控制
    const showModal = ref(false);
    // 🌟 2. 用來存放「目前正在編輯的那一筆資料」
    const selectedTransaction = ref(null);

    /**
     * 開啟編輯 Modal
     */
    const openEditModal = (item) => {
        selectedTransaction.value = { ...item }; // 存入點選的那一筆
        showModal.value = true;
    };

    /**
     * 處理儲存成功後的動作
     */
    const handleSaveSuccess = () => {
    showModal.value = false;      // 1. 關閉編輯彈窗
    activeMenuIndex.value = null; // ✨ 2. 同時關閉「三個點」下拉選單
    
    fetchAccounts();             // 3. 重新抓取資料，更新畫面清單
};




onMounted(() => {
    fetchAccounts()
})
</script>







<template>
    <Nav>
<br>
<div class="acc_head0">
        <h1 class="page-title">帳戶管理</h1>
</div>
<p class="page-subtitle">管理您的所有帳戶與資產</p>
<br>
<br>
<div class="acc_head2">
    <div class="box assets-card">
        <div class="acc_head1">
            <p class="card-title">總資產 &nbsp;&nbsp;</p><svg class="icon assets-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
        <br>
        <h3 class="amount">NT$ {{ totalAssets.toLocaleString() }}</h3>
        <p class="change-text">所有正資產總和</p>
    </div>
    <div class="box debt-card">
        <div class="acc_head1">
            <p class="card-title">總負債 &nbsp;&nbsp;</p><svg class="icon debt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline></svg>
        </div>
        <br>
        <h3 class="amount">NT$ {{ totalDebt.toLocaleString() }}</h3>
        <p class="change-text">所有負債總和</p>
    </div>
    <div class="box value-card">
        <div class="acc_head1">
            <p class="card-title">總淨值 &nbsp;&nbsp;</p><svg class="icon value-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
        </div>
        <br>
        <h3 class="amount">NT$ {{ netWorth.toLocaleString() }}</h3>
        <p class="change-text">總資產減去總負債</p>
    </div>
</div>
<br>
<br>
<br>

<!-- 重要 -->
<div class="sec_box overview-container">
    <div class="acc_head1 overview-header">
        <div>
            <h2>帳戶總覽</h2>
            <p class="change-text">即時帳戶餘額</p>
        </div>
        <AccountAdd1 @add-account="handleAddAccount" />
    </div>
    <br>
    <br>
    <div class="dual-column-layout">
        <div class="column asset-column">
            <div v-for="typeObj in assetTypes" :key="typeObj.value" class="category-group">
                <div class="category-title-row is-asset">
                    <span class="category-label">{{ typeObj.label }}</span>
                    <span class="category-count">{{ groupedAccounts[typeObj.value]?.length || 0 }} 個項目</span>
                </div>
                
                <div v-if="groupedAccounts[typeObj.value]?.length > 0">
                    <div class="account-card mini" v-for="acc in groupedAccounts[typeObj.value]" 
                        :key="acc.id" @click="toggleActive(acc.id)" :class="{ 'is-transparent': activeId === acc.id }">
                        <span class="emoji-small">{{ acc.icon }}</span>
                        <div>
                            <div class="account-name-small">{{ acc.name }}</div>
                            <span v-if="acc.exclude" class="exclude-mini-tag">排除</span>
                        </div>
                        <div class="acc-amount-group">
                            <div class="balance-small debt-text"> {{ acc.currency }} {{ acc.balance.toLocaleString() }}</div>
                            <div class="change-text">初始餘額:{{ acc.currency }}{{ acc.initial.toLocaleString() }}</div>
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
                    <div class="account-card mini" v-for="acc in groupedAccounts[typeObj.value]" 
                        :key="acc.id" @click="toggleActive(acc.id)" :class="{ 'is-transparent': activeId === acc.id }">
                        <span class="emoji-small">{{ acc.icon }}</span>
                        <div>
                            <div class="account-name-small">{{ acc.name }}</div>
                            <span v-if="acc.exclude" class="exclude-mini-tag">排除</span>
                        </div>
                        <div class="acc-amount-group">
                            <div class="balance-small debt-text2"> {{ acc.currency }} {{ acc.balance.toLocaleString() }}</div>
                            <div class="change-text">初始負債:{{ acc.currency }}{{ acc.initial.toLocaleString() }}</div>
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
    <!-- 編輯彈窗 -->
    <div v-if="showModal" class="acc_modal_overlay" @click.self="showModal = false">
        <div class="modal-card acc_modal_content" @click.stop>
            <AccountEdit  
                v-if="selectedTransaction" 
                :initial-data="selectedTransaction" 
                @save-success="handleSaveSuccess" 
            />
        </div>
    </div>
    
<br> 

</Nav>
</template>






<style scoped>

/* --- 基礎佈局與文字 --- */
.page-title {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.page-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

.change-text {
    font-size: 15px;
    color: #64748b;
    margin: 0;
}

/* --- 頂部統計卡片 (Grid) --- */
.acc_head2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
}

.box {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-left: 4px solid;
}

.card-title {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
}

.amount {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 10px;
}

.assets-card { border-left-color: #3b82f6; }
.debt-card   { border-left-color: #ef4444; }
.value-card  { border-left-color: #000000; }

.icon { width: 20px; height: 20px; stroke-width: 2; }
.assets-icon { color: #3b82f6; }
.debt-icon   { color: #ef4444; }
.value-icon  { color: #000000; }

/* --- 帳戶總覽容器 --- */
.sec_box {
    margin: auto;
    border-radius: 40px;
    border: 1px solid #e2e8f0;
    padding: 60px; /* 稍微縮小原有的 100px 避免過空 */
    background-color: white;
    max-width: 900px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
}

.acc_head1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* --- 分類標題樣式 --- */
.category-group { margin-bottom: 50px; }

.category-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0 8px 12px;
    border-left: 4px solid #3b82f6; 
    margin-bottom: 12px;
}

.category-title-row.is-credit { border-left-color: #ef4444; }

.category-label {
    font-weight: 600;
    color: #475569;
    font-size: 1.1rem;
}

.category-count { color: #94a3b8; font-size: 0.85rem; }

/* --- 帳戶卡片樣式 --- */
.account-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px 30px;
    margin-bottom: 8px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    cursor: pointer;
    transition: all 0.2s;
    max-width: 700px;  /* 你可以調整這個數值，例如 500px 會更窄 */
    margin-left: auto;
    margin-right: auto;
}

.account-card:hover { transform: translateY(-2px); }

.emoji { font-size: 40px; } /* 稍微縮小一點較精緻 */

.account-name { font-size: 18px; font-weight: 500; color: black; }

.exclude-mini-tag {
    font-size: 10px;
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    color: #64748b;
    margin-left: 5px;
}

/* 餘額組 */
.acc-amount-group {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: auto;
}

.world_right {
    font-weight: bold;
    font-size: 20px;
}

/* --- 下拉選單 (三個點) --- */
.custom-dropdown { position: relative; }

.menu-btn {
    background: none;
    border: none;
    color: #cbd5e1;
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    transition: background 0.2s;
}

.menu-btn:hover { background: #f1f5f9; color: #64748b; }

.custom-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 100;
    background: #ffffff;
    min-width: 100px;
    padding: 8px 0;
    margin-top: 5px;
    list-style: none;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    border: 1px solid #f1f5f9;
}

.custom-dropdown-menu li {
    padding: 8px 16px;
    font-size: 14px;
    color: #475569;
    cursor: pointer;
}

.custom-dropdown-menu li:hover { background: #f8fafc; }
.custom-dropdown-menu li.delete-opt { color: #ef4444; }

/* --- 彈窗 Modal --- */
.acc_modal_overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-card {
    width: 440px;
    background: rgb(244, 235, 235);
    padding: 40px;
    border-radius: 28px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
}

    .acc_modal_content {
    width: 90%;
    max-width: 440px;
    border-radius: 20px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    overflow: hidden;
    padding: 35px;
    z-index: 2100;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: hwb(0 100% 0% / 0) hwb(0 100% 0% / 0);
    max-height: 90vh;
}

/* 空狀態 */
.empty-category {
    text-align: center;
    padding: 24px;
    background: #f8fafc;
    border: 1px dashed #e2e8f0;
    border-radius: 12px;
    color: #94a3b8;
    font-size: 0.9rem;
}

/* --- 雙欄佈局 CSS --- */
.overview-container {
    max-width: 1100px; /* 增加寬度容納兩欄 */
    padding: 40px !important;
}

.dual-column-layout {
    display: flex;
    gap: 30px;
    align-items: flex-start;
}

.column {
    flex: 1; /* 左右各佔 50% */
}

/* 分類標題區分顏色 */
.category-title-row.is-asset { border-left: 4px solid #3b82f6; }
.category-title-row.is-debt { border-left: 4px solid #ef4444; }

/* 縮小版帳戶卡片 */
.account-card.mini {
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    box-shadow: none;
    margin-bottom: 6px;
}

.emoji-small { font-size: 24px; margin-right: 10px; }

.acc-info { flex: 1; }

.account-name-small {
    font-size: 18px;
    font-weight: 600;
    color: #334155;
}

.balance-small {
    font-size: 18px;
    font-family: 'Roboto Mono', monospace;
    color: #475569;
}

.debt-text { color: #070707; }
.debt-text2 { color: #ef4444; }

.empty-mini {
    font-size: 12px;
    color: #94a3b8;
    padding: 10px;
    text-align: center;
    border: 1px dashed #e2e8f0;
    border-radius: 8px;
    margin-bottom: 20px;
}

.menu-btn-small {
    background: none;
    border: none;
    cursor: pointer;
    color: #94a3b8;
    font-weight: bold;
}

/* 讓手機版變回單欄 */
@media (max-width: 768px) {
    .dual-column-layout {
        flex-direction: column;
    }
}

</style>