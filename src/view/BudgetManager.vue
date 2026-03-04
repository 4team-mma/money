<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import api from "@/api";
import { ElMessage } from 'element-plus';
import { storeToRefs } from 'pinia';
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useAccountStore } from '@/stores/useAccountStore';
import { triggerMissionAction } from '@/api/gamification';
import { useNotificationStore } from '@/stores/notification';
import { getLocalDate } from '@/utils/dateHelper';
import { useRoute } from 'vue-router';
const route = useRoute();

const categoryStore = useCategoryStore();
const accountStore = useAccountStore();

// 使用 storeToRefs 確保 accounts 是響應式的
const { accounts, loading: accountsLoading } = storeToRefs(accountStore);

// 篩選儲蓄型帳戶供下拉選單使用
const savingsAccounts = computed(() => 
  accounts.value.filter(acc => acc.account_type === 'savings')
);

// 控制新增選單的顯示
const showAddCategory = ref(false)
const newCategoryName = ref('')
const selectedIcon = ref('🍔')

const iconOptions = [
    '🍔', '🚗', '🏠', '🎮', '💡', '💊', '📚', '✈️', '🚆', '🎬', '🎁',
    '🎨', '🎵', '🏃', '🛍️', '🏖️', '🍕', '🍩', '☕', '🥗', '🍎'
]

// 新增類別並同步到預算列表
const handleAddCategory = () => {
  const name = newCategoryName.value.trim()
  if (!name) return

  if (name.length > 15) {
    ElMessage.warning('名稱請控制在 15 字以內')
    return
  }

  // 1. 呼叫 Pinia Store 新增到全域類別清單
  const newItem = {
    id: Date.now(),
    itemName: name,
    icon: selectedIcon.value
  }
  categoryStore.addCustomCategory(newItem)

  // 2. 即時更新目前的預算規劃列表 (讓畫面上馬上出現這一列)
  categories.value.push({
    name: newItem.itemName,
    icon: newItem.icon,
    spent: 0,
    limit: 0
  })

  // 3. 重置輸入框
  newCategoryName.value = ''
  showAddCategory.value = false
  ElMessage.success(`已新增類別：${name}，別忘了設定預算喔！`)
}

// 控制新增標籤選單
const showAddTag = ref(false)
const newTagName = ref('')
const selectedTagColor = ref('#3b82f6') // 預設藍色

