<script setup>
import { onMounted, computed, ref } from 'vue';
import Nav from "@/components/Nav.vue";
import { useNotificationStore } from '@/stores/notification';
import { getLocalDate } from '@/utils/dateHelper'

// 💡 1. 取得 Pinia Store 實例
const noticeStore = useNotificationStore();

// 💡 2. 讓本地的 notifications 直接同步 Store 裡的 activeList
// 使用 computed 確保當 Store 資料更新時，畫面會自動重繪
const notifications = computed(() => noticeStore.activeList);

// 💡 3. 組件掛載時，叫 Store 去後端抓最新通知
onMounted(() => {
  // 每分鐘檢查一次 Store，觸發 computed 重新計算
  setInterval(() => {
    // 這裡不需要發 API，只要讓 activeList 重新判定時間即可
    // 如果你發現時間到了 activeList 沒變，可以考慮在 store 裡加一個 currentTime ref
  }, 60000) 
});

// 💡 4. 點擊標記已讀：直接呼叫 Store 封裝好的 action
const markAsRead = async (id) => {
  try {
    // 這裡會觸發後端 PATCH /api/notifications/{id}/read
    // 並自動更新 Store 裡的 unreadCount 與 is_read 狀態
    await noticeStore.markAsRead(id);
  } catch (e) {
    console.error("標記已讀失敗:", e);
  }
};

// 💡 5. 根據通知類型返回樣式 (圖示、顏色、標籤)
const getCategoryStyle = (category) => {
  const styles = {
    budget: { icon: '⚠️', color: '#f59e0b', label: '預算' },
    savings: { icon: '🎯', color: '#10b981', label: '儲蓄' },
    manual: { icon: '⏰', color: '#3b82f6', label: '提醒' }
  };
  return styles[category] || { icon: '🔔', color: '#6b7280', label: '通知' };
};

const deleteNotification = async (id) => {
  if (confirm('確定要刪除這則通知嗎？')) {
    await noticeStore.deleteReminder(id)
  }
};

const handleClearAll = async () => {
  if (confirm('確定要清空目前所有通知嗎？（未來的預約提醒將會保留）')) {
    await noticeStore.deleteAll();
  }
};

const showAddModal = ref(false);

const newForm = ref({
  reminder_title: '',
  reminder_date_start: getLocalDate(), // 格式化為 YYYY-MM-DD
  reminder_time: '10:00',
  description: ''
});

const submitAdd = async () => {
  if (!newForm.value.reminder_title) {
    alert('請輸入提醒標題');
    return;
  }
  
  const success = await noticeStore.addManual(newForm.value);
  if (success) {
    showAddModal.value = false;
    // 重置表單
    newForm.value = {
      reminder_title: '',
      reminder_date_start: getLocalDate(),
      reminder_time: '10:00',
      description: ''
    };
  }
};
</script>

