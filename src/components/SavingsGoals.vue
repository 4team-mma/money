<script setup>
import { computed, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAccountStore } from "@/stores/useAccountStore";
import { getLocalDate } from "@/utils/dateHelper";

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "remove"]);

const accountStore = useAccountStore();
const { accounts } = storeToRefs(accountStore);

// 篩選儲蓄型帳戶供下拉選單使用
const savingsAccounts = computed(() =>
  accounts.value.filter((acc) => acc.account_type === "savings"),
);

// 計算屬性：總進度
const totalSavingsProgress = computed(() => {
  const totalCurrent = props.modelValue.reduce(
    (sum, g) => sum + g.current_amount,
    0,
  );
  const totalTarget = props.modelValue.reduce(
    (sum, g) => sum + g.target_amount,
    0,
  );
  return totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
});

// 新增目標邏輯
const addGoal = () => {
  const newList = [...props.modelValue];
  newList.push({
    tempId: Date.now(),
    goal_id: null,
    account_id: null,
    goal_name: "請點此編輯儲蓄目標名稱",
    target_amount: 10000,
    current_amount: 0,
    target_date: getLocalDate(),
    status: "active",
  });
  emit("update:modelValue", newList);
};

// 移除目標
const removeGoal = (id) => {
  const newList = props.modelValue.filter(
    (g) => (g.goal_id || g.tempId) !== id,
  );
  emit("update:modelValue", newList);
};

// 監聽帳戶連動與狀態判定
watch(
  () => props.modelValue,
  (newGoals) => {
    newGoals.forEach((goal) => {
      if (goal.account_id) {
        const linkedAcc = accounts.value.find(
          (a) => a.account_id === goal.account_id,
        );
        if (linkedAcc) {
          goal.current_amount = linkedAcc.current_balance;
        }
      }
      // 自動判定狀態
      if (goal.current_amount >= goal.target_amount && goal.target_amount > 0) {
        goal.status = "completed";
      } else {
        goal.status = "active";
      }
    });
  },
  { deep: true },
);
</script>

<template>
  <section>
    <!-- 總覽卡片 -->
    <div class="savings-summary-card">
      <div>
        <span>儲蓄總達成率</span>
        <h2 class="summary-value">{{ totalSavingsProgress }}%</h2>
        <div class="summary-progress-mini">
          <div>
            <div
              class="mini-bar-fill"
              :style="{ width: totalSavingsProgress + '%' }"
            ></div>
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
        v-for="goal in modelValue"
        :key="goal.goal_id || goal.tempId"
        class="goal-item-card"
        :class="['status-' + goal.status, { 'is-linked': goal.account_id }]"
      >
        <!-- 達成勳章 -->
        <div
          v-if="goal.current_amount >= goal.target_amount"
          class="badge-completed"
        >
          達成
        </div>

        <div class="goal-header">
          <div>
            <span
              class="goal-status-dot"
              :style="{
                backgroundColor:
                  goal.current_amount >= goal.target_amount
                    ? '#48BB78'
                    : '#3182ce',
              }"
            ></span>
            <input
              v-model="goal.goal_name"
              class="goal-title-input"
              placeholder="目標名稱..."
            />
          </div>
          <button
            class="del-goal-x"
            @click="removeGoal(goal.goal_id || goal.tempId)"
          >
            ✕
          </button>
        </div>

        <!-- 帳戶連結選擇器 -->
        <div class="goal-account-select-zone">
          <label class="setting-label">連結儲蓄帳戶</label>
          <select v-model="goal.account_id" class="modern-select">
            <option :value="null">❌ 不連結帳戶 (手動輸入更新)</option>
            <option
              v-for="acc in savingsAccounts"
              :key="acc.account_id"
              :value="acc.account_id"
            >
              {{ acc.icon }} {{ acc.itemName }} (餘額: ${{
                acc.current_balance.toLocaleString()
              }})
            </option>
          </select>
        </div>

        <div class="goal-inputs">
          <div class="input-group">
            <label>已存金額 (連動帳戶)</label>
            <div
              class="amount-wrapper"
              :class="{ 'readonly-input': goal.account_id }"
            >
              <span v-if="!goal.account_id" class="currency-symbol">$</span>
              <input
                v-if="goal.account_id"
                type="text"
                :value="accountStore.formatAccountBalance(goal.account_id)"
                readonly
              />
              <input
                v-else
                type="number"
                v-model.number="goal.current_amount"
              />
              <span v-if="goal.account_id" class="sync-icon">🔄</span>
            </div>
          </div>
          <div class="input-group">
            <label>目標總額</label>
            <div class="amount-wrapper">
              <span class="currency-symbol">$</span>
              <input type="number" v-model.number="goal.target_amount" />
            </div>
          </div>
        </div>

        <div class="goal-date-setting">
          <label>預計達成日期</label>
          <input
            type="date"
            v-model="goal.target_date"
            class="date-picker-mini"
          />
        </div>

        <!-- 進度條區塊 -->
        <div>
          <div class="progress-bar-bg">
            <div
              class="progress-bar-fill savings"
              :style="{
                width:
                  Math.min(
                    (goal.current_amount / goal.target_amount) * 100,
                    100,
                  ) + '%',
              }"
              :class="{
                'pulse-animation': goal.current_amount >= goal.target_amount,
              }"
            ></div>
          </div>
          <div>
            <span
              >{{
                Math.round((goal.current_amount / goal.target_amount) * 100) ||
                0
              }}%</span
            >
            <span v-if="goal.current_amount >= goal.target_amount"
              >已達成！</span
            >
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.savings-summary-card {
  background: linear-gradient(
    135deg,
    var(--color-primary) 0%,
    var(--color-success) 100%
  );
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

.plus-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
  display: inline-block;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.goal-item-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 25px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  will-change: transform, box-shadow; /* 效能優化 */
}

.goal-item-card.is-linked {
  background-color: var(--bg-hover);
  border-color: var(--color-primary);
}

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

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.goal-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background-color: var(--color-success);
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

.goal-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 15px;
}

.input-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.amount-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-body);
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

.readonly-input {
  background: var(--border-color) !important;
  opacity: 0.7;
}

.readonly-input input {
  cursor: not-allowed;
  color: var(--text-secondary);
}

.goal-date-setting {
  margin-bottom: 20px;
}

.date-picker-mini {
  width: 100%;
  border: 1px solid var(--border-color);
  background: var(--bg-input);
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
  color: var(--text-primary);
}

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
  transition:
    width 0.8s cubic-bezier(0.4, 0, 0.2, 1),
    background-color 0.4s ease;
}

.progress-bar-fill.savings {
  background: linear-gradient(90deg, var(--color-success) 0%, #68d391 100%);
}

.pulse-animation {
  animation: bar-pulse 2s infinite;
}

.sync-icon {
  margin-left: 8px;
  font-size: 14px;
  color: var(--color-primary);
  animation: spin 4s linear infinite;
}
</style>