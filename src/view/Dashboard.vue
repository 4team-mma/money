<script setup>
import { ref, onMounted, computed } from 'vue'
import Nav from '@/components/Nav.vue';
import api from '@/api'
import { accountApi } from '@/api/account';import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router';

const router = useRouter();

/**
 * 跳轉至預算設定頁面
 * @param {string} categoryName - 類別名稱
 */
const goToSettings = (categoryName) => {
  router.push({
    name: 'BudgetManager', // 👈 請確認您 router/index.js 中設定頁面的 name
    query: { 
      tab: 'category',       // 預設切換到類別預算標籤
      focus: categoryName   // 帶入類別名稱，方便設定頁面自動定位
    }
  });
};

const noticeStore = useNotificationStore()

// 💡 取得最近的 3 則通知顯示在儀表板
const recentNotifications = computed(() => {
  return noticeStore.list.slice(0, 3) 
})

// 💡 存放從 API 抓回來的「活資料」
const transactions = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const accounts = ref([]);
const isAccountsLoading = ref(false);

// 1. 分頁結構
const pagination = ref({
  current_page: 1,
  total_pages: 1,
  total_rows: 0,
  has_next: false,
  has_prev: false
})

// 2. 月度統計資料
const monthlyStats = ref({
  income: 0,
  incomeChange: 0, // 較上月增加 %
  expense: 0,
  expenseChange: 0, // 較上月減少 %
  balance: 0,
  savingsRate: 0
})

// --- [隊友新增] 預算資料 ---
const budgets = ref([])

const fetchBudgetData = async () => {
  try {
    isLoading.value = true;
    
    // 平行發送請求：取得預算設定與實際支出
    const [resBudgets, resStats] = await Promise.all([
      api.get('/planning/budgets/all'),
      api.get('/planning/budgets/stats')
    ]);

    const budgetSettings = resBudgets || [];
    const actualStats = resStats.categories || [];

    // 將資料合併為 UI 需要的格式
    budgets.value = budgetSettings
      .filter(b => b.category !== null) // 只顯示類別預算
      .map(b => {
        // 從實際支出中尋找匹配的類別
        const stat = actualStats.find(s => s.name === b.category);
        const spent = stat ? stat.spent : 0;
        const limit = parseFloat(b.amount);
        const ratio = limit > 0 ? (spent / limit) : 0;

        return {
          category: b.category,
          icon: b.category_icon || '💰',
          limit: limit,
          spent: spent,
          // 根據比例動態決定顏色 class
          color: ratio >= 1 ? 'progress-danger' : (ratio >= 0.8 ? 'progress-warning' : 'progress-primary')
        };
      });
  } catch (error) {
    console.error("載入預算追蹤失敗", error);
  } finally {
    isLoading.value = false;
  }
};

// ==========================================
// 🚀 核心邏輯區 (整合隊友的 API 呼叫)
// ==========================================

// 1. 抓取月度統計
const fetchMonthlyStats = async () => {
  try {
    const response = await api.get('/records/stats/monthly');
    const data = response.data?.data || response.data || response;

    monthlyStats.value = {
      income: Number(data.total_income) || 0,
      incomeChange: data.income_change || 0,
      expense: Number(data.total_expense) || 0,
      expenseChange: data.expense_change || 0,
      balance: Number(data.net_savings) || 0,
      savingsRate: data.total_income > 0 
        ? ((data.net_savings / data.total_income) * 100).toFixed(1) 
        : 0
    };
  } catch (error) {
    console.error("❌ 抓取統計數據失敗:", error);
  }
}

// 2. [隊友新增] 抓取帳戶列表並清洗資料
const fetchDashboardData = async () => {
  isAccountsLoading.value = true;
  try {
    const response = await accountApi.getList();
    const rawData = response.data ? response.data : response;

    if (Array.isArray(rawData)) {
      // 轉換後端欄位為前端格式
      accounts.value = rawData.map(acc => ({
        id: acc.account_id,
        name: acc.account_name,
        balance: Number(acc.current_balance),
        icon: acc.account_icon || '💰',
        exclude: acc.exclude_from_assets
      }));
    }
  } catch (error) {
    console.error("載入帳戶失敗:", error);
  } finally {
    isAccountsLoading.value = false;
  }
};

// 3. [隊友新增] 計算總淨資產 (Computed)
const totalNetWorth = computed(() => {
  if (!accounts.value.length) return 0;
  return accounts.value.reduce((sum, acc) => {
    if (acc.exclude) return sum; // 排除不計入資產的帳戶
    return sum + (Number(acc.balance) || 0);
  }, 0);
});