const colorOptions = ['#004B97', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const handleAddTag = () => {
  const name = newTagName.value.trim()
  if (!name) return

  if (name.length > 10) {
    ElMessage.warning('標籤名稱請在 10 字以內')
    return
  }

  // 1. 呼叫 Pinia Store 新增到全域標籤清單 (persist 會幫忙存到 LocalStorage)
  const newTagItem = {
    id: Date.now(),
    itemName: name,
    color: selectedTagColor.value
  }
  categoryStore.addCustomTag(newTagItem)

  // 2. 即時更新預算規劃列表，讓畫面出現新標籤卡片
  tagBudgets.value.push({
    name: newTagItem.itemName,
    color: newTagItem.color,
    desc: '自定義心理帳戶',
    spent: 0,
    limit: 0
  })

  // 3. 重置
  newTagName.value = ''
  showAddTag.value = false
  ElMessage.success(`已新增標籤：${name}`)
}

// 控制分頁狀態
const activeTab = ref('monthly');
const tabs = [
  { id: 'monthly', label: '月總預算' },
  { id: 'category', label: '類別預算' },
  { id: 'tag', label: '標籤預算' },
  { id: 'savings', label: '儲蓄目標' }
];

// 1. 月總預算數據
const monthlyLimit = ref(0);

// 2. 類別預算數據
const categories = ref([]);

// 3. 標籤預算 (心理帳戶：需求 vs 想要)
const tagBudgets = ref([]);

const isLoading = ref(true);

const fetchAllData = async () => {
  try {
    isLoading.value = true;

    await accountStore.loadAccounts(true);

    // 同時取得：通用預算清單、當月支出統計、儲蓄目標
    const [resAll, resStats, resSavings] = await Promise.all([
      api.get('/planning/budgets/all'),
      api.get('/planning/budgets/stats'),
      api.get('/planning/savings-goals')
    ]);

    // Axios 封裝已自動提取 data，不用 res.data
    const allBudgets = resAll || [];
    const statsData = resStats || { categories: [], tags: [] };
    savingsGoals.value = resSavings || [];

    // --- A. 月總預算 ---
    const totalSetting = allBudgets.find(b => !b.category && !b.tag);
    monthlyLimit.value = totalSetting ? totalSetting.amount : totalSetting;

    // --- B. 雙向同步：將資料庫有的自定義類別/標籤 補回 Pinia Store ---
    allBudgets.forEach(dbItem => {
      // 處理類別與 Icon
      if (dbItem.category) {
        const exists = categoryStore.categories.find(c => c.itemName === dbItem.category);
        if (!exists) {
          categoryStore.addCustomCategory({
            id: Date.now() + Math.random(),
            itemName: dbItem.category,
            icon: dbItem.category_icon || '📦' // 使用資料庫存的 Icon，若無則給預設
          });
        }
      }
      // 處理標籤與顏色
      if (dbItem.tag) {
        const exists = categoryStore.tags.find(t => t.itemName === dbItem.tag);
        if (!exists) {
          categoryStore.addCustomTag({
            id: Date.now() + Math.random(),
            itemName: dbItem.tag,
            color: dbItem.tag_color || '#A0AEC0' // 使用資料庫存的顏色
          });
        }
      }
    });

    // --- C. 構建「類別預算」顯示清單 (以 Store 為骨架) ---
    categories.value = categoryStore.categories.map(storeCat => {
      const statMatch = (statsData.categories || []).find(s => s.name === storeCat.itemName);
      const budgetMatch = allBudgets.find(b => b.category === storeCat.itemName);
      return {
        name: storeCat.itemName,
        icon: storeCat.icon,
        spent: statMatch ? statMatch.spent : 0,
        limit: budgetMatch ? budgetMatch.amount : 0
      };
    });

    // --- D. 構建「標籤預算」顯示清單 (以 Store 為骨架) ---
    tagBudgets.value = categoryStore.tags.map(storeTag => {
      const statMatch = (statsData.tags || []).find(s => s.name === storeTag.itemName);
      const budgetMatch = allBudgets.find(b => b.tag === storeTag.itemName);
      return {
        name: storeTag.itemName,
        color: storeTag.color,
        desc: storeTag.itemName === '需要' ? '基本生存開銷' : '提升生活品質',
        spent: statMatch ? statMatch.spent : 0,
        limit: budgetMatch ? budgetMatch.amount : 0
      };
    });

    // 處理儲蓄目標資料
    savingsGoals.value = (resSavings || []).map(g => ({
      ...g,
      // 初始化時，若有連結帳戶，先從 Store 拿最新值
      current_amount: g.account_id 
        ? (accounts.value.find(a => a.account_id === g.account_id)?.current_balance || g.current_amount)
        : g.current_amount
    }));

  } catch (error) {
    console.error("數據同步失敗:", error);
    ElMessage.error('無法從伺服器取得最新預算資料');
  } finally {
    isLoading.value = false;
  }
};

// --- 動態計算所有支出的總和 ---
const totalSpent = computed(() => {
  return categories.value.reduce((sum, cat) => sum + cat.spent, 0);
});

// --- 動態計算進度條 ---
const usagePercentage = computed(() => {
  if (monthlyLimit.value <= 0) return 0;
  return Math.round((totalSpent.value / monthlyLimit.value) * 100);
});

// 4. 儲蓄目標數據
const savingsGoals = ref([]);

const addGoal = () => {
  savingsGoals.value.push({
    tempId: Date.now(), // 暫時 ID 用於 key
    goal_id: null,
    account_id: null,
    goal_name: '新儲蓄目標',
    target_amount: 10000,
    current_amount: 0,
    target_date: getLocalDate(),
    status: 'active'
  });
};

const removeGoal = (id) => {
  savingsGoals.value = savingsGoals.value.filter(g => (g.goal_id || g.tempId) !== id);
};

// 計算屬性：總進度
const totalSavingsProgress = computed(() => {
  const totalCurrent = savingsGoals.value.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = savingsGoals.value.reduce((sum, g) => sum + g.target_amount, 0);
  return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
});

const removeCategory = async (catName) => {
  const isConfirmed = confirm(`確定要刪除「${catName}」預算類別嗎？這也會移除該類別的預算設定。`);

  if (isConfirmed) {
    try {
      // 1. 調用後端刪除 API
      await api.delete('/planning/budgets/category', {
        params: { category: catName }
      });

      // 2. 從 Pinia Store 移除 (全域生效)
      categoryStore.removeCustomCategory(catName);

      // 3. 從當前頁面的類別清單移除 (即時更新 UI)
      categories.value = categories.value.filter(c => c.name !== catName);

      ElMessage.success(`已移除類別：${catName}`);
    } catch (error) {
      ElMessage.error('刪除失敗');
    }
  }
};

const removeTag = async (tagName) => {
  // 1. 阻擋刪除預設標籤
  const defaultNames = ['需要', '想要', '旅遊'];
  if (defaultNames.includes(tagName)) {
    ElMessage.warning('系統預設標籤無法刪除');
    return;
  }

  const isConfirmed = confirm(`確定要刪除「${tagName}」標籤嗎？這將移除此標籤的預算設定。`);

  if (isConfirmed) {
    try {
      // 2. 同步刪除資料庫紀錄
      await api.delete('/planning/budgets/tag', {
        params: { tag: tagName }
      });

      // 3. 從 Pinia Store 移除 (持久化生效)
      categoryStore.removeCustomTag(tagName);

      // 4. 即時更新當前畫面的標籤列表
      tagBudgets.value = tagBudgets.value.filter(t => t.name !== tagName);

      ElMessage.success(`已移除標籤：${tagName}`);
    } catch (error) {
      console.error("刪除標籤失敗:", error);
      ElMessage.error('刪除失敗，請稍後再試');
    }
  }
};

// --- 儲存按鈕邏輯 ---
const isSaving = ref(false);

const saveAllPlanning = async () => {
  try {
    isLoading.value = true;
    // 構建預算批次 Payload
    const budgetPayload = [
      // 1. 月總額
      { amount: monthlyLimit.value, category: null, tag: null },
      // 2. 類別 (飲食、交通...)
      ...categories.value.map(c => ({
        amount: c.limit,
        category: c.name,
        category_icon: c.icon,
        tag: null
      })),
      // 3. 標籤 (需要、想要...)
      ...tagBudgets.value.map(t => ({
        amount: t.limit,
        category: null,
        tag: t.name,
        tag_color: t.color
      }))
    ];

    // 構建儲蓄目標 Payload
    const savingsPayload = savingsGoals.value.map(g => ({
      goal_id: g.goal_id || null,
      account_id: g.account_id,
      goal_name: g.goal_name,
      target_amount: g.target_amount,
      current_amount: g.current_amount, // 傳回目前快照
      target_date: g.target_date,
      status: g.status
    }));

    // 平行發送儲存請求
    await Promise.all([
      api.post('/planning/budgets/batch', budgetPayload),
      api.post('/planning/savings-goals/batch', savingsPayload)
    ]);

    ElMessage.success('同步成功！已儲存所有規劃');

    
    // 2. 完成「設定目標」(NF 任務 - 包含新增動作)
    triggerMissionAction('save_goal');

    await fetchAllData(); // 重新整理資料
    const noticeStore = useNotificationStore();
    await noticeStore.fetchAll(true);

  } catch (error) {
    ElMessage.error('儲存失敗，請檢查網路');
  } finally {
    isLoading.value = false;
  }
};

// 頁面載入時執行
onMounted(async () => {
  try {
    await accountStore.loadAccounts(); 
    await fetchAllData();
    triggerMissionAction('view_targets');

    // 檢查是否有帶入 focus 參數
    if (route.query.focus) {
      activeTab.value = route.query.tab || 'monthly';
      
      // 選項：您可以滾動到該位置或讓該輸入框閃爍提示
      ElMessage.info(`請為「${route.query.focus}」設定預算`);
    }
  } catch (error) {
    console.error("初始化資料失敗:", error);
  }
});

// 當儲蓄目標的 account_id 改變時，自動從 Store 同步最新餘額
watch(
  () => savingsGoals.value,
  (newGoals) => {
    newGoals.forEach(goal => {
      if (goal.account_id) {
        const linkedAcc = accounts.value.find(a => a.account_id === goal.account_id);
        if (linkedAcc) {
          // 強制同步 Store 中的最新餘額
          goal.current_amount = linkedAcc.current_balance;
        }
      }
      // 自動判定狀態
      if (goal.current_amount >= goal.target_amount && goal.target_amount > 0) {
        goal.status = 'completed';
      } else {
        goal.status = 'active';
      }
    });
  },
  { deep: true }
);

/**
 * 根據達成率回傳對應的 CSS 變數顏色
 * @param {number} current - 目前金額
 * @param {number} target - 目標金額
 * @returns {string} CSS Variable
 */
const getSavingsColor = (current, target) => {
  if (!target || target <= 0) return 'var(--text-secondary)';
  
  const percentage = (current / target) * 100;

  if (percentage < 30) {
    return 'var(--color-success)'; // 低於 30%：成功綠
  } else if (percentage >= 80) {
    return 'var(--color-danger)';  // 高於 80%：危險紅
  } else {
    return 'var(--color-primary)'; // 中間區段：品牌藍
  }
};
</script>

<template>
    <div class="budget-app-container">
      <header class="page-header">
        <div class="title-group">
          <h1 style="color: var(--text-primary);">理財規劃方案</h1>
          <p class="subtitle">精準控制 Money MMA 流量，實現您的儲蓄目標</p>
        </div>
      </header>

      <nav class="tab-nav">
        <button 
          v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
        >
          {{ tab.label }}
        </button>
      </nav>

      <main class="main-card">
        <transition name="fade" mode="out-in">
          <section v-if="activeTab === 'monthly'" key="monthly" class="budget-section">
            <div class="section-header">
              <h2>每月總額規劃</h2>
            </div>
            <div class="monthly-grid">
              <div class="progress-circle-container">
                <svg viewBox="0 0 36 36" class="circular-chart blue">
                  <path
                    class="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    class="circle"
                    :stroke-dasharray="usagePercentage + ', 100'"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" class="percentage">
                    {{
                      Number.isNaN(usagePercentage)
                        ? "無預算"
                        : usagePercentage + "%"
                    }}
                  </text>
                  <text x="18" y="26" class="label">已使用</text>
                </svg>
              </div>
              <div class="budget-inputs">
                <div class="input-field">
                  <label>月預算上限 (TWD)</label>
                  <div class="currency-input">
                    <span>$</span>
                    <!-- 當 isLoading 為真時，可以顯示載入中樣式 -->
                    <input
                      type="number"
                      v-model="monthlyLimit"
                      :placeholder="isLoading ? '讀取中...' : '請輸入金額'"
                    />
                  </div>
                </div>
                <div class="info-box">
                  <p>💡 顧問提示：目前支出穩定，建議保持標籤預算的平衡。</p>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'category'" class="budget-section">
            <div class="category-list">
              <div
                v-for="cat in categories"
                :key="cat.name"
                class="category-item-card"
              >
                <div class="cat-header">
                  <span class="cat-icon">{{ cat.icon }}</span>
                  <span class="cat-name">{{ cat.name }}</span>

                  <!-- 刪除按鈕：判斷是否為自定義類別 (假設預設類別不顯示刪除) -->
                  <button
                    v-if="!['飲食', '交通', '居家', '娛樂'].includes(cat.name)"
                    class="delete-btn-mini"
                    @click="removeCategory(cat.name)"
                  >
                    ✕
                  </button>
                </div>

                <div class="progress-bar-container">
                  <div class="progress-info">
                    <span>本月已花費: ${{ cat.spent.toLocaleString() }}</span>
                    <!-- 變為可編輯的輸入框 -->
                    <div class="limit-input-group">
                      <span>預算: $</span>
                      <input
                        type="number"
                        v-model.number="cat.limit"
                        class="inline-limit-input"
                      />
                    </div>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      :style="{
                        width:
                          (cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0) +
                          '%',
                        backgroundColor: getSavingsColor(cat.spent, cat.limit)
                      }"
                    ></div>
                  </div>
                </div>
              </div>
              <!-- 自定義類別入口 -->
              <div class="add-category-inline">
                <button
                  v-if="!showAddCategory"
                  @click="showAddCategory = true"
                  class="add-dash-btn"
                >
                  <span>➕ 新增自定義類別預算</span>
                </button>

                <div v-else class="quick-add-form">
                  <div class="form-row">
                    <div class="icon-bubble">{{ selectedIcon }}</div>
                    <input
                      v-model="newCategoryName"
                      placeholder="類別名稱 (如: 醫療、寵物...)"
                      class="name-input"
                      @keyup.enter="handleAddCategory"
                    />
                    <button class="save-btn" @click="handleAddCategory">
                      確認
                    </button>
                    <button class="cancel-btn" @click="showAddCategory = false">
                      取消
                    </button>
                  </div>

                  <div class="icon-picker-mini">
                    <span
                      v-for="icon in iconOptions"
                      :key="icon"
                      @click="selectedIcon = icon"
                      :class="{ active: selectedIcon === icon }"
                      >{{ icon }}</span
                    >
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'tag'" class="budget-section">
            <div class="tag-grid">
              <!-- 標籤卡片 -->
              <div v-for="tag in tagBudgets" :key="tag.name" class="tag-card">
                <!-- 右上角刪除按鈕 (排除預設標籤) -->
                <button
                  v-if="!['需要', '想要', '旅遊'].includes(tag.name)"
                  class="tag-delete-btn"
                  @click.stop="removeTag(tag.name)"
                >
                  ✕
                </button>
                <div
                  class="tag-color-bar"
                  :style="{ backgroundColor: tag.color }"
                ></div>
                <div>
                  <h3>{{ tag.name }}</h3>
                  <div class="tag-stats">
                    <span
                      >本月已花費: ${{ tag.spent.toLocaleString() }}</span
                    >
                    <div class="limit-input-group">
                      <span class="label">預算: $</span>
                      <input
                        type="number"
                        v-model.number="tag.limit"
                        class="inline-limit-input"
                      />
                    </div>
                  </div>
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      :style="{
                        width:
                          (tag.limit > 0 ? (tag.spent / tag.limit) * 100 : 0) +
                          '%',
                        backgroundColor: getSavingsColor(tag.spent, tag.limit) ,
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <!-- 自定義標籤入口 -->
              <div class="add-tag-inline">
                <button
                  v-if="!showAddTag"
                  @click="showAddTag = true"
                  class="add-dash-btn-tag"
                >
                  <span>➕ 新增自定義標籤預算</span>
                </button>

                <div v-else class="quick-add-form-tag">
                  <div class="form-row">
                    <div
                      class="color-preview"
                      :style="{ backgroundColor: selectedTagColor }"
                    ></div>
                    <input
                      v-model="newTagName"
                      placeholder="標籤名稱 (如: 投資、備用...)"
                      class="name-input"
                      @keyup.enter="handleAddTag"
                    />
                    <button class="save-btn-blue" @click="handleAddTag">
                      確認
                    </button>
                    <button class="cancel-btn-text" @click="showAddTag = false">
                      取消
                    </button>
                  </div>

                  <div class="color-picker-mini">
                    <span
                      v-for="color in colorOptions"
                      :key="color"
                      @click="selectedTagColor = color"
                      :class="{ active: selectedTagColor === color }"
                      :style="{ backgroundColor: color }"
                    ></span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section v-else-if="activeTab === 'savings'" key="savings" class="budget-section">
            <!-- 總覽卡片：展示全局進度 -->
            <div class="savings-summary-card">
              <div class="summary-content">
                <span class="summary-label">儲蓄總達成率</span>
                <h2 class="summary-value">{{ totalSavingsProgress }}%</h2>
                <div class="summary-progress-mini">
                  <div class="mini-bar-bg">
                    <div class="mini-bar-fill" :style="{ width: totalSavingsProgress + '%' }"></div>
                  </div>
                </div>
              </div>
              <button class="add-goal-btn" @click="addGoal">
                <span class="plus-icon">＋</span> 新增儲蓄目標
              </button>
            </div>

            <!-- 儲蓄目標列表 -->
            <div class="goals-grid">
              <div 
                v-for="goal in savingsGoals" 
                :key="goal.goal_id || goal.tempId" 
                class="goal-item-card"
                :class="['status-' + goal.status, { 'is-linked': goal.account_id }]" 
              >
                <!-- 達成勳章 -->
                <div v-if="goal.current_amount >= goal.target_amount" class="badge-completed">🏆 達成</div>
                
                <div class="goal-header">
                  <div class="goal-title-group">
                    <span class="goal-status-dot" :style="{ backgroundColor: (goal.current_amount >= goal.target_amount) ? '#48BB78' : '#3182ce' }"></span>
                    <input v-model="goal.goal_name" class="goal-title-input" placeholder="目標名稱..." />
                  </div>
                  <button class="del-goal-x" @click="removeGoal(goal.goal_id || goal.tempId)">✕</button>
                </div>

                <!-- 新增：帳戶連結選擇器 -->
                <div class="goal-account-select-zone">
                  <label class="setting-label">連結儲蓄帳戶</label>
                  <select v-model="goal.account_id" class="modern-select">
                    <option :value="null">❌ 不連結帳戶 (手動輸入更新)</option>
                    <option v-for="acc in savingsAccounts" :key="acc.account_id" :value="acc.account_id">
                      {{ acc.icon }} {{ acc.itemName }} (餘額: ${{ acc.current_balance.toLocaleString() }})
                    </option>
                  </select>
                </div>

                <div class="goal-inputs">
                  <div class="input-group">
                    <label>已存金額 (連動帳戶)</label>
                    <div class="amount-wrapper" :class="{ 'readonly-input': goal.account_id }">
                      <span class="currency-symbol">$</span>
                      <!-- 如果有連結帳戶，顯示格式化後的 Store 餘額 (唯讀) -->
                      <input 
                        v-if="goal.account_id"
                        type="text" 
                        :value="accountStore.formatAccountBalance(goal.account_id)" 
                        readonly 
                      />
                      <!-- 未連結時，才顯示可編輯的數字輸入框 -->
                      <input 
                        v-else
                        type="number" 
                        v-model.number="goal.current_amount" 
                      />
                      <span v-if="goal.account_id" class="sync-icon">🔄</span>
                    </div>
                  </div>
                  <div class="input-group">
                    <label>目標總額 (TWD)</label>
                    <div class="amount-wrapper">
                      <span class="currency-symbol">$</span>
                      <input type="number" v-model.number="goal.target_amount" />
                    </div>
                  </div>
                </div>

                <div class="goal-date-setting">
                  <label>預計達成日期</label>
                  <input type="date" v-model="goal.target_date" class="date-picker-mini" />
                </div>

                <!-- 進度條區塊 -->
                <div class="progress-container-mini">
                  <div class="progress-bar-bg">
                    <div 
                      class="progress-bar-fill savings" 
                      :style="{ width: Math.min((goal.current_amount / goal.target_amount) * 100, 100) + '%' }"
                      :class="{ 'pulse-animation': (goal.current_amount >= goal.target_amount) }"
                    ></div>
                  </div>
                  <div class="progress-info-text">
                    <span class="percent-num">{{ Math.round((goal.current_amount / goal.target_amount) * 100) || 0 }}%</span>
                    <span class="status-text" v-if="(goal.current_amount >= goal.target_amount)">已達成！</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </transition>
      </main>

      <footer class="page-footer">
        <button class="btn-secondary" @click="fetchAllData">重置</button>
        <button
          class="btn-primary"
          @click="saveAllPlanning"
          :disabled="isSaving"
        >
          {{ isSaving ? "儲存中..." : "儲存所有規劃" }}
        </button>
      </footer>
    </div>
