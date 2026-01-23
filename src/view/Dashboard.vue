<script setup>
import { ref, onMounted, computed } from 'vue'
import Nav from '@/components/Nav.vue';
import api from '@/api'
import { accountApi } from '@/api/account';

// 💡 存放從 API 抓回來的「活資料」
const transactions = ref([])
const pagination = ref({
    current_page: 1,
    total_pages: 1,
    total_rows: 0
})
const searchQuery = ref('')
const isLoading = ref(false)

// 💡 抓取資料函式 (支援分頁與搜尋)
const fetchTransactions = async (page = 1) => {
    isLoading.value = true
    try {
        // 呼叫我們之前在 records.py 寫好的分頁 API
        // 路徑範例: /records/?page=1&page_size=10&search=便當
        const response = await api.get('/records/', {
            params: {
                page: page,
                page_size: 10,
                search: searchQuery.value
            }
        }) 
        
        // 根據後端回傳的結構：{ success: true, data: [...], pagination: {...} }
        transactions.value = response.data 
        pagination.value = response.pagination
    } catch (error) {
        console.error("Dashboard 加載失敗::", error)
    } finally {
        isLoading.value = false
    }
}

// 💡 監聽搜尋輸入 (延遲 500ms 觸發，避免頻繁請求)
let searchTimer = null
const handleSearch = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        fetchTransactions(1) // 搜尋時回到第一頁
    }, 500)
}

// 💡 切換頁碼
const goToPage = (page) => {
    if (page >= 1 && page <= pagination.value.total_pages) {
        fetchTransactions(page)
    }
}



// --- 以下為暫時預設的靜態資料，未來可由其他同學串接 ---
const currentMonth = ref({
  income: 85000,
  expense: 52340,
  balance: 32660
})



const budgets = ref([
  { category: '飲食', spent: 8500, limit: 12000, color: 'color-1' },
  { category: '交通', spent: 3200, limit: 5000, color: 'color-2' },
  { category: '娛樂', spent: 6800, limit: 8000, color: 'color-3' }
])



// --- 1. 狀態定義 ---
const accounts = ref([]);
const isAccountsLoading = ref(false); // 💡 追蹤帳戶讀取狀態

// --- 2. 核心邏輯：帳戶類型定義 ---
// 根據你的需求，定義固定的五種類型
const accountTypes = [
    { value: 'bank', label: '銀行帳戶' },
    { value: 'cash', label: '現金' },
    { value: 'credit', label: '信用卡' },
    { value: 'investment', label: '投資帳戶' },
    { value: 'other', label: '其他'}
]

// --- 3. 數據轉換與清洗 (Map) ---
// 負責將後端 Schema (account_id) 轉為前端慣用名稱 (id)
const mapApiToAppTransactions = (apiData) => {
    return apiData.map(item => ({
        id: item.account_id,
        name: item.account_name,
        type: item.account_type,
        currency: item.currency,
        balance: Number(item.current_balance),
        icon: item.account_icon,
        exclude: item.exclude_from_assets
    }));
};

// --- 4. 分組與計算 (Computed) ---
const groupedAccounts = computed(() => {
    // 1. 初始化分組物件，Key 使用 label
    const groups = accountTypes.reduce((obj, typeObj) => {
        obj[typeObj.label] = []; 
        return obj;
    }, {});

    accounts.value.forEach(acc => {
        const rawType = acc.type ? acc.type.trim() : "";
        
        // 2. 尋找匹配的類型定義
        // 同時檢查是否等於 label (中文) 或 value (英文)
        const matchedType = accountTypes.find(t => 
            t.label === rawType || 
            t.value === rawType ||
            (rawType === "銀行" && t.value === "bank") // 額外防呆
        );

        if (matchedType) {
            groups[matchedType.label].push(acc);
        } else {
            groups["其他"].push(acc);
        }
    });
    return groups;
});

