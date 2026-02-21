<script setup>
import Nav from '@/components/Nav.vue'
import { ref, computed, onMounted } from 'vue';
import api from "@/api";
import { ElMessage } from 'element-plus';
import { useCategoryStore } from "@/stores/useCategoryStore";

const categoryStore = useCategoryStore();

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

const fetchCurrentBudget = async () => {
  try {
    isLoading.value = true;

    // 1. 發送請求取得：所有預算設定 (all) 與 實際支出統計 (stats)
    const [resAll, resStats] = await Promise.all([
      api.get('/planning/budgets/all'),
      api.get('/planning/budgets/stats')
    ]);

    // Axios 封裝已自動提取 data，不用 res.data
    const allBudgets = resAll || [];
    const statsData = resStats || { categories: [], tags: [] };

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
const savingsGoals = ref([
  { id: 1, title: '日本旅遊基金', current: 15200, target: 20000, deadline: '2026-06' },
  { id: 2, title: '緊急預備金', current: 80000, target: 100000, deadline: '2026-12' }
]);

// 計算儲蓄總進度
const totalSavingsProgress = computed(() => {
  const totalCurrent = savingsGoals.value.reduce((sum, goal) => sum + goal.current, 0);
  const totalTarget = savingsGoals.value.reduce((sum, goal) => sum + goal.target, 0);
  return Math.round((totalCurrent / totalTarget) * 100);
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

const saveAllBudgets = async () => {
  try {
    isLoading.value = true;
    const payload = [
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

    // 呼叫你剛寫好的 FastAPI /batch 接口
    await api.post('/planning/budgets/batch', payload);
    ElMessage.success('同步成功！已儲存所有規劃');

  } catch (error) {
    ElMessage.error('儲存失敗，請檢查網路');
  } finally {
    isLoading.value = false;
  }
};

// 頁面載入時執行
onMounted(() => {
  fetchCurrentBudget();
});

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
  <Nav>
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

          <section
            v-else-if="activeTab === 'savings'"
            key="savings"
            class="budget-section"
          >
            <div class="savings-summary-card">
              <div class="summary-text">
                <h3>總儲蓄達成率</h3>
                <p>本月已完成 {{ totalSavingsProgress }}% 的儲蓄進度</p>
              </div>
              <div class="summary-value">{{ totalSavingsProgress }}%</div>
            </div>
            <div class="goals-list">
              <div
                v-for="goal in savingsGoals"
                :key="goal.id"
                class="goal-item"
              >
                <div class="goal-info">
                  <span class="goal-title">{{ goal.title }}</span>
                  <span class="goal-date">目標日期：{{ goal.deadline }}</span>
                </div>
                <div class="goal-progress-wrapper">
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill savings"
                      :style="{
                        width: (goal.current / goal.target) * 100 + '%',
                        backgroundColor: getSavingsColor(goal.current, goal.target)
                      }"
                    ></div>
                  </div>
                  <div class="goal-amounts">
                    <span>${{ goal.current.toLocaleString() }}</span>
                    <span>${{ goal.target.toLocaleString() }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </transition>
      </main>

      <footer class="page-footer">
        <button class="btn-secondary" @click="fetchCurrentBudget">重置</button>
        <button
          class="btn-primary"
          @click="saveAllBudgets"
          :disabled="isSaving"
        >
          {{ isSaving ? "儲存中..." : "儲存所有規劃" }}
        </button>
      </footer>
    </div>
  </Nav>
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

.summary-value { font-size: 48px; font-weight: 900; opacity: 0.9; }

.goal-item {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
}

.goal-info { display: flex; justify-content: space-between; margin-bottom: 10px; }
.goal-title { font-weight: 700; font-size: 18px; color: var(--text-primary); }
.goal-amounts { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-secondary); margin-top: 8px; }

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