</template>

<style scoped>
/* =========================================
   1. 基礎佈局與全域變數銜接
   ========================================= */
.budget-app-container {
  font-family: 'Inter', -apple-system, 'Noto Sans TC', sans-serif;
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  color: var(--text-primary);
  transition: color 0.3s ease;
}

.title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 30px;
}

h1 {
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  line-height: 1.2;
  color: var(--text-primary);
}

/* 副標題 */
.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

/* =========================================
   2. 頁籤導覽 (Tab Navigation)
   ========================================= */
.tab-nav {
  display: flex;
  background: var(--bg-hover);
  padding: 5px;
  border-radius: 12px;
  margin-bottom: 25px;
  width: fit-content;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* =========================================
   3. 主卡片設計 (核心：支援磨砂玻璃效果)
   ========================================= */
.main-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  min-height: 450px;
  /* 針對 sj_wood 等動態背景優化 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: background 0.3s, border-color 0.3s;
}

/* =========================================
   4. 每月總額規劃 (圓形進度條與輸入)
   ========================================= */
.monthly-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 40px;
  align-items: center;
}

.progress-circle-container { width: 200px; margin: 0 auto; }
.circular-chart { display: block; margin: 10px auto; max-width: 100%; }
.circle-bg { fill: none; stroke: var(--bg-hover); stroke-width: 2.8; }
.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke: var(--color-primary);
  transition: stroke-dasharray 0.8s ease-in-out;
}
.percentage { fill: var(--text-primary); font-size: 8px; font-weight: bold; text-anchor: middle; }
.label { fill: var(--text-secondary); font-size: 3px; text-anchor: middle; }