// 4. [隊友新增] 經常收支帳戶 (邏輯：根據交易紀錄頻率)
const frequentAccounts = computed(() => {
  if (transactions.value.length === 0) return accounts.value.slice(0, 3);
  
  const counts = {};
  transactions.value.forEach(t => {
    const name = t.display_member; // 這裡假設用 member 或 account name 匹配
    counts[name] = (counts[name] || 0) + 1;
  });

  return [...accounts.value]
    .sort((a, b) => (counts[b.name] || 0) - (counts[a.name] || 0))
    .slice(0, 3);
});

// 5. [隊友新增] 最近異動帳戶 (邏輯：取最新加入的)
const recentAccounts = computed(() => {
  return [...accounts.value].reverse().slice(0, 3);
});

// 6. 抓取交易紀錄 (含搜尋與分頁)
const fetchTransactions = async (page = 1) => {
  isLoading.value = true
  try {
    const pageSize = 10;
    const params = { page, page_size: pageSize, search: searchQuery.value };

    const [recordsRes, transfersRes] = await Promise.all([
      api.get('/records/', { params }),
      api.get('/transfers/')
    ]);

    const recData = recordsRes.data?.data || recordsRes.data || recordsRes || [];
    const traData = transfersRes.data?.data || transfersRes.data || transfersRes || [];

    // 搜尋過濾邏輯
    const isSearchingTransfer = searchQuery.value && 
      (searchQuery.value.includes('轉') || searchQuery.value.includes('帳'));
    
    let filteredTransfers = traData;
    if (searchQuery.value && !isSearchingTransfer) {
      filteredTransfers = [];
    }

    // 格式化一般收支
    const recordList = recData.map(item => ({
      id: `r-${item.add_id}`,
      display_title: item.add_class,
      display_note: item.add_note || '',
      display_date: item.add_date,
      display_amount: Number(item.add_amount) || 0,
      display_icon: item.add_class_icon || '📝',
      display_type: item.add_type ? 'income' : 'expense',
      display_member: item.add_member,
      display_tag: item.add_tag, // 補上 tag
      is_transfer: false
    }));

    // 格式化轉帳紀錄
    const transferList = filteredTransfers.map(item => ({
      id: `t-${item.transaction_id}`,
      display_title: '帳戶互轉',
      display_flow: `${item.from_account_name} ➔ ${item.to_account_name}`, // [隊友修改] 流向
      display_date: item.transaction_date,
      display_amount: Number(item.amount) || 0,
      display_icon: '🔄',
      display_type: 'transfer',
      display_note: item.transaction_note || '',
      is_transfer: true
    }));

    // 合併排序
    const combined = [...recordList, ...transferList].sort((a, b) => 
      new Date(b.display_date) - new Date(a.display_date)
    );

    transactions.value = combined.slice(0, pageSize);

    // 計算分頁
    const serverTotalRows = recordsRes.data?.pagination?.total_rows || recordsRes.pagination?.total_rows || recData.length;
    const totalCount = serverTotalRows + (searchQuery.value && !isSearchingTransfer ? 0 : traData.length);

    pagination.value = {
      current_page: page,
      total_pages: Math.ceil(totalCount / pageSize) || 1,
      total_rows: totalCount
    };

  } catch (error) {
    console.error("❌ 抓取失敗:", error);
  } finally {
    isLoading.value = false;
  }
}

// 輔助函式
const formatNumber = (num) => num ? num.toLocaleString() : 0;

let searchTimer = null;
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => fetchTransactions(1), 500);
}

const goToPage = (page) => {
  if (page >= 1 && page <= pagination.value.total_pages) fetchTransactions(page);
}

onMounted(async () => {
  fetchMonthlyStats();
  await fetchDashboardData();
  fetchTransactions();
  fetchBudgetData();
  noticeStore.fetchAll()
})
</script>

