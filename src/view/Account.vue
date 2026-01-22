<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api' // 確保使用統一的 api 設定
import { accountApi } from '@/api/account';
import AccountAdd2 from '@/components/AccountAdd2.vue';
import AccountAdd1 from '@/components/AccountAdd1.vue';
import AccountEdit from '@/components/AccountEdit.vue';
import Nav from '@/components/Nav.vue';
import { ElMessage } from 'element-plus';





const accounts = ref([])


// 計算加總數值 (優化點：動態計算而非寫死)
const totalAssets = computed(() => {
    return accounts.value
        .filter(acc => acc.balance > 0)
        .reduce((sum, acc) => sum + acc.balance, 0)
})

// 總負債：計算 balance 為負數的加總
const totalDebt = computed(() => {
    return accounts.value
        .filter(acc => acc.balance < 0)
        .reduce((sum, acc) => sum + Math.abs(acc.balance), 0)
})

// 總淨值：總資產 - 總負債
const netWorth = computed(() => {
    // 這裡我們直接加總所有餘額即可（正加負減）
    return accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
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


// 控制哪一個項目的下拉選單是開啟的 (存儲 index)
    const activeMenuIndex = ref(null);

    // 切換選單顯示/隱藏
    const toggleMenu = (event, index) => {
        event.stopPropagation(); // 防止點擊事件冒泡
        activeMenuIndex.value = activeMenuIndex.value === index ? null : index;
    };

    





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
<div class="acc_head1">
    <p class="transparent-text">(空白)</p>
    <div>  
        <h1 class="page-title">帳戶管理</h1>
    </div>

<!-- 「當我聽到 add-account 這個訊號時，請幫我執行 handleAddAccount 函數，並把子層丟出來的資料傳進去。」 -->
    <AccountAdd1 @add-account="handleAddAccount" />
    
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
<div class="sec_box">
    <div>
        <h3>帳戶清單</h3>
        <p class="change-text">所有帳戶</p>
    </div>
    <br>
    
    <div>
        <div 
            class="account-card" 
            v-for="(acc,index) in accounts" 
            :key="acc.id"
            :class="{ 'is-transparent': activeId === acc.id }"
            @click="toggleActive(acc.id)"
            >
            <span class="emoji">{{ acc.icon }}</span>
            <div>
                <div class="account-name">{{ acc.name }}</div>
                <div class="change-text">{{ acc.type }}</div>
            </div>
            <div class="world_right"> {{ acc.currency }} {{ acc.initial.toLocaleString() }}</div>

            <!-- 🌟 純 Vue 下拉選單結構 -->
                <div class="custom-dropdown">
                    <button class="menu-btn" @click="toggleMenu($event, index)">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                    </button>
                    
                    <!-- 使用 Vue 的 v-if 控制顯示 -->
                    <ul v-if="activeMenuIndex === index" class="custom-dropdown-menu">
                        <li @click="openEditModal(acc)">編輯</li>
                        <li class="delete-opt" @click="handleDelete(acc.id)">刪除</li>
                    </ul>
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
</div>
    
<br>  
<AccountAdd2 @add-account="handleAddAccount" />

</Nav>
</template>






<style scoped>

.world_right {
    margin-left: auto;   /* 🔑 這行讓餘額跑到最右邊 */
    text-align: right;
    font-weight: bold;
    font-size: 20px;
}
    .account-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    margin-top: 10px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }

    .card-title {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    }

    .transparent-text {
    opacity: 0;
    }

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

    .amount {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 10px;
    }

    .account-name{
    font-size: 20px;
    color: black;
    }

    .change-text{
    font-size: 12px;
    color: #64748b;
    margin: 0;
    }

    .acc_head1{
        display: flex;
        justify-content:space-between
    }

        .acc_head3{
        display: flex;
        justify-content:center
    }

    .acc_head2{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    }

    .sec_head{
        display: flex;
        justify-content: flex-start
    }



    .three_dots_button{
        border: none;
        background-color: white;
        font-size: 20px;
    }

    .box{
        background: white;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        border-left: 4px solid;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .sec_box{
        margin: auto;
        border-radius: 40px;
        border: 0.05px solid darkgrey;
        padding: 25px;
        background-color: white;
    }
    .account-icon-wrapper{
        padding: 1rem;
    }

    .value-card {
    border-left-color: #000000;
    }

    .assets-card {
    border-left-color: #3b82f6;
    }

    .debt-card {
    border-left-color: #ef4444;
    }

    .icon {
    width: 20px;
    height: 20px;
    stroke-width: 2;
    }

    .value-icon {
    color: #000000 ;
    }

    .assets-icon {
    color: #3b82f6 ;
    }

    .debt-icon {
    color:#ef4444;
    }

    .plus-icon {
    font-size: 48px;
    font-weight: bold;
    line-height: 1;
    background-color: white;
    border-color: white;
    }

    .emoji{
        font-size: 50px;
    }


/* 編輯按鈕：純文字 + 圖標感 */
.edit-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: #3b82f6;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}

/* 刪除按鈕：純文字 + 圖標感 */
.delete-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    color: #ef4444;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
}

.edit-btn:hover, .delete-btn:hover {
    transform: scale(1.1); /* 懸浮微放大的互動感 */
}


.menu-btn {
    background: none;
    border: none;
    color: #cbd5e1;
    padding: 8px 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 6px;
    transition: all 0.2s;
}

.menu-btn:hover {
    background: #f1f5f9;
    color: #64748b;
}


/* 5. 純 Vue 下拉選單 */
.custom-dropdown {
    position: relative;
    display: flex;
    align-items: center;
}

.menu-btn {
    background: none;
    border: none;
    color: #cbd5e1;
    padding: 8px 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 6px;
    transition: all 0.2s;
}

.menu-btn:hover {
    background: #f1f5f9;
    color: #64748b;
}

.custom-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 1000;
    background: #ffffff;
    min-width: 110px;
    padding: 0px 0;
    margin-top: 5px;
    list-style: none;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    border: 8px solid #ffffff;
    animation: fadeIn 0.15s ease-out;
}

.custom-dropdown-menu li {
    padding: 8px 16px;
    font-size: 0.9rem;
    color: #475569;
    cursor: pointer;
}

.custom-dropdown-menu li:hover {
    background: #f8fafc;
    color: #1e293b;
}

.custom-dropdown-menu li.delete-opt {
    color: #ef4444;
}

.acc_modal_overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    z-index: 2000;
    padding: 20px;
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
}

</style>