/* 輸入框美化 */
.monthly-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; align-items: center; }
.currency-input {
  display: flex;
  align-items: center;
  background: var(--bg-input);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 20px;
  margin-top: 8px;
  transition: border-color 0.2s;
}

.currency-input:focus-within { border-color: var(--color-primary); }
.currency-input input {
  background: transparent;
  border: none;
  font-size: 24px;
  font-weight: bold;
  width: 100%;
  outline: none;
  color: var(--text-primary);
}

/* 資訊框 */
.info-box {
  background: var(--bg-hover);
  padding: 15px;
  border-radius: 12px;
  margin-top: 25px;
  font-size: 14px;
  color: var(--text-primary);
  border-left: 4px solid var(--color-primary);
}

/* =========================================
   5. 通用進度條 (類別、標籤、儲蓄)
   ========================================= */
.progress-bar-bg {
  background: var(--bg-hover);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar-fill {
  height: 100%;
  /* 寬度與顏色皆有平滑過渡 */
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.4s ease;
}

/* =========================================
   6. 類別與標籤卡片設計
   ========================================= */
.category-item-card, .tag-card {
  background: var(--bg-input);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
}

.tag-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.tag-color-bar { position: absolute; top: 0; left: 0; right: 0; height: 4px; }
.tag-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 15px 0 10px;
}

