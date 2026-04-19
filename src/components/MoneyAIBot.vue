<script setup>
// ==========================================
// 1. 引用與基礎狀態 (Imports & Basic State)
// ==========================================
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import { getLocalDate } from '@/utils/dateHelper'
import { useAccountStore } from '@/stores/useAccountStore'
import { ElMessage } from 'element-plus'
import { useMeowChat } from '@/composables/aiCat/useMeowChat'

// 💡 引入剛剛拆分出來的小組件
import AiCatPaintCanvas from './aiCat/AiCatPaintCanvas.vue'
//import AiCatActionCard from './aiCat/AiCatActionCard.vue'
import AiCatInputArea from './aiCat/AiCatInputArea.vue'
import AiCatMessages from './aiCat/AiCatMessages.vue'

const route = useRoute()

// 2. 取得 UI 組件的 Ref
const messagesRef = ref(null)
const paintCanvasRef = ref(null)
const inputAreaRef = ref(null)
const accountStore = useAccountStore()
const catImg = new URL('@/assets/AI_cat.png', import.meta.url).href


// 3. 傳入 Ref 初始化大腦 🌟
const {
  isOpen,
  messages,
  isTyping,
  loadingText,
  selectedPersona,
  personasList,
  scrollToBottom,    // 解構出來，原本 template 裡的呼叫不用改
  clearChat,
  handleFeedback,
  handleChatRequest,
  checkAndGreet,
  showAdvisorMenu,
  showKnowledgeMenu

} = useMeowChat(paintCanvasRef, inputAreaRef, messagesRef)


const toggleOpen = (val) => {
  isOpen.value = val === undefined ? !isOpen.value : val;
}
const setPersona = (val) => {
  selectedPersona.value = val;
}

// ==========================================
// 🌟 Helper functions
// ==========================================


const getAccountId = (accountName) => {
  if (!accountName || typeof accountName !== 'string') return null;
  const found = accountStore.accounts.find(a => {
    const storeName = a.itemName || '';
    return storeName.includes(accountName) || accountName.includes(storeName);
  });
  return found ? found.account_id : null;
};

const getClassIcon = (className) => {
  const iconMap = { '飲食': '🍔', '交通': '🚗', '居家': '🏠', '娛樂': '🎮', '醫療': '💊', '學習': '📚', '帳單': '🧾', '其他': '📦' };
  return iconMap[className] || '📌';
};

// ==========================================
// 2-1. 互動功能 (Drag)
// ==========================================
const position = ref({ x: 92, y: 85 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })

const pixelPosition = computed(() => ({
  x: (position.value.x / 100) * window.innerWidth,
  y: (position.value.y / 100) * window.innerHeight
}))

// 2-1. 互動功能 (優化後的自由拖拽)
const startDrag = (e) => {
  isDragging.value = true;
  startPos.value = { x: e.clientX, y: e.clientY };
  dragOffset.value = {
    x: e.clientX - pixelPosition.value.x,
    y: e.clientY - pixelPosition.value.y
  };
  window.addEventListener('mousemove', onDragging);
  window.addEventListener('mouseup', stopDrag);
};

const onDragging = (e) => {
  if (!isDragging.value) return;
  let newX = e.clientX - dragOffset.value.x;
  let newY = e.clientY - dragOffset.value.y;

  // 🛡️ 邊界檢查：不讓喵喵跑出螢幕外
  // 360 是對話框寬度，我們預留空間確保展開時不被切到
  const padding = 20;
  const safeX = Math.max(padding, Math.min(newX, window.innerWidth - 90 - padding));
  const safeY = Math.max(padding, Math.min(newY, window.innerHeight - 90 - padding));

  position.value.x = (safeX / window.innerWidth) * 100;
  position.value.y = (safeY / window.innerHeight) * 100;
};

const stopDrag = (e) => {
  if (!isDragging.value) return;
  isDragging.value = false;
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('mouseup', stopDrag);

  const moveDistance = Math.sqrt(
    Math.pow(e.clientX - startPos.value.x, 2) +
    Math.pow(e.clientY - startPos.value.y, 2));

  if (moveDistance < 5) {
    toggleOpen(true);
  }

};

// ==========================================
// 2-2. 互動功能 ( WebSocket)
// ==========================================
let ws = null;
let wsRetryCount = 0;
const MAX_WS_RETRIES = 3;