const fetchDashboardData = async () => {
    isAccountsLoading.value = true;
    try {
        const response = await accountApi.getList();
        const rawData = response.data ? response.data : response;
        
        // 🚀 加入這行偵錯，按 F12 檢查 Console
        console.log("後端回傳的原始類型清單:", rawData.map(a => a.account_type));

        if (Array.isArray(rawData)) {
            accounts.value = mapApiToAppTransactions(rawData);
        }
    } catch (error) {
        console.error("載入帳戶失敗:", error);
    } finally {
        isAccountsLoading.value = false;
    }
};


// 確保你有這個抓取帳戶資料的函式（補上之前漏掉的邏輯）
const formatNumber = (num) => {
  return num ? num.toLocaleString() : 0
}

// 在 onMounted 裡面同時呼叫兩個 API
onMounted(() => {
    fetchTransactions();     // 抓交易紀錄
    fetchDashboardData();    // 抓帳戶總覽 🚀 補上這一行
})

</script>


<template>
  <Nav>
  <div class="dashboard-page-layout" style="display: flex; min-height: 100vh;">
    
    <div class="dashboard-container" style="flex: 1;">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">儀表板</h1>
        <p class="page-subtitle">歡迎回來！這是您本月的財務概況</p>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="overview-grid">
      <div class="stat-card income-card">
        <div class="card-header">
          <span class="card-title">本月收入</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
        </div>
        <div class="card-content">
          <div class="amount">NT$ {{ formatNumber(currentMonth.income) }}</div>
          <p class="change-text">較上月增加 12.5%</p>
        </div>
      </div>

      <div class="stat-card expense-card">
        <div class="card-header">
          <span class="card-title">本月支出</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline>
          </svg>
        </div>
        <div class="card-content">
          <div class="amount">NT$ {{ formatNumber(currentMonth.expense) }}</div>
          <p class="change-text">較上月減少 8.3%</p>
        </div>
      </div>

      <div class="stat-card balance-card">
        <div class="card-header">
          <span class="card-title">淨收支</span>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
          </svg>
        </div>
        <div class="card-content">
          <div class="amount balance">NT$ {{ formatNumber(currentMonth.balance) }}</div>
          <p class="change-text">儲蓄率 38.4%</p>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="content-grid">
      <!-- Accounts Overview -->
      <div class="card accounts-card">
  <div class="card-inner-header">
    <h3 class="card-inner-title">帳戶總覽</h3>
    <p class="card-description">即時帳戶餘額</p>
  </div>

  <div class="card-body">
    <div v-if="isAccountsLoading" class="loading-state">載入中...</div>
      <div v-else class="type-groups-wrapper">
  <div v-for="typeObj in accountTypes" :key="typeObj.value" class="account-type-section">
    <div class="group-header">
      <span class="type-badge">{{ typeObj.label }}</span>
      <span class="type-count">{{ groupedAccounts[typeObj.label]?.length || 0 }} 個項目</span>
    </div>

    <div v-if="groupedAccounts[typeObj.label] && groupedAccounts[typeObj.label].length > 0" class="accounts-list-vertical">
      <div v-for="acc in groupedAccounts[typeObj.label]" :key="acc.id" class="account-row-item">
        <div class="acc-main-info">
            <div class="acc-icon-box">{{ acc.icon || '💰' }}</div>
            <div class="acc-texts">
                <div class="acc-name-text">
                    {{ acc.name }}
                    <span v-if="acc.exclude" class="exclude-mini-tag">排除</span>
                </div>
                <!-- <div class="acc-currency-text">{{ acc.currency }}</div> -->
            </div>
        </div>
        <div class="acc-balance-display" :class="{ 'is-negative': acc.balance < 0 }">
            NT$ {{ formatNumber(acc.balance) }}
        </div>
      </div>
    </div>

    <div v-else class="empty-type-msg">暫無 {{ typeObj.label }}</div>
  </div>
</div>
    
  </div>