.cat-header { display: flex; align-items: center; margin-bottom: 12px; }
.cat-icon { font-size: 20px; margin-right: 12px; }
.cat-name { font-weight: 700; flex-grow: 1; color: var(--text-primary); }

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.limit-input-group {
  display: flex;
  align-items: center;
  white-space: nowrap; /* 防止「預算: $」換行或被擠掉 */
  gap: 4px;
}

.limit-input-group .label {
  font-size: 16px;
  display: inline-block; /* 確保它是一個可見區塊 */
}

/* 可編輯虛線輸入框 */
.inline-limit-input {
  width: 90px;
  border: none;
  border-bottom: 2px dashed var(--text-secondary);
  background: rgba(var(--color-primary), 0.03);
  color: var(--text-primary);
  padding: 2px 5px;
  border-radius: 4px;
  font-weight: 600;
  transition: all 0.2s;
}

.inline-limit-input:focus {
  background: var(--bg-card);
  border-bottom: 2px solid var(--color-primary);
  outline: none;
}

/* =========================================
   7. 儲蓄目標 (Savings) 專屬樣式
   ========================================= */
.savings-summary-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%);
  color: var(--text-inverse);
  padding: 30px;
  border-radius: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  transition: all 0.5s ease; /* 當漸層隨 JavaScript 改變時觸發 */
}

