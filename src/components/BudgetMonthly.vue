<script setup>
import { computed } from "vue";

const props = defineProps({
  // 月預算上限 (TWD)
  modelValue: {
    type: Number,
    required: true,
    default: 0,
  },
  // 所有類別的支出總和 (由父組件傳入或在此計算)
  totalSpent: {
    type: Number,
    required: true,
    default: 0,
  },
  // 是否正在讀取中
  isLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

/**
 * 動態計算進度條百分比
 */
const usagePercentage = computed(() => {
  if (props.modelValue <= 0) return 0;
  const percentage = Math.round((props.totalSpent / props.modelValue) * 100);
  return percentage > 100 ? 100 : percentage; // 最高顯示 100%
});

/**
 * 實際顯示的百分比數字 (若超過 100% 則顯示真實數字，但進度條停在 100)
 */
const displayPercentage = computed(() => {
  if (props.modelValue <= 0) return NaN;
  return Math.round((props.totalSpent / props.modelValue) * 100);
});

// 當輸入框數值改變時通知父組件
const handleInput = (e) => {
  emit("update:modelValue", Number(e.target.value));
};
</script>

<template>
  <section>
    <div>
      <h2>每月總額規劃</h2>
    </div>

    <div class="monthly-grid">
      <!-- 圓形進度條容器 -->
      <div class="progress-circle-container">
        <svg viewBox="0 0 36 36" class="circular-chart blue">
          <!-- 背景圓圈 -->
          <path
            class="circle-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <!-- 動態進度圓圈 -->
          <path
            class="circle"
            :stroke-dasharray="usagePercentage + ', 100'"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <!-- 百分比文字 -->
          <text x="18" y="20.35" class="percentage">
            {{
              Number.isNaN(displayPercentage)
                ? "無預算"
                : displayPercentage + "%"
            }}
          </text>
          <text x="18" y="26" class="label">已使用</text>
        </svg>
      </div>

      <!-- 預算輸入區塊 -->
      <div>
        <div>
          <label>月預算上限 (TWD)</label>
          <div class="currency-input">
            <span>$</span>
            <input
              type="number"
              :value="modelValue"
              @input="handleInput"
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
</template>

<style scoped>
.monthly-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 40px;
  align-items: center;
}

/* 圓形進度條樣式 */
.progress-circle-container {
  width: 200px;
  margin: 0 auto;
}

.circular-chart {
  display: block;
  margin: 10px auto;
  max-width: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--bg-hover);
  stroke-width: 2.8;
}

.circle {
  fill: none;
  stroke-width: 2.8;
  stroke-linecap: round;
  stroke: var(--color-primary);
  transition: stroke-dasharray 0.8s ease-in-out;
}

.percentage {
  fill: var(--text-primary);
  font-size: 8px;
  font-weight: bold;
  text-anchor: middle;
}

.label {
  fill: var(--text-secondary);
  font-size: 3px;
  text-anchor: middle;
}

/* 輸入框美化 */
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

.currency-input:focus-within {
  border-color: var(--color-primary);
}

.currency-input input {
  background: transparent;
  border: none;
  font-size: 24px;
  font-weight: bold;
  width: 100%;
  outline: none;
  color: var(--text-primary);
}

.info-box {
  background: var(--bg-hover);
  padding: 15px;
  border-radius: 12px;
  margin-top: 25px;
  font-size: 14px;
  color: var(--text-primary);
  border-left: 4px solid var(--color-primary);
}

@media (max-width: 600px) {
  .monthly-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}
</style>