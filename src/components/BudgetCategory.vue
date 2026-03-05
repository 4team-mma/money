<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import api from "@/api";
import { useCategoryStore } from "@/stores/useCategoryStore";

const props = defineProps({
  // 傳入當前的類別預算列表
  modelValue: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "refresh"]);

const categoryStore = useCategoryStore();

// --- 新增類別相關狀態 ---
const showAddCategory = ref(false);
const newCategoryName = ref("");
const selectedIcon = ref("🍔");
const iconOptions = [
    '🍔', '🚗', '🏠', '🎮', '💡', '💊', '📚', '✈️', '🚆', '🎬', '🎁',
    '🎨', '🎵', '🏃', '🛍️', '🏖️', '🍕', '🍩', '☕', '🥗', '🍎'
];

/**
 * 根據達成率回傳對應的 CSS 變數顏色
 */
const getSavingsColor = (current, target) => {
  if (!target || target <= 0) return "var(--text-secondary)";
  const percentage = (current / target) * 100;
  if (percentage < 30) return "var(--color-success)"; // 成功綠
  if (percentage >= 80) return "var(--color-danger)"; // 危險紅
  return "var(--color-primary)"; // 品牌藍
};

/**
 * 新增自定義類別邏輯
 */
const handleAddCategory = () => {
  const name = newCategoryName.value.trim();
  if (!name) return;
  if (name.length > 15) {
    ElMessage.warning("名稱請控制在 15 字以內");
    return;
  }

  const newItem = {
    id: Date.now(),
    itemName: name,
    icon: selectedIcon.value,
  };

  // 1. 同步到全域 Pinia Store
  categoryStore.addCustomCategory(newItem);

  // 2. 即時更新父組件的列表數據
  const newList = [...props.modelValue];
  newList.push({
    name: newItem.itemName,
    icon: newItem.icon,
    spent: 0,
    limit: 0,
  });
  emit("update:modelValue", newList);

  // 3. 重置狀態
  newCategoryName.value = "";
  showAddCategory.value = false;
  ElMessage.success(`已新增類別：${name}，別忘了設定預算喔！`);
};

/**
 * 刪除類別邏輯
 */
const removeCategory = async (catName) => {
  const isConfirmed = confirm(
    `確定要刪除「${catName}」預算類別嗎？這也會移除該類別的預算設定。`,
  );
  if (!isConfirmed) return;

  try {
    // 1. 呼叫後端 API
    await api.delete("/planning/budgets/category", {
      params: { category: catName },
    });
    // 2. 從 Store 移除
    categoryStore.removeCustomCategory(catName);
    // 3. 通知父組件重新整理資料
    emit("refresh");
    ElMessage.success(`已移除類別：${catName}`);
  } catch (error) {
    ElMessage.error("刪除失敗");
  }
};
</script>

<template>
  <section>
    <div>
      <div v-for="cat in modelValue" :key="cat.name" class="category-item-card">
        <div class="cat-header">
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>

          <!-- 排除預設類別不顯示刪除按鈕 -->
          <button
            v-if="!['飲食', '交通', '居家', '娛樂'].includes(cat.name)"
            class="delete-btn-mini"
            @click="removeCategory(cat.name)"
          >
            ✕
          </button>
        </div>

        <div>
          <div class="progress-info">
            <span>本月已花費: ${{ cat.spent.toLocaleString() }}</span>
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
                  (cat.limit > 0 ? (cat.spent / cat.limit) * 100 : 0) + '%',
                backgroundColor: getSavingsColor(cat.spent, cat.limit),
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 自定義類別入口 -->
      <div>
        <button
          v-if="!showAddCategory"
          @click="showAddCategory = true"
          class="add-dash-btn"
        >
          <span>+ 新增自定義類別預算</span>
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
            <button class="save-btn" @click="handleAddCategory">確認</button>
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
</template>

<style scoped>
.category-item-card {
  background: var(--bg-input);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  position: relative;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.cat-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.cat-icon {
  font-size: 20px;
  margin-right: 12px;
}

.cat-name {
  font-weight: 700;
  flex-grow: 1;
  color: var(--text-primary);
}

.delete-btn-mini { 
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

.delete-btn-mini:hover {
  opacity: 1;
  transform: scale(1.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

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

.progress-bar-bg {
  background: var(--bg-hover);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-bar-fill {
  height: 100%;
  transition:
    width 0.8s ease,
    background-color 0.4s ease;
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

.limit-input-group { 
  display: flex; 
  align-items: center; 
  white-space: nowrap; 
  gap: 4px; 
}

.add-dash-btn { 
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

.quick-add-form {
  background: var(--bg-card);
  border: 1px solid var(--color-primary);
  padding: 20px;
  border-radius: 16px;
  box-shadow: var(--shadow-card);
}

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

.save-btn { 
  background: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
} 
 
.cancel-btn {
  background: transparent;
  color: var(--text-secondary);
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.9rem;
}
</style>