.summary-value {
  font-size: 56px;
  font-weight: 900;
  margin: 10px 0;
  letter-spacing: -2px;
  color: var(--text-inverse);
}

.summary-progress-mini {
  width: 150px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.6s ease;
}

/* 儲蓄目標卡片 Grid */
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* 個別目標卡片 */
.goal-item-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 25px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  will-change: transform, box-shadow; /* 效能優化 */
}

/* 狀態：連動帳戶時 (根據主題微調背景) */
.goal-item-card.is-linked {
  background-color: var(--bg-hover);
  border-color: var(--color-primary);
}

/* --- 達成狀態：金色光輝 --- */
.goal-item-card.status-completed {
    border: 2px solid var(--color-gold);
    background: var(--bg-completed-grad);
    box-shadow: 0 10px 20px rgba(236, 201, 75, 0.15); /* 增加金色的外發光 */
}

/* 達成勳章 (Badge) */
.badge-completed {
    position: absolute;
    top: -10px;
    right: -10px;
    background: var(--color-gold);
    color: var(--color-gold-text);
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10;
}

/* --- 失敗/過期狀態 --- */
.goal-item-card.status-failed {
    border-left: 5px solid var(--color-danger);
    opacity: 0.8;
    filter: grayscale(0.2); /* 稍微降低飽和度增加「過期感」 */
}