const connectWebSocket = () => {
  const token = localStorage.getItem("user_token") || localStorage.getItem("token");
  if (!token) return;
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const wsUrl = apiBase === '/api'
    ? `ws://localhost:8000/api/ws/chat?token=${token}`
    : `${apiBase.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/chat?token=${token}`;

  ws = new WebSocket(wsUrl);
  ws.onopen = () => { wsRetryCount = 0; };
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'siri_sync') {
      isOpen.value = true;
      messages.value.push({ id: Date.now(), text: `📱 (Siri 語音) \n${data.user_query}`, sender: 'user', timestamp: new Date().toISOString() });
      messages.value.push({ id: Date.now() + 1, text: data.ai_reply, sender: 'bot', timestamp: new Date().toISOString(), duration: data.duration });
      scrollToBottom();
      accountStore.loadAccounts(true);
    }
  };
  ws.onclose = () => {
    if (wsRetryCount < MAX_WS_RETRIES) {
      wsRetryCount++;
      setTimeout(connectWebSocket, 3000);
    } else {
      messages.value.push({ id: Date.now(), text: "喵... 連線一直失敗，可能是登入憑證過期了。請小主人「重新整理網頁」或「重新登入」試試看喵！", sender: 'bot', timestamp: new Date().toISOString() });
      scrollToBottom();
      ElMessage.error('連線中斷，請重新登入！');
    }
  };
};

// ==========================================
// 3. AI 對話邏輯
// ==========================================


const sendQuickMessage = async (replyData, msgId) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (msg) msg.quick_replies = null; // 點擊後隱藏選單
  
  // 💡 判斷傳進來的是物件還是純字串
  const finalQuery = typeof replyData === 'object' ? replyData.query : replyData;
  const displayText = typeof replyData === 'object' ? replyData.text : replyData;

  // 這樣藍色氣泡就會顯示短短的「📊 財務總覽健檢」，但後端會收到長長的「請幫我進行整體的財務健檢...」
  await handleChatRequest({ query: finalQuery, displayText: displayText, wasSpoken: false });
};


// ==========================================
// 4. 卡片操作邏輯 (子組件 emit 出來時觸發)
// ==========================================
const handleConfirmRecord = async (msgId, index, actionItem) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (!msg) return;
  try {
    const todayStr = getLocalDate();
    if (accountStore.accounts.length === 0) await accountStore.loadAccounts(true);
    const firstAccount = accountStore.accounts[0];
    const finalDate = actionItem.record_date || todayStr;

    if (actionItem.record_type === 'transfer') {
      const payload = {
        transaction_date: finalDate,
        from_account_id: getAccountId(actionItem.from_account) || firstAccount.account_id,
        to_account_id: getAccountId(actionItem.to_account) || (accountStore.accounts[1]?.account_id || firstAccount.account_id),
        transaction_note: actionItem.add_note || 'AI轉帳',
        amount: parseFloat(actionItem.add_amount || actionItem.amount || 0)
      };
      await api.post('/transfers/', payload);
    } else {
      const isIncome = actionItem.record_type === 'income' || actionItem.add_type === true;
      const payload = {
        add_date: finalDate, add_amount: parseFloat(actionItem.add_amount || actionItem.amount || 0),
        add_type: isIncome, add_class: actionItem.add_class || '其他', add_class_icon: getClassIcon(actionItem.add_class),
        account_id: getAccountId(actionItem.account_name) || firstAccount.account_id,
        add_member: actionItem.add_member || '自己', add_tag: actionItem.add_tag || '需要', add_note: actionItem.add_note || 'AI記帳'
      };
      await api.post('/records/', payload);
    }

    msg.action_data.splice(index, 1);
    if (msg.action_data.length === 0) {
      msg.is_command = false;
      msg.text = `✅ 喵！已經幫小主人記好囉！`;
    }
    setTimeout(() => window.dispatchEvent(new CustomEvent('sync-money-data')), 500);
  } catch (error) {
    alert(`⚠️ 記錄失敗：${error.message}`);
  }
};

const handleCancelRecord = (msgId, index) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (!msg) return;
  msg.action_data.splice(index, 1);
  if (msg.action_data.length === 0) {
    msg.is_command = false;
    msg.text = `❌ 喵～已經取消操作囉！`;
  }
};

