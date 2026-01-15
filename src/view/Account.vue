<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api' // 確保使用統一的 api 設定
import { accountApi } from '@/api/account';
import AccountAdd2 from '@/components/AccountAdd2.vue';
import AccountAdd1 from '@/components/AccountAdd1.vue';
import Nav from '@/components/Nav.vue';





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
        icon: item.account_icon
    }));
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








const activeId = ref(null); // 紀錄目前哪一個帳戶被點擊

// 切換選中狀態，如果點擊同一個就取消選中
const toggleActive = (id) => {
    if (activeId.value === id) {
        activeId.value = null;
    } else {
        activeId.value = id;
    }
};

// 刪除處理 (先寫 log 測試)
const handleDelete = (id) => {
    console.log('刪除帳戶 ID:', id);
    // 這裡之後接：await accountApi.delete(id); fetchAccounts();
};

// 編輯處理
const handleEdit = (acc) => {
    console.log('編輯帳戶:', acc);
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
            v-for="acc in accounts" 
            :key="acc.id"
            :class="{ 'is-transparent': activeId === acc.id }"
            @click="toggleActive(acc.id)"
            >
            <span class="emoji">{{ acc.icon }}</span>
            <div>
                <div class="account-name">{{ acc.name }}</div>
                <div class="change-text">{{ acc.type }}</div>
            </div>
            <div class="world_right"> {{ acc.currency }} {{ acc.balance.toLocaleString() }}</div>

            <div v-if="activeId === acc.id">
                <button class="edit-btn" @click.stop="handleEdit(acc)">編輯</button>
                <button class="delete-btn" @click.stop="handleDelete(acc.id)">刪除</button>
            </div>
        </div>
    </div>
    
<br>  
<AccountAdd2 @add-account="handleAddAccount" />
</div>
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

</style>