<template>
    <div class="notifications-container">
      <header class="page-header">
        <div class="header-title">
          <h1>通知中心</h1>
          <p>掌握您的財務預警與目標進度</p>
        </div>
        <div class="header-actions">
          <button class="add-btn" @click="showAddModal = true">＋ 新增提醒</button>
          <button 
            v-if="noticeStore.unreadCount > 0" 
            class="read-all-btn" 
            @click="noticeStore.readAll"
          >
            全部標記已讀
          </button>
          <button class="clear-all" @click="handleClearAll">全部清空</button>
        </div>
      </header>

      <div class="notification-list">
        <TransitionGroup name="list">
          <div 
            v-for="item in noticeStore.activeList" 
            :key="item.reminder_id"
            class="notification-card"
            @click="markAsRead(item.reminder_id)"
          >
            <!-- 左側類型圖示 -->
            <div 
              class="card-icon" 
              :style="{ 
                backgroundColor: getCategoryStyle(item.category).color + '20', 
                color: getCategoryStyle(item.category).color 
              }"
            >
              {{ getCategoryStyle(item.category).icon }}
            </div>

            <!-- 中間文字內容 -->
            <div class="card-content">
              <div class="card-top">
                <span class="category-badge" :style="{ color: getCategoryStyle(item.category).color }">
                  {{ getCategoryStyle(item.category).label }}
                </span>
                <span class="time-stamp">
                  {{ item.reminder_date_start }} 
                  <!-- 防錯處理：避免 time 為 null 時 substring 報錯 -->
                  {{ item.reminder_time ? item.reminder_time.substring(0, 5) : '' }}
                </span>
              </div>
              <h3 class="title">{{ item.reminder_title }}</h3>
              <p class="desc">{{ item.description || '無詳細描述' }}</p>
            </div>

            <!-- 右側狀態與動作 -->
            <div class="card-actions">
              <!-- 未讀小紅點 -->
              <div v-if="!item.is_read" class="unread-dot"></div>
              <!-- 刪除按鈕 -->
              <button class="delete-btn" @click.stop="deleteNotification(item.reminder_id)">
                ✕
              </button>
            </div>
          </div>

          <!-- 空狀態顯示 -->
          <div v-if="notifications.length === 0" class="empty-state">
            <div class="empty-icon">🍃</div>
            <p>目前沒有任何通知</p>
            <p class="empty-hint">當您的支出接近預算或達成儲蓄目標時，這裡會提醒您。</p>
            <RouterLink to="/BudgetManager" class="go-budget-btn">去設定預算</RouterLink>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
      <div class="modal-card">
        <h3>⏰ 設定新提醒</h3>
        <div class="form-group">
          <label>標題</label>
          <input v-model="newForm.reminder_title" placeholder="例如：繳交房租" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>日期</label>
            <input type="date" v-model="newForm.reminder_date_start" />
          </div>
          <div class="form-group">
            <label>時間</label>
            <input type="time" v-model="newForm.reminder_time" />
          </div>
        </div>
        <div class="form-group">
          <label>備註 (選填)</label>
          <textarea v-model="newForm.description" placeholder="輸入詳細說明..."></textarea>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showAddModal = false">取消</button>
          <button class="confirm-btn" @click="submitAdd">確認新增</button>
        </div>
      </div>
    </div>
</template>

<style scoped>
/* 佈局容器 */
.notifications-container {
  max-width: 800px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

/* 標頭樣式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.header-title h1 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.header-title p {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.read-all-btn {
  background: var(--bg-hover);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;
  transition: 0.2s;
}

.read-all-btn:hover {
  background: var(--color-primary);
  color: white;
}

.clear-all {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: 0.2s;
}

.clear-all:hover {
  background: var(--bg-hover);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

/* 通知列表 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 通知卡片主體 */
.notification-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: var(--color-primary);
}

/* 未讀狀態樣式：左側加粗邊框 */
.notification-card.unread {
  border-left: 4px solid var(--color-primary);
  background: var(--bg-body);
}

/* 左側 Icon 容器 */
.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

/* 內容區 */
.card-content {
  flex: 1;
}

.card-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.category-badge {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-stamp {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.4rem;
}

.desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 右側操作區 */
.card-actions {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
}

.unread-dot {
  width: 10px;
  height: 10px;
  background: var(--color-primary);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--color-primary);
}

.delete-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  opacity: 0; /* 平時隱藏，Hover 時出現 */
  transition: 0.2s;
  font-size: 1.1rem;
}

.notification-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: var(--color-danger);
}

/* 空狀態樣式 */
.empty-state {
  text-align: center;
  padding: 5rem 0;
  color: var(--text-secondary);
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px dashed var(--border-color);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 10px 0 20px;
}

.go-budget-btn {
  display: inline-block;
  padding: 8px 20px;
  background: var(--color-primary);
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-size: 0.9rem;
  transition: 0.3s;
}

.go-budget-btn:hover {
  opacity: 0.9;
  transform: scale(1.05);
}

/* 列表動畫 */
.list-enter-active,
.list-leave-active {
  transition: all 0.4s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.add-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.3s;
}

.add-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px var(--color-primary);
}

/* 彈窗樣式 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: var(--bg-card);
  width: 90%;
  max-width: 450px;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid var(--border-color);
}

.form-group { margin-bottom: 1.2rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary); }
.form-group input, .form-group textarea {
  width: 100%;
  padding: 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-body);
  color: var(--text-primary);
}

.modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 1rem; }
.confirm-btn { background: var(--color-primary); color: white; border: none; padding: 0.6rem 1.5rem; border-radius: 8px; cursor: pointer; }
.cancel-btn { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); padding: 0.6rem 1.5rem; border-radius: 8px; cursor: pointer; }
</style>