// ==========================================
// 5. 生命週期與視窗追蹤
// ==========================================
const chatWindowStyle = computed(() => {
  const isInRightHalf = position.value.x > 50;
  const catX = pixelPosition.value.x;
  const catY = pixelPosition.value.y;
  const windowHeight = window.innerHeight;
  const chatHeight = 520;

  const style = { position: 'fixed', zIndex: 10000, width: '360px' };

  if (isInRightHalf) {
    style.right = `${window.innerWidth - catX + 10}px`;
    style.left = 'auto'; style.transformOrigin = 'right center';
  } else {
    style.left = `${catX + 100}px`;
    style.right = 'auto'; style.transformOrigin = 'left center';
  }

  let topPosition = catY + 45;
  if (topPosition - (chatHeight / 2) < 20) topPosition = (chatHeight / 2) + 20;
  else if (topPosition + (chatHeight / 2) > windowHeight - 20) topPosition = windowHeight - (chatHeight / 2) - 20;

  style.top = `${topPosition}px`;
  style.transform = `translateY(-50%)`;
  return style;
});

onMounted(async () => {
  await accountStore.loadAccounts();
  if (isOpen.value) {
    checkAndGreet(route.path);  // ✅ 不用傳 map
  }

  window.addEventListener('resize', () => {
    position.value.x = Math.min(Math.max(2, position.value.x), 88)
    position.value.y = Math.min(Math.max(2, position.value.y), 88)
    if (position.value.x > 50) position.value.x = 88; else position.value.x = 2;
  })
  connectWebSocket();
});

onUnmounted(() => {
  if (ws) { ws.onclose = null; ws.close(); }
});


watch(
  () => route.path,
  (newPath) => {
    if (isOpen.value) {
      checkAndGreet(newPath);  // ✅
    }
  }
);

</script>

<template>
  <div class="money-ai-bot" :style="{ left: pixelPosition.x + 'px', top: pixelPosition.y + 'px' }">
    <Teleport to="body">
      <button v-if="!isOpen" class="bot-toggle-transparent"
        :style="{ left: pixelPosition.x + 'px', top: pixelPosition.y + 'px', position: 'fixed', zIndex: 2147483647 }"
        @mousedown="startDrag">
        <img :src="catImg" class="floating-cat" alt="cat" draggable="false" />
        <div class="stars-container">
          <span class="star s1">✦</span>
          <span class="star s3">✨</span>
        </div>
      </button>
    </Teleport>

    <Teleport to="body">
      <AiCatPaintCanvas ref="paintCanvasRef" :isTyping="isTyping" />
    </Teleport>

    <Teleport to="body">
      <Transition>
        <div v-if="isOpen" class="chat-window-custom" @mousedown.stop :style="chatWindowStyle">
          <div class="chat-header-custom" @mousedown="startDrag" style="cursor: move;">
            <div class="header-left">
              <div class="avatar-container-header">
                <img :src="catImg" class="header-icon" draggable="false" />
              </div>
              <div class="bot-status">
                <span class="name">Money 喵喵小助手</span>
                <span class="status">{{ isTyping ? '正在動腦...' : '隨時為您服務' }}</span>
              </div>
            </div>
            <div class="header-actions">

              <select :model-value="selectedPersona" @update:modelValue="setPersona" class="persona-select"
                title="切換喵喵性格">
                <option v-for="p in personasList" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </select>
              <button class="clear-btn" @click="clearChat" title="清空對話">🗑️</button>
              <button class="close-x" @click="toggleOpen(false)">✕</button>
            </div>
          </div>

          <AiCatMessages ref="messagesRef" :messages="messages" :isTyping="isTyping" :loadingText="loadingText"
            :catImg="catImg" @quick-reply="sendQuickMessage" @confirm-record="handleConfirmRecord"
            @cancel-record="handleCancelRecord" @feedback="handleFeedback" />

          <div class="bottom-menu-bar">
            <button class="menu-btn" @click="showAdvisorMenu">💡 專家建議</button>
            <button class="menu-btn" @click="showKnowledgeMenu">📖 本站知識</button>
          </div>

          <AiCatInputArea ref="inputAreaRef" :isTyping="isTyping" @send-message="handleChatRequest" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
@import "../assets/css/ai_painting.css";

