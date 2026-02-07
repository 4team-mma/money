<script setup>
import { ref, onMounted, computed } from 'vue'
import Nav from '@/components/Nav.vue';
import api from '@/api'
import { accountApi } from '@/api/account';
import { getTransferList } from '@/api/transfer';

// 💡 存放從 API 抓回來的「活資料」
const transactions = ref([])
// const pagination = ref({
//     current_page: 1,
//     total_pages: 1,
//     total_rows: 0
// })
const searchQuery = ref('')
const isLoading = ref(false)
const accounts = ref([]);
const isAccountsLoading = ref(false);
// 1. 確保初始結構完整，防止初次渲染崩潰
const pagination = ref({
  current_page: 1,
  total_pages: 1,
  total_rows: 0,
  has_next: false,
  has_prev: false
})

const monthlyStats = ref({
  income: 0,
  incomeChange: 0, // 較上月增加 %
  expense: 0,
  expenseChange: 0, // 較上月減少 %
  balance: 0,
  savingsRate: 0
})


// 🌟 帳戶總覽：抓取後端統計路由 /records/stats/monthly
const fetchMonthlyStats = async () => {
  try {
    // 假設你的 api 檔已經定義好 getCurrentStats，或是直接寫路徑
    const response = await api.get('/records/stats/monthly');
    const data = response.data?.data || response.data || response;

    // 將後端數據映射到前端變數
    // 這裡假設後端回傳包含：total_income, income_change, total_expense, expense_change, balance
    monthlyStats.value = {
      income: Number(data.total_income) || 0,
      incomeChange: data.income_change || 0,
      expense: Number(data.total_expense) || 0,
      expenseChange: data.expense_change || 0,
      balance: Number(data.net_savings) || 0,
      // 儲蓄率公式：(收入 - 支出) / 收入 * 100
      savingsRate: data.total_income > 0 
        ? ((data.net_savings / data.total_income) * 100).toFixed(1) 
        : 0
    };
    console.log("📊 統計數據更新成功:", monthlyStats.value);
  } catch (error) {
    console.error("❌ 抓取統計數據失敗:", error);
  }
}

// 1.計算總淨資產
// 邏輯：將 accounts 陣列中所有的 balance 加總
const fetchDashboardData = async () => {
  isAccountsLoading.value = true;
  try {
    const response = await accountApi.getList(); // 這對應到你的 GET /api/accounts/
    const rawData = response.data ? response.data : response;

    if (Array.isArray(rawData)) {
      // 確保將後端欄位轉換成前端 Template 期待的欄位 (id, name, balance, icon 等)
      accounts.value = rawData.map(acc => ({
        id: acc.account_id,       // 假設後端欄位名
        name: acc.account_name,   // 假設後端欄位名
        balance: Number(acc.current_balance),     // 這裡就是你路由回傳的餘額
        icon: acc.account_icon || '💰',
        exclude: acc.exclude_from_assets   // 如果有排除計算的欄位
      }));
    }
    console.log("💰 帳戶資料更新，當前淨資產:", totalNetWorth.value);
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

const totalNetWorth = computed(() => {
  if (!accounts.value.length) return 0;
  return accounts.value.reduce((sum, acc) => {
    // 如果該帳戶標記為「排除」，則不計入總資產
    if (acc.exclude) return sum; 
    return sum + (Number(acc.balance) || 0);
  }, 0);
});



// 2. 經常收支帳戶 (根據最近交易紀錄出現頻率)
const frequentAccounts = computed(() => {
  if (transactions.value.length === 0) return accounts.value.slice(0, 3);
  
  // 統計交易紀錄中每個帳戶名稱出現的次數
  const counts = {};
  transactions.value.forEach(t => {
    // 這裡從交易紀錄的備註或相關欄位比對，若無精確對應，則依交易出現順序
    const name = t.display_member; // 假設 member 裡存的是帳戶相關訊息，或改用其他匹配邏輯
    counts[name] = (counts[name] || 0) + 1;
  });

  return [...accounts.value]
    .sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0))
    .slice(0, 3);
});

// 3. 最近編輯或新增的帳戶 (利用 accounts 本身的順序或 id)
const recentAccounts = computed(() => {
  // 通常 id 越大或在陣列越後面代表越新，我們直接取最後加入的前三筆
  return [...accounts.value].reverse().slice(0, 3);
});