</div>

      <!-- Budget Tracking -->
      <div class="card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">預算追蹤</h3>
          <p class="card-description">本月預算使用狀況</p>
        </div>
        <div class="card-body">
          <div class="budgets-list">
            <div v-for="budget in budgets" :key="budget.category" class="budget-item">
              <div class="budget-header">
                <span class="budget-category">{{ budget.category }}</span>
                <span class="budget-amounts">
                  NT$ {{ formatNumber(budget.spent) }} / {{ formatNumber(budget.limit) }}
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :class="budget.color"
                  :style="{ width: (budget.spent / budget.limit * 100) + '%' }"
                ></div>
              </div>
              <div class="budget-footer">
                <span>{{ ((budget.spent / budget.limit) * 100).toFixed(0) }}% 已使用</span>
                <span>剩餘 NT$ {{ formatNumber(budget.limit - budget.spent) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Transactions & Notifications -->
    <div class="bottom-grid">
      <div class="card transactions-card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">最近交易</h3>
          <p class="card-description">您可以搜尋備註、類別或成員~</p>
          
          <div class="search-box">
      <input 
        v-model="searchQuery" 
        @input="handleSearch"
        type="text" 
        placeholder="搜尋紀錄..." 
        class="search-input"
      />
    </div>  
        </div>
        <h3><p class="card-description">最新的收支紀錄:</p></h3>

        <div class="card-body">
          <div v-if="isLoading" class="loading-state">載入中...</div>
          <div v-else class="transactions-list"></div>
        <div class="transactions-list">
          <div v-if="transactions.length === 0" class="no-data">
        找不到相關紀錄</div>

        <div v-for="t in transactions" :key="t.add_id" class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-icon" :class="t.add_type ? 'income' : 'expense'">
            <span v-if="t.add_class_icon">{{ t.add_class_icon }}</span>
            <span v-else>{{ t.add_type ? '💰' : '💸' }}</span>
          </div>
          <div>
            <div class="transaction-name">{{ t.add_note || '無備註' }}</div>
            <div class="transaction-category">
              <span class="tag">{{ t.add_class }}</span>
              <span class="member-tag" v-if="t.add_member">→ {{ t.add_member }}</span>
            </div>
          </div>
        </div>
        <div class="transaction-details">
          <div class="transaction-amount" :class="{ income: t.add_type }">
            {{ t.add_type ? '+' : '-' }}NT$ {{ formatNumber(t.add_amount) }}
          </div>
          <div class="transaction-date">{{ t.add_date }}</div>
        </div>
      </div>
    </div>

    <div class="pagination-container" v-if="pagination.total_pages > 1">
      <button 
        @click="goToPage(pagination.current_page - 1)" 
        :disabled="pagination.current_page === 1"
        class="page-btn"
      >
        上一頁
      </button>
      
      <span class="page-info">
        第 {{ pagination.current_page }} / {{ pagination.total_pages }} 頁
      </span>

      <button 
        @click="goToPage(pagination.current_page + 1)" 
        :disabled="pagination.current_page === pagination.total_pages"
        class="page-btn"
      >
        下一頁
      </button>
    </div>
  </div>
  
      </div>

      <div class="card">
        <div class="card-inner-header">
          <h3 class="card-inner-title">重要通知</h3>
          <p class="card-description">系統提醒與建議</p>
        </div>
        <div class="card-body">
          <div class="notifications-list">
            <div class="notification-item warning">
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" x2="12" y1="8" y2="12"></line>
                <line x1="12" x2="12.01" y1="16" y2="16"></line>
              </svg>
              <div>
                <div class="notification-title">預算提醒</div>
                <p class="notification-text">娛樂預算已使用 85%，建議控制支出</p>
              </div>
            </div>

            <div class="notification-item success">
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"></path>
                <path d="M2 9v1c0 1.1.9 2 2 2h1"></path>
                <path d="M16 11h0"></path>
              </svg>
              <div>
                <div class="notification-title">儲蓄目標</div>
                <p class="notification-text">本月已達成儲蓄目標 76%，繼續加油！</p>
              </div>
            </div>

            <div class="notification-item info">
              <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                <line x1="2" x2="22" y1="10" y2="10"></line>
              </svg>
              <div>
                <div class="notification-title">帳單提醒</div>
                <p class="notification-text">信用卡帳單將於 3 天後到期</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
  </Nav>
</template>



<style scoped>
  @import '../assets/css/dashboard.css';
</style>