<template>
  <Nav>
    <div class="dashboard-page-layout">
      <div class="dashboard-container">
        
        <div class="page-header">
          <div>
            <h1 class="page-title">儀表板</h1>
            <p class="page-subtitle">歡迎回來！這是您本月的財務概況</p>
          </div>
        </div>

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
              <p class="change-text">{{ monthlyStats.incomeChange >= 0 ? '增加' : '減少' }} {{ Math.abs(monthlyStats.incomeChange) }}%</p>
            </div>
          </div>

          <div class="stat-card expenditure-card">
            <div class="card-header">
              <span class="card-title">本月支出</span>
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                <polyline points="17 18 23 18 23 12"></polyline>
              </svg>
            </div>
            <div class="card-content">
              <div class="amount">NT$ {{ formatNumber(monthlyStats.expense) }}</div>
              <p class="change-text">{{ monthlyStats.expenseChange >= 0 ? '增加' : '減少' }} {{ Math.abs(monthlyStats.expenseChange) }}%</p>
            </div>
          </div>

          <div class="stat-card net-card">
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

        <div class="content-grid">
          
          <div class="card accounts-card">
            <div class="card-inner-header">
                <div>
                  <h3 class="card-inner-title">帳戶總覽</h3>
                  <p class="card-description">常用與最近異動帳戶</p>
                </div>
            </div>
            
            <div class="card-net-worth">
                <span class="label">總淨資產</span>
                <span class="value"> NT$ {{ formatNumber(totalNetWorth) }} </span>
            </div>

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

                <div class="section-divider"></div>

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

          <div class="card">
            <div class="card-inner-header">
              <h3 class="card-inner-title">預算追蹤</h3>
              <p class="card-description">本月預算使用狀況 (依類別)</p>
            </div>
            
            <div class="card-body" v-if="!isLoading">
              <div class="budgets-list">
                <div v-for="budget in budgets" :key="budget.category" class="budget-item">
                  <div class="budget-header">
                    <span class="budget-category">
                      <span class="cat-icon">{{ budget.icon }}</span> {{ budget.category }}
                    </span>
                    <span class="budget-amounts">
                      NT$ {{ formatNumber(budget.spent) }} / {{ formatNumber(budget.limit) }}
                    </span>
                  </div>
                  
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :class="budget.limit > 0 ? budget.color : 'bg-gray'"
                      :style="{ width: (budget.limit > 0 ? Math.min((budget.spent / budget.limit * 100), 100) : 0) + '%' }"
                    ></div>
                  </div>
                  
                  <div class="budget-footer">
                    <!-- 情況 A: 有設定預算 (limit > 0) -->
                    <template v-if="budget.limit && budget.limit > 0">
                      <span>
                        {{ ((budget.spent / budget.limit) * 100).toFixed(0) }}% 已使用
                      </span>
                      
                      <span v-if="(budget.limit - budget.spent) >= 0">
                        剩餘 NT$ {{ formatNumber(budget.limit - budget.spent) }}
                      </span>
                      <span v-else class="text-danger">
                        超支 NT$ {{ formatNumber(budget.spent - budget.limit) }}
                      </span>
                    </template>

                    <!-- 情況 B: 未設定預算 (limit 為 0 或未定義) -->
                    <template v-else>
                      <!-- 加入點擊事件，並傳入該類別名稱 -->
                      <span 
                        class="text-link" 
                        @click="goToSettings(budget.category)"
                        title="點擊前往設定預算"
                      >
                        ⚠️ 未設定預算 (點擊設定)
                      </span>
                      <span class="text-muted">目前支出 NT$ {{ formatNumber(budget.spent) }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 載入中狀態 -->
            <div v-else class="loading-placeholder">讀取預算數據中...</div>
          </div>
        </div>

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
                        <span v-if="t.display_tag" class="tag-frame">{{ t.display_tag }}</span>
                        <span v-if="t.display_member" class="member-label">
                          <i class="glyphicon glyphicon-user"></i> {{ t.display_member }} 
                        </span>
                        <span v-if="t.display_note" class="note-text">
                            <span v-if="t.display_member" class="note-divider"> | </span>
                          {{ t.display_note }}</span>
                        <span v-if="t.is_transfer && t.display_flow" class="transfer-flow">
                          {{ t.display_flow }}
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
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div>
                  <h3 class="card-inner-title">重要通知</h3>
                  <p class="card-description">系統提醒與建議</p>
                </div>
                <!-- 跳轉按鈕 -->
                <RouterLink to="/Notifications" style="font-size: 0.8rem; color: var(--color-primary); text-decoration: none;">
                  查看全部 ›
                </RouterLink>
              </div>
            </div>
            
            <div class="card-body">
              <div class="notifications-list">
                <!-- 動態渲染列表 -->
                <div 
                  v-for="item in recentNotifications" 
                  :key="item.reminder_id" 
                  :class="['notification-item', item.category === 'budget' ? 'warning' : 'success']"
                >
                  <div class="notification-title">
                    {{ item.category === 'budget' ? '預算提醒' : '儲蓄目標' }}
                  </div>
                  <p class="notification-text">{{ item.reminder_title }}</p>
                </div>

                <!-- 空狀態處理 -->
                <div v-if="recentNotifications.length === 0" class="empty-notifications">
                  <p>🎉 目前沒有待處理的通知</p>
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
/* 引用共用儀表板樣式 */
@import '../assets/css/dashboard.css';

/* =========== 覆寫樣式 (Dark Mode 支援) ===========
  以下針對 Dashboard.vue 內部特定的元素進行變數替換
*/

/* 1. 頁面標題與副標題 */
.page-title {
  color: var(--text-primary);
}
.page-subtitle {
  color: var(--text-secondary);
}

/* 2. 卡片通用 */
.card {
  background: var(--bg-card); /* 原本 white */
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color); /* 增加邊框 */
  border-radius: 16px;
  padding: 20px;
}

