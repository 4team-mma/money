<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import api from "@/api";
import { useCategoryStore } from "@/stores/useCategoryStore";

const props = defineProps({
  // 傳入當前的標籤預算列表 (tagBudgets)
  modelValue: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "refresh"]);

const categoryStore = useCategoryStore();

// --- 新增標籤相關狀態 ---
const showAddTag = ref(false);
const newTagName = ref("");
const selectedTagColor = ref("#3b82f6"); // 預設藍色
const colorOptions = ['#004B97', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * 根據達成率回傳對應的 CSS 變數顏色
 */
const getSavingsColor = (current, target) => {
  if (!target || target <= 0) return "var(--text-secondary)";
  const percentage = (current / target) * 100;
  if (percentage < 30) return "var(--color-success)";
  if (percentage >= 80) return "var(--color-danger)";
  return "var(--color-primary)";
};

/**
 * 新增自定義標籤邏輯
 */
const handleAddTag = () => {
  const name = newTagName.value.trim();
  if (!name) return;
  if (name.length > 10) {
    ElMessage.warning("標籤名稱請在 10 字以內");
    return;
  }

  const newTagItem = {
    id: Date.now(),
    itemName: name,
    color: selectedTagColor.value,
  };

  // 1. 同步到全域 Pinia Store (持久化儲存)
  categoryStore.addCustomTag(newTagItem);

  // 2. 即時更新父組件列表數據
  const newList = [...props.modelValue];
  newList.push({
    name: newTagItem.itemName,
    color: newTagItem.color,
    desc: "自定義心理帳戶",
    spent: 0,
    limit: 0,
  });
  emit("update:modelValue", newList);

  // 3. 重置輸入框
  newTagName.value = "";
  showAddTag.value = false;
  ElMessage.success(`已新增標籤：${name}`);
};

/**
 * 刪除標籤邏輯
 */
const removeTag = async (tagName) => {
  // 1. 阻擋刪除系統預設標籤
  const defaultNames = ["需要", "想要", "旅遊"];
  if (defaultNames.includes(tagName)) {
    ElMessage.warning("系統預設標籤無法刪除");
    return;
  }

  const isConfirmed = confirm(
    `確定要刪除「${tagName}」標籤嗎？這將移除此標籤的預算設定。`,
  );
  if (!isConfirmed) return;

  try {
    // 2. 同步刪除資料庫紀錄
    await api.delete("/planning/budgets/tag", {
      params: { tag: tagName },
    });
    // 3. 從 Store 與父組件清單移除
    categoryStore.removeCustomTag(tagName);
    emit("refresh");
    ElMessage.success(`已移除標籤：${tagName}`);
  } catch (error) {
    console.error("刪除標籤失敗:", error);
    ElMessage.error("刪除失敗，請稍後再試");
  }
};
</script>

<template>
  <section>
    <div class="tag-grid">
      <!-- 標籤卡片 -->
      <div v-for="tag in modelValue" :key="tag.name" class="tag-card">
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
            <span>本月已花費: ${{ tag.spent.toLocaleString() }}</span>
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
                  (tag.limit > 0 ? (tag.spent / tag.limit) * 100 : 0) + '%',
                backgroundColor: getSavingsColor(tag.spent, tag.limit),
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
          <span>+ 新增自定義標籤預算</span>
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
            <button class="save-btn" @click="handleAddTag">確認</button>
            <button class="cancel-btn" @click="showAddTag = false">取消</button>
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
</template>

<style scoped>
.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.tag-card {
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

.tag-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card);
}

.tag-color-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.tag-delete-btn {
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
  transition:
    opacity 0.2s,
    transform 0.2s;
  font-size: 10px;
}

.tag-delete-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.tag-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 15px 0 10px;
  font-size: 14px;
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

/* 顏色選擇器樣式 */
.color-picker-mini {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.color-picker-mini span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
}
.color-picker-mini span.active {
  border-color: var(--text-primary);
  transform: scale(1.2);
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--bg-body);
  box-shadow: 0 0 0 1px var(--border-color);
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

.add-tag-inline {
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
</style>