//🌟最近交易
const fetchTransactions = async (page = 1) => {
  isLoading.value = true
  try {
    const pageSize = 10;
    const params = { page, page_size: pageSize, search: searchQuery.value };

    // 同步抓取收支與轉帳
    const [recordsRes, transfersRes] = await Promise.all([
      api.get('/records/', { params }),
      api.get('/transfers/')
    ]);

    // 💡 關鍵防呆：自動偵測後端回傳格式 (處理 interceptor 的差異)
    // 確保我們拿到的是陣列，或是包含 data 陣列的物件
    const recData = recordsRes.data?.data || recordsRes.data || recordsRes || [];
    const traData = transfersRes.data?.data || transfersRes.data || transfersRes || [];

    // 💡 搜尋過濾邏輯：只有在搜尋「轉帳」相關字眼時才顯示轉帳紀錄
    const isSearchingTransfer = searchQuery.value && 
      (searchQuery.value.includes('轉') || searchQuery.value.includes('帳'));
    
    let filteredTransfers = traData;
    if (searchQuery.value && !isSearchingTransfer) {
      filteredTransfers = [];
    }

    // 1. 標準化「收支紀錄」：大標題是類別，小標題是備註
    const recordList = recData.map(item => ({
      id: `r-${item.add_id}`,
      display_title: item.add_class,        // 🌟 類別當大標題
      display_note: item.add_note || '',     // 🌟 備註當次標題
      display_date: item.add_date,
      display_amount: Number(item.add_amount) || 0,
      display_icon: item.add_class_icon || '📝',
      display_type: item.add_type ? 'income' : 'expense',
      display_member: item.add_member,
      is_transfer: false
    }));

    // 2. 標準化「轉帳紀錄」
    const transferList = filteredTransfers.map(item => ({
      id: `t-${item.transaction_id}`,
      display_title: '帳戶互轉',             // 🌟 轉帳大標題
      display_note: `${item.from_account_name} ➔ ${item.to_account_name}`, // 🌟 流向當備註
      display_date: item.transaction_date,
      display_amount: Number(item.amount) || 0,
      display_icon: '🔄',
      display_type: 'transfer',
      display_member: item.transaction_note || '',
      is_transfer: true
    }));

    // 3. 合併並按日期排序
    const combined = [...recordList, ...transferList].sort((a, b) => 
      new Date(b.display_date) - new Date(a.display_date)
    );

    // 顯示前 10 筆
    transactions.value = combined.slice(0, pageSize);

    // 💡 解決分頁不見的問題：
    // 之前會不見是因為你拿「抓回來的筆數(10)」去除以 10，結果等於 1 頁就隱藏了。
    // 我們必須從後端回傳的 pagination 裡拿「真正的總筆數」。
    const serverTotalRows = recordsRes.data?.pagination?.total_rows || recordsRes.pagination?.total_rows || recData.length;
    const totalCount = serverTotalRows + (searchQuery.value && !isSearchingTransfer ? 0 : traData.length);

    pagination.value = {
      current_page: page,
      total_pages: Math.ceil(totalCount / pageSize) || 1,
      total_rows: totalCount
    };

    console.log("✅ 成功更新 transactions，總筆數:", totalCount);

  } catch (error) {
    console.error("❌ 抓取失敗:", error);
  } finally {
    isLoading.value = false;
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






const budgets = ref([
  { category: '飲食', spent: 8500, limit: 12000, color: 'color-1' },
  { category: '交通', spent: 3200, limit: 5000, color: 'color-2' },
  { category: '娛樂', spent: 6800, limit: 8000, color: 'color-3' }
])



// 在 onMounted 裡面同時呼叫兩個 API
onMounted(async () => {
  fetchMonthlyStats();
  // 1. 先等待帳戶資料載入 (為了拿到 icon 字典)
  await fetchDashboardData();
  // 2. 接著才載入交易紀錄 (這時候就可以去對應 icon 了)
  fetchTransactions();
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
              <div class="amount">NT$ {{ formatNumber(monthlyStats.income) }}</div>
              <p class="change-text">{{ monthlyStats.incomeChange >= 0 ? '增加' : '減少' }} {{
                Math.abs(monthlyStats.incomeChange) }}%</p>
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
              <div class="amount">NT$ {{ formatNumber(monthlyStats.expense) }}</div>
              <p class="change-text">{{ monthlyStats.expenseChange >= 0 ? '增加' : '減少' }} {{
                Math.abs(monthlyStats.expenseChange) }}%</p>
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
              <div class="amount balance">NT$ {{ formatNumber(monthlyStats.balance) }}</div>
              <p class="change-text">儲蓄率 {{ monthlyStats.savingsRate }}%</p>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Accounts Overview -->
          <div class="card accounts-card">
            <div class="card-inner-header">
                <div>
                  <h3 class="card-inner-title">帳戶總覽</h3>
                  <p class="card-description">常用與最近異動帳戶</p>
                </div>
            </div>
            <br>
                <div class="card-inner-title">
                  <span style="font-size: 18px; color: #8c8c8c;">總淨資產</span>
                  <span style="font-size: 30px; font-weight: 700; color: #2c3e50;"> NT$ {{ formatNumber(totalNetWorth) }} </span>
                </div>
            <br>

            <div class="card-body">
              <div v-if="isAccountsLoading" class="loading-state">載入中...</div>
              <div v-else class="type-groups-wrapper">
                
                <div class="account-type-section">
                  <div class="group-header">
                    <span class="type-badge frequent">常用收支</span>
                    <span class="type-count">基於近期紀錄</span>
                  </div>
                  <div class="accounts-list-vertical">
                    <div v-for="acc in frequentAccounts" :key="'freq-' + acc.id" class="account-row-item">
                      <div class="acc-main-info">
                        <div class="acc-icon-box">{{ acc.icon || '💰' }}</div>
                        <div class="acc-texts">
                          <div class="acc-name-text">
                            {{ acc.name }}
                            <span v-if="acc.exclude" class="exclude-mini-tag">排除</span>
                          </div>
                        </div>
                      </div>
                      <div class="acc-balance-display" :class="{ 'is-negative': acc.balance < 0 }">
                        NT$ {{ formatNumber(acc.balance) }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="section-divider" style="margin: 15px 0; border-top: 1px dashed #eee;"></div>

                <div class="account-type-section">
                  <div class="group-header">
                    <span class="type-badge recent">最近異動</span>
                    <span class="type-count">最新加入或修改</span>
                  </div>
                  <div class="accounts-list-vertical">
                    <div v-for="acc in recentAccounts" :key="'rect-' + acc.id" class="account-row-item">
                      <div class="acc-main-info">
                        <div class="acc-icon-box">{{ acc.icon || '🗓️' }}</div>
                        <div class="acc-texts">
                          <div class="acc-name-text">{{ acc.name }}</div>
                        </div>
                      </div>
                      <div class="acc-balance-display" :class="{ 'is-negative': acc.balance < 0 }">
                        NT$ {{ formatNumber(acc.balance) }}
                      </div>
                    </div>
                  </div>
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
                    <div class="progress-fill" :class="budget.color"
                      :style="{ width: (budget.spent / budget.limit * 100) + '%' }"></div>
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
                <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="搜尋紀錄..."
                  class="search-input" />
              </div>
            </div>

            <div class="card-body">
              <div v-if="isLoading" class="loading-state">載入中...</div>

              <div v-else class="transactions-list">
                <div v-if="transactions.length === 0" class="no-data">找不到相關紀錄</div>

                <div v-for="t in transactions" :key="t.id" class="transaction-item"
                  :class="{ 'is-transfer-row': t.is_transfer }">
                  <div class="transaction-info">
                    <div class="transaction-icon" :class="t.display_type">
                      <span>{{ t.display_icon }}</span>
                    </div>
                    <div>
                      <div class="transaction-name">{{ t.display_title }}</div>

                      <div class="transaction-category">
                        <span v-if="t.display_note" class="note-text">{{ t.display_note }}</span>
                        <!-- <span class="tag">{{ t.display_category }}</span> -->
                        <span class="member-tag" v-if="t.display_member">
                          <i class="glyphicon glyphicon-user"></i> {{ t.display_member }}
                        </span>

                      </div>
                    </div>
                  </div>

                  <div class="transaction-details">
                    <div class="transaction-amount" :class="t.display_type">
                      {{ t.display_type === 'income' ? '+' : (t.display_type === 'expense' ? '-' : '') }}
                      NT$ {{ formatNumber(t.display_amount) }}
                    </div>
                    <div class="transaction-date">{{ t.display_date }}</div>
                  </div>
                </div>
              </div>

              <div class="pagination-container" v-if="pagination.total_pages > 1">
                <button @click="goToPage(pagination.current_page - 1)" :disabled="pagination.current_page === 1"
                  class="page-btn">上一頁</button>
                <span class="page-info">第 {{ pagination.current_page }} / {{ pagination.total_pages }} 頁</span>
                <button @click="goToPage(pagination.current_page + 1)"
                  :disabled="pagination.current_page === pagination.total_pages" class="page-btn">下一頁</button>
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
                    <path
                      d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z">
                    </path>
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