.card-inner-title {
  color: var(--text-primary); /* 原本 #2c3e50 */
}
.card-description {
  color: var(--text-secondary); /* 原本 #64748b */
}

/* 3. 淨資產顯示 */
.card-net-worth {
  margin: 10px 0 20px 0;
}
.card-net-worth .label {
  font-size: 18px;
  color: var(--text-secondary); /* 原本 #8c8c8c */
  margin-right: 10px;
}
.card-net-worth .value {
  font-size: 30px;
  font-weight: 700;
  color: var(--text-primary); /* 原本 #2c3e50 */
}

/* 4. 統計卡片 (Stat Cards) */
.stat-card {
  background: var(--bg-card); /* 原本 white */
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.stat-card .card-title {
  color: var(--text-secondary);
}
.stat-card .amount {
  color: var(--text-primary);
}

/* 5. 搜尋框 */
.search-input {
  background: var(--bg-input); /* 原本 white/transparent */
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

/* 6. 交易紀錄列表 */
.transaction-item {
  border-bottom: 1px solid var(--border-color); /* 原本 #f1f5f9 */
}
.transaction-name {
  color: var(--text-primary); /* 原本 #1e293b */
}
.transaction-date {
  color: var(--text-secondary);
}

/* 7. 帳戶列表 (Account Rows) */
.account-row-item {
  background: var(--bg-body); /* 原本 #f8fafc (改用淺灰變數) */
  border: 1px solid var(--border-color);
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 12px;
}
.acc-name-text {
  color: var(--text-primary);
}
.acc-balance-display {
  color: var(--text-primary);
  font-weight: 600;
}
/* 負數餘額紅色 */
.is-negative {
  color: var(--color-danger);
}

/* 8. 標籤與備註 (保留你原本的設定並變數化) */
.note-text {
  font-size: 12px;
  color: var(--text-secondary); /* 原本 #64748b */
  margin-right: 8px;
}

.tag-frame {
  font-size: 11px;
  color: #777373; /* 這個顏色可能要保留或微調 */
  border: 1px solid var(--bg-card);
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 4px;
  background-color: #f5efbf; /* 標籤底色暫時維持 */
}

.member-label {
  font-size: 12px;
  color: #adb9cc; /* 原本淡藍色 */
  font-weight: 500;
  margin-right: 8px;
}

.transfer-flow {
  font-size: 12px;
  color: var(--color-primary); /* 原本深綠改用品牌色，或維持 #0d63aa */
  font-weight: 600;
  margin-right: 8px;
}

.note-divider {
  margin-right: 6px;
  color: var(--border-color); /* 原本 #ccc */
  user-select: none;
}

.section-divider {
  margin: 15px 0;
  border-top: 1px dashed var(--border-color); /* 原本 #eee */
}

/* 9. 通知 */
.notification-title {
  color: var(--text-primary);
}
.notification-text {
  color: var(--text-secondary);
}

/* 10. 分頁按鈕 */
.page-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
}
.page-btn:disabled {
  color: var(--text-secondary);
  background: var(--bg-body);
}

.income-card { border-left: 4px solid #3b82f6;}
.expenditure-card   { border-left: 4px solid #ef4444;}
.net-card  { border-left: 4px solid #10b981;}

.income-card .icon{color: #3b82f6;}
.expenditure-card .icon{color:#ef4444;}
.net-card .icon { color:  #10b981;}
</style>