.goal-item-card.status-failed .goal-title-input {
    color: var(--text-secondary);
}

.goal-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background-color: var(--color-success);
}

/* 卡片頭部與標題輸入 */
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.goal-title-input {
  border: none;
  font-size: 20px;
  font-weight: 800;
  color: var(--text-primary);
  outline: none;
  width: 80%;
  background: transparent;
}

/* 輸入群組佈局 */
.goal-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 15px;
}

.readonly-input {
  background: var(--border-color) !important;
  opacity: 0.7;
}

.readonly-input input {
  cursor: not-allowed;
  color: var(--text-secondary);
}

.sync-icon {
    margin-left: 8px;
    font-size: 14px; /* 修正這裡 */
    color: var(--color-primary);
    animation: spin 4s linear infinite;
}

.goal-account-select-zone {
  margin-bottom: 15px;
  padding: 10px;
  background: var(--bg-hover);
  border-radius: 12px;
}

.setting-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

.modern-select {
  width: 100%;
  padding: 6px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* 金額輸入框區塊 */
.amount-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-body); /* 隨主題切換的淺色背景 */
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
}

.amount-wrapper span {
    color: var(--text-secondary);
}

.currency-symbol { 
  color: var(--text-secondary); 
  font-weight: bold; 
  margin-right: 4px; 
}

.amount-wrapper input {
  border: none;
  background: transparent;
  width: 100%;
  font-weight: 700;
  font-size: 16px;
  color: var(--text-primary);
  outline: none;
}

/* 日期選擇器 */
.goal-date-setting { margin-bottom: 20px; }

