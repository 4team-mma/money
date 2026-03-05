<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import api from "@/api";

// 引入 Store
import { useCategoryStore } from "@/stores/useCategoryStore";
import { useAccountStore } from "@/stores/useAccountStore";
import { useNotificationStore } from "@/stores/notification";
import { triggerMissionAction } from "@/api/gamification";

// 引入子組件
import BudgetMonthly from "@/components/BudgetMonthly.vue";
import BudgetCategory from "@/components/BudgetCategory.vue";
import BudgetTag from "@/components/BudgetTag.vue";
import SavingsGoals from "@/components/SavingsGoals.vue";

const route = useRoute();
const categoryStore = useCategoryStore();
const accountStore = useAccountStore();
const notificationStore = useNotificationStore();

// --- 響應式狀態 ---
const activeTab = ref("monthly");
const isLoading = ref(true);
const monthlyLimit = ref(0);
const categories = ref([]);
const tagBudgets = ref([]);
const savingsGoals = ref([]);

const tabs = [
  { id: "monthly", label: "月總預算" },
  { id: "category", label: "類別預算" },
  { id: "tag", label: "標籤預算" },
  { id: "savings", label: "儲蓄目標" },
];

// --- 計算屬性：總支出 (供 Monthly 組件使用) ---
const totalSpent = computed(() => {
  return categories.value.reduce((sum, cat) => sum + cat.spent, 0);
});

/**
 * 初始化資料載入
 */
const fetchAllData = async () => {
  try {
    isLoading.value = true;
    await accountStore.loadAccounts(true);

    // 同時取得：通用預算清單、當月支出統計、儲蓄目標
    const [resAll, resStats, resSavings] = await Promise.all([
      api.get("/planning/budgets/all"),
      api.get("/planning/budgets/stats"),
      api.get("/planning/savings-goals"),
    ]);

    const allBudgets = resAll || [];
    const statsData = resStats || { categories: [], tags: [] };

    // 1. 處理月總額
    const totalSetting = allBudgets.find((b) => !b.category && !b.tag);
    monthlyLimit.value = totalSetting ? totalSetting.amount : 0;

    // 2. 同步自定義類別/標籤到 Pinia
    syncDatabaseToStore(allBudgets);

    // 3. 構建顯示清單
    mapBudgetData(allBudgets, statsData);

    // 4. 處理儲蓄目標
    savingsGoals.value = resSavings || [];
  } catch (error) {
    console.error("數據同步失敗:", error);
    ElMessage.error("無法從伺服器取得最新預算資料");
  } finally {
    isLoading.value = false;
  }
};

/**
 * 將資料庫有的類別同步回 Store
 */
const syncDatabaseToStore = (allBudgets) => {
  allBudgets.forEach((dbItem) => {
    // 處理類別與 Icon
    if (dbItem.category) {
      const exists = categoryStore.categories.find(
        (c) => c.itemName === dbItem.category,
      );
      if (!exists) {
        categoryStore.addCustomCategory({
          id: Date.now() + Math.random(),
          itemName: dbItem.category,
          icon: dbItem.category_icon || "📦",
        });
      }
    }
    // 處理標籤與顏色
    if (dbItem.tag) {
      const exists = categoryStore.tags.find((t) => t.itemName === dbItem.tag);
      if (!exists) {
        categoryStore.addCustomTag({
          id: Date.now() + Math.random(),
          itemName: dbItem.tag,
          color: dbItem.tag_color || "#A0AEC0",
        });
      }
    }
  });
};

/**
 * 構建前端顯示用的預算資料
 */
const mapBudgetData = (allBudgets, statsData) => {
  categories.value = categoryStore.categories.map((storeCat) => {
    const statMatch = (statsData.categories || []).find(
      (s) => s.name === storeCat.itemName,
    );
    const budgetMatch = allBudgets.find(
      (b) => b.category === storeCat.itemName,
    );
    return {
      name: storeCat.itemName,
      icon: storeCat.icon,
      spent: statMatch ? statMatch.spent : 0,
      limit: budgetMatch ? budgetMatch.amount : 0,
    };
  });

  tagBudgets.value = categoryStore.tags.map((storeTag) => {
    const statMatch = (statsData.tags || []).find(
      (s) => s.name === storeTag.itemName,
    );
    const budgetMatch = allBudgets.find((b) => b.tag === storeTag.itemName);
    return {
      name: storeTag.itemName,
      color: storeTag.color,
      spent: statMatch ? statMatch.spent : 0,
      limit: budgetMatch ? budgetMatch.amount : 0,
    };
  });
};

/**
 * 儲存所有規劃
 */
const saveAllPlanning = async () => {
  try {
    isLoading.value = true;

    const budgetPayload = [
      { amount: monthlyLimit.value, category: null, tag: null },
      ...categories.value.map((c) => ({
        amount: c.limit,
        category: c.name,
        category_icon: c.icon,
        tag: null,
      })),
      ...tagBudgets.value.map((t) => ({
        amount: t.limit,
        category: null,
        tag: t.name,
        tag_color: t.color,
      })),
    ];

    const savingsPayload = savingsGoals.value.map((g) => ({
      ...g,
      goal_id: g.goal_id || null,
    }));

    await Promise.all([
      api.post("/planning/budgets/batch", budgetPayload),
      api.post("/planning/savings-goals/batch", savingsPayload),
    ]);

    ElMessage.success("同步成功！已儲存所有規劃");
    triggerMissionAction("save_goal");
    await fetchAllData();
    await notificationStore.fetchAll(true);
  } catch (error) {
    ElMessage.error("儲存失敗，請檢查網路");
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchAllData();
  if (route.query.focus) {
    activeTab.value = route.query.tab || "monthly";
    ElMessage.info(`請為「${route.query.focus}」設定預算`);
  }
});
</script>

<template>
  <div class="budget-app-container">
    <header class="page-header">
      <div class="title-group">
        <h1 style="color: var(--text-primary)">理財規劃方案</h1>
        <p class="subtitle">精準控制 Money MMA 流量，實現您的儲蓄目標</p>
      </div>
    </header>

    <nav class="tab-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="['tab-btn', { active: activeTab === tab.id }]"
      >
        {{ tab.label }}
      </button>
    </nav>

    <main class="main-card">
      <transition name="fade" mode="out-in">
        <!-- 核心組件切換 -->
        <BudgetMonthly
          v-if="activeTab === 'monthly'"
          v-model="monthlyLimit"
          :totalSpent="totalSpent"
          :isLoading="isLoading"
        />

        <BudgetCategory
          v-else-if="activeTab === 'category'"
          v-model="categories"
          @refresh="fetchAllData"
        />

        <BudgetTag
          v-else-if="activeTab === 'tag'"
          v-model="tagBudgets"
          @refresh="fetchAllData"
        />

        <SavingsGoals
          v-else-if="activeTab === 'savings'"
          v-model="savingsGoals"
        />
      </transition>
    </main>

    <footer class="page-footer">
      <button class="btn-secondary" @click="fetchAllData">重置</button>
      <button
        class="btn-primary"
        @click="saveAllPlanning"
        :disabled="isLoading"
      >
        {{ isLoading ? "處理中..." : "儲存所有規劃" }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.budget-app-container {
  max-width: 900px;
  margin: 40px auto;
  padding: 0 20px;
  font-family: "Inter", sans-serif;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 30px;
}

.title-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.subtitle {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
}

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
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.main-card {
  background: var(--bg-card);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
  min-height: 450px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition:
    background 0.3s,
    border-color 0.3s;
}

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

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 12px 30px;
  border-radius: 10px;
  cursor: pointer;
}
</style>