/* 🎯 恢復您最愛的 Win11 原始樣式 */
.money-ai-bot {
  position: fixed;
  z-index: 9999;
  width: 90px;
  height: 90px;
  /* 禁止選取文字，避免拖曳時選到一堆藍字 */
  /* user-select: none; */
  overflow: visible !important;
}

.bot-toggle-transparent {
  background: transparent !important;
  border: none !important;
  cursor: grab;
  /* 抓取手勢 */
  padding: 0;
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  pointer-events: auto;
}

.floating-cat {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
}

.bot-toggle-transparent:active {
  cursor: grabbing;
}

.bot-toggle-transparent:hover .floating-cat {
  transform: scale(1.1) translateY(-5px);
}

.stars-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.star {
  position: absolute;
  color: #ffca28;
  text-shadow: 0 0 5px rgba(255, 202, 40, 0.5);
  animation: blink 1.5s infinite alternate;
}

.s1 {
  top: 20%;
  right: 5%;
  font-size: 0.9rem;
}

.s3 {
  top: 35%;
  right: 18%;
  font-size: 0.7rem;
  animation-delay: 0.8s;
}

@keyframes blink {
  0% {
    opacity: 0.4;
    transform: scale(0.9);
  }

  100% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 視窗彈出動畫 */
.v-enter-active,
.v-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  /* 帶點 Q 彈感 */
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  transform: scale(0.5);
  /* 從一半大小開始彈出 */
}

/* 對話窗與頭像防變形處理 */
.chat-window-custom {
  position: fixed;
  /* 相對於 .money-ai-bot 定位 */
  max-width: 90vw;
  width: 360px;
  height: 520px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  z-index: 10000;
  pointer-events: auto;
}

.chat-header-custom {
  padding: 12px 16px;
  background: #f8faff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.avatar-container-header {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.header-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.bot-status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 8px;
}

/* 新增 */
.name {
  font-weight: bold;
  font-size: 0.95rem;
  color: #333;
}

/* 新增 */
.status {
  font-size: 0.75rem;
  color: #888;
}

/* 新增 */

.header-left {
  display: flex;
  align-items: center;
}

/* 新增 */

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.clear-btn:hover {
  opacity: 1;
}

.close-x {
  background: #eee;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
}

.money-ai-bot {
  position: fixed;
  z-index: 2147483647;
  /* 這是瀏覽器能允許的最大數字，絕對不會被蓋住 */
}

.chat-window-custom {
  z-index: 2147483647;
}

.duration {
  font-size: 9px;
  color: #9ca3af;
  margin-left: 4px;
}


/* 新增 */

.input-area {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-top: 1px solid #f0f0f0;
}

.input-area input {
  flex: 1;
  border: 1px solid #ddd;
  padding: 8px 12px;
  border-radius: 10px;
  outline: none;
}

.send-btn {
  background: #3b82f6;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  color: white;
  cursor: pointer;
}


.chat-window-custom {
  max-height: 80vh;
  /* 限制最高不超過螢幕 80% */
  overflow-y: auto;
  /* 內容過長時顯示捲軸 */
}

/* 🌟 下拉選單樣式 */
.persona-select {
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background-color: #f8fafc;
  color: #475569;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

.persona-select:hover {
  border-color: #cbd5e1;
  background-color: #fff;
}

/* 🚀 AI 帳戶下拉選單樣式 */
.ai-select {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 0.9rem;
  color: var(--text-primary);
  background-color: var(--bg-card);
  outline: none;
  cursor: pointer;
  flex: 1;
  /* 讓它填滿剩餘空間 */
  max-width: 140px;
  /* 避免選單太長破壞版面 */
}

.ai-select:focus {
  border-color: var(--color-primary);
}





/* 🌟 麥克風按鈕專屬樣式 */
.mic-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  margin-right: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mic-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.mic-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 錄音時的紅色呼吸燈特效 */
.mic-btn.is-recording {
  animation: pulse-red 1.5s infinite;
  background: rgba(239, 68, 68, 0.1);
}

@keyframes pulse-red {
  0% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }

  70% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
  }
}

/* --- 🌟 底部主功能選單列 --- */
.bottom-menu-bar {
  display: flex;
  gap: 10px;
  padding: 8px 15px;
  background-color: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.menu-btn {
  flex: 1;
  /* 平分寬度 */
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 0;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.menu-btn:hover {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}
</style>