.date-picker-mini {
  width: 100%;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

/* 進度條增強 - 使用主題成功綠 */
.progress-bar-fill.savings {
  background: linear-gradient(90deg, var(--color-success) 0%, #68d391 100%);
}

.pulse-animation {
  animation: bar-pulse 2s infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-green {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* 刪除按鈕 */
.del-goal-x {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}

.del-goal-x:hover { 
  color: var(--color-danger); 
}

/* =========================================
    新增目標按鈕 - 多主題適配版
   ========================================= */
.add-goal-btn {
  /* 使用帶有透明度的白色或淺色，確保毛玻璃效果 */
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); /* 確保 Safari 兼容 */
  
  /* 邊框使用主題文字色的極淡版本，增加精緻感 */
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  /* 文字顏色在深色背景下用反白，淺色背景則可依需求調整 */
  color: var(--text-inverse); 
  
  padding: 12px 24px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

/* 加號圖示動畫 */
.plus-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
  display: inline-block;
}

/* =========================================
    懸停與動態效果 (適配不同主題)
   ========================================= */
.add-goal-btn:hover {
  /* 懸停時，背景變為主題主色，或純白 (視設計偏好) */
  background: var(--bg-card);      
  color: var(--color-primary); /* 文字轉為品牌主色 */
  
  transform: translateY(-2px); 
  border-color: var(--color-primary);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* 在深色主題下，懸停效果稍微增強亮度 */
[data-theme="dark"] .add-goal-btn:hover {
  background: #ffffff;
  color: #0f172a;
}

.add-goal-btn:hover .plus-icon {
  transform: rotate(90deg);
}

.add-goal-btn:active {
  transform: translateY(0) scale(0.96);
  opacity: 0.9;
}

/* 針對小螢幕的響應式調整 */
@media (max-width: 480px) {
  .add-goal-btn {
    padding: 10px 16px;
    font-size: 14px;
    width: 100%; /* 手機端建議撐滿或置中 */
    justify-content: center;
  }
}

/* =========================================
  8. 按鈕與自定義類別入口
   ========================================= */
/* 底部按鈕 */
.page-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}
.btn-primary {
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: opacity 0.2s;
}

.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 12px 30px;
  border-radius: 10px;
  cursor: pointer;
}

/* 虛線新增按鈕 */
.add-dash-btn, .add-dash-btn-tag {
  width: 100%;
  padding: 20px;
  background: transparent;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.add-dash-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--bg-hover);
}

/* 刪除按鈕 */
.delete-btn-mini, .tag-delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--color-danger);
  color: white;
  border: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
  font-size: 10px;
}

.delete-btn-mini:hover, .tag-delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* =========================================
   9. 通用表單與輸入框
   ========================================= */
.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.name-input {
  flex-grow: 1;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 10px 14px;
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.name-input:focus {
  border-color: var(--color-primary);
}

/* 按鈕通用樣式 */
.save-btn, .save-btn-blue {
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.cancel-btn, .cancel-btn-text {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* =========================================
   10. 自定義類別 (Category) 設計
   ========================================= */
.add-dash-btn {
  width: 100%;
  padding: 24px;
  background: transparent;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.add-dash-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--bg-hover);
}

.quick-add-form {
  background: var(--bg-card);
  border: 1px solid var(--color-primary);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.icon-bubble {
  font-size: 1.5rem;
  background: var(--bg-hover);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.icon-picker-mini {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.icon-picker-mini span {
  font-size: 1.25rem;
  padding: 6px;
  cursor: pointer;
  border-radius: 8px;
  transition: transform 0.2s, background 0.2s;
}

.icon-picker-mini span:hover {
  background: var(--bg-hover);
  transform: scale(1.2);
}

.icon-picker-mini span.active {
  background: var(--color-primary);
  color: var(--text-inverse);
}

/* =========================================
  11. 自定義標籤 (Tag) 設計
   ========================================= */
.add-tag-inline {
  /* 確保在 Grid 中佔據跟其他卡片一樣的高度 */
  min-height: 160px;
}

.add-dash-btn-tag {
  width: 100%;
  height: 100%;
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
}

.add-dash-btn-tag:hover {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.quick-add-form-tag {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--bg-body);
  box-shadow: 0 0 0 1px var(--border-color);
}

.color-picker-mini {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.color-picker-mini span {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s;
}

.color-picker-mini span.active {
  transform: scale(1.3);
  border-color: var(--text-primary);
}

/* 隱藏 Chrome/Safari 數字箭頭 */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>