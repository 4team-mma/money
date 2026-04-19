<script setup>
// ==========================================
// 1. 引用與基礎狀態 (Imports & Basic State)
// ==========================================
import { ref, nextTick, watch, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api'
import { getLocalDate } from '@/utils/dateHelper'
import { postAiRobotChat, postAiFeedback } from '@/api/robot'
import { useAccountStore } from '@/stores/useAccountStore'
import { ElMessage } from 'element-plus'
import { processSpeechCorrection } from '@/api/speech'

// 💡 引入剛剛拆分出來的小組件
import AiCatPaintCanvas from './aiCat/AiCatPaintCanvas.vue'
//import AiCatActionCard from './aiCat/AiCatActionCard.vue'
import AiCatInputArea from './aiCat/AiCatInputArea.vue'
import AiCatMessages from './aiCat/AiCatMessages.vue'

const route = useRoute()
const messagesRef = ref(null)
const paintCanvasRef = ref(null)
const inputAreaRef = ref(null)
const accountStore = useAccountStore()
const catImg = new URL('@/assets/AI_cat.png', import.meta.url).href

// ==========================================
// 🌟 Helper functions
// ==========================================
const greetingsMap = {
  '/': '嗨！我是 喵喵小助手 💰',
  '/admins': '歡迎來到控制中心喵！',
  '/user': '小主人歡迎回來，今天想記點什麼喵？'
};

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

const formatTime = (isoStr) => new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

const formatDuration = (seconds) => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
}

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
    isOpen.value = true;
    return;
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
const isOpen = ref(localStorage.getItem('isMeowChatOpen') === 'true')
const messages = ref(JSON.parse(localStorage.getItem('meowChatHistory')) || [{
  id: 1, text: '嗨！我是 喵喵小助手 💰', sender: 'bot', timestamp: new Date().toISOString()
}])
const isTyping = ref(false)
const loadingText = ref('思考中喵...')
let loadingInterval = null
const selectedPersona = ref(localStorage.getItem('meowPersona') || 'cute')
const waitingJokes = ["喵喵正在翻閱帳本... 📖", "正在計算罐罐的匯率... 🐟", "數據量大，喵喵努力消化中... 🐾"]

const personasList = [
  { value: 'cute', label: '😽 可愛喵喵' }, { value: 'gentle', label: '🐈 溫柔管家喵' },
  { value: 'professional', label: '🦁 嚴肅顧問' }, { value: 'tsundere', label: '😼 傲嬌喵' },
  { value: 'lazy', label: '😿 厭世喵' }, { value: 'rich', label: '💰 土豪喵' }
];

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollToBottom()
  })
}

const checkAndGreet = () => {
  const customText = greetingsMap[route.path]
  if (customText && !messages.value.some(m => m.text === customText)) {
    messages.value.push({ id: Date.now(), text: customText, sender: 'bot', timestamp: new Date().toISOString(), duration: null })
    scrollToBottom()
  }
}

// 🧹 清空紀錄
const clearChat = () => {
  if (confirm('喵？確定要清空嗎？')) {
    messages.value = [{ id: Date.now(), text: '紀錄已清空喵！', sender: 'bot', timestamp: new Date().toISOString() }];
    setTimeout(() => {
      messages.value = [{ id: Date.now(), text: '嗨！我是 喵喵小助手 💰 有什麼能幫你的嗎喵？', sender: 'bot', timestamp: new Date().toISOString() }];
    }, 3000);
  }
};

// 💡 選單按鈕功能
const showAdvisorMenu = () => {
  messages.value.push({
    id: Date.now(), text: '喵！請選擇你想進行的財務分析：', sender: 'bot', timestamp: new Date().toISOString(),
    quick_replies: ['📈 幫我查一下最近物價是不是變貴了？', '💼 請幫我比對目前的薪資競爭力']
  });
  scrollToBottom();
};

const showKnowledgeMenu = () => {
  messages.value.push({
    id: Date.now(), text: '想了解什麼理財知識呢喵？可以直接點擊，或輸入你想問的名詞：', sender: 'bot', timestamp: new Date().toISOString(),
    quick_replies: ['📖 什麼是 CPI (消費者物價指數)？', '🏦 ETF 是什麼？新手適合買嗎？', '💰 什麼是 50/30/20 理財法則？']
  });
  scrollToBottom();
};

const sendQuickMessage = async (text, msgId) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (msg) msg.quick_replies = null; // 點擊後隱藏按鈕
  await handleChatRequest({ query: text, wasSpoken: false });
};

const handleFeedback = async (message, isGood) => {
  message.feedbackGiven = true;
  if (!isGood) {
    try {
      const msgIndex = messages.value.findIndex(m => m.id === message.id);
      const userMsg = msgIndex > 0 ? messages.value[msgIndex - 1].text : '未知問題';
      await postAiFeedback({
        user_message: userMsg, llm_response: message.text,
        predicted_intent: message.intent || 'UNKNOWN', confidence_score: message.confidence || 0.0
      });
      ElMessage.success('收到倒讚！已將這筆對話送交後台審核 📝');
    } catch (error) {
      ElMessage.error('糟糕，反饋傳送失敗了喵...');
    }
  } else {
    ElMessage.success('謝謝小主人的稱讚喵！🥰');
  }
};

// 🚀 核心發送邏輯 (改由 AiCatInputArea 觸發)
const handleChatRequest = async ({ query, wasSpoken }) => {
  if (isTyping.value) return;
  const now = new Date();
  const exactTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const userMsgId = Date.now();
  messages.value.push({ id: userMsgId, text: query, sender: 'user', timestamp: new Date().toISOString() });

  // 清空噴漆畫布
  if (paintCanvasRef.value) paintCanvasRef.value.clearCanvas();
  isTyping.value = true;
  scrollToBottom();

  loadingInterval = setInterval(() => { loadingText.value = waitingJokes[Math.floor(Math.random() * waitingJokes.length)]; }, 1500);

  let finalQuery = query;
  if (wasSpoken) {
    loadingText.value = "啟動 RTX 4060 Ti 糾錯中喵... 🐾";
    try {
      const correctRes = await processSpeechCorrection(query);
      const responseData = correctRes?.data || correctRes;
      if (responseData && responseData.corrected_text && responseData.corrected_text !== query) {
        finalQuery = responseData.corrected_text;
        const msgIndex = messages.value.findIndex(m => m.id === userMsgId);
        if (msgIndex !== -1) messages.value[msgIndex].text = `🎤 原始：${query}\n✨ 修正：${finalQuery}`;
      }
    } catch (err) {
      console.warn("⚠️ GPU 糾錯引擎未開啟或連線失敗", err);
    } finally {
      loadingText.value = waitingJokes[0];
    }
  }

  try {
    const historyText = messages.value.slice(-5, -1).map(m => `${m.sender === 'user' ? '小主人' : '喵喵'}：${m.text.substring(0, 30)}`).join('\n');
    const finalPrompt = `[台北時間 ${exactTime}]\n${historyText}\n小主人：${finalQuery}`;

    const rawRes = await postAiRobotChat({ message: finalPrompt, persona: selectedPersona.value });

    // ✅ 真正安全且相容你後端架構的寫法：找回被拔掉的 .data
    // 如果後端有包裝 { data: { reply: "..." } } 就解開它，否則用原物件
    const response = rawRes?.data || rawRes || {};

    // ✅ 防炸：如果連最基本的回覆都沒有，印出真兇並丟給 catch 處理
    if (!response.reply) {
      console.error("🔍 [Debug] 後端實際回傳的內容是:", rawRes);
      throw new Error("AI 回傳格式錯誤或為空");
    }

    // ✅ 正規化 action_data (確保一定會是陣列或 null)
    let actionData = null;
    if (Array.isArray(response.action_data)) {
      actionData = response.action_data;
    } else if (response.action_data) {
      actionData = [response.action_data];
    }

    // 確保帳戶資料同步
    if (response.is_command && accountStore.accounts.length === 0) {
      await accountStore.loadAccounts(true);
    }

    // AI 回覆的那段
    messages.value.push({
      id: Date.now() + 1,
      text: response.reply,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      duration: response.duration,
      provider: response.provider,
      is_command: response.is_command,
      action_data: actionData,
      intent: response.intent,
      confidence: response.confidence
    });
  } catch (error) {
    // 🛡️ 只要上面 throw Error，就會優雅地滑進這裡！
    console.error("❌ 聊天大腦發生錯誤：", error);
    messages.value.push({
      id: Date.now() + 1,
      text: "喵... 我斷線了喵！請檢查後端終端機或 Ollama 狀態！",
      sender: 'bot',
      timestamp: new Date().toISOString()
    });
  } finally {
    isTyping.value = false;
    if (loadingInterval) clearInterval(loadingInterval);
    scrollToBottom();
    await nextTick();
    if (inputAreaRef.value) inputAreaRef.value.focusInput();
  }
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
  if (isOpen.value) checkAndGreet();
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

watch(isOpen, (newVal) => localStorage.setItem('isMeowChatOpen', newVal));
watch(messages, (newVal) => localStorage.setItem('meowChatHistory', JSON.stringify(newVal)), { deep: true });
watch(() => route.path, () => { if (isOpen.value) checkAndGreet() });
watch(selectedPersona, (newVal) => localStorage.setItem('meowPersona', newVal));
</script>

<template>



  <div class="money-ai-bot" :style="{ left: pixelPosition.x + 'px', top: pixelPosition.y + 'px' }">

    <button v-if="!isOpen" class="bot-toggle-transparent" @mousedown="startDrag">
      <img :src="catImg" class="floating-cat" alt="cat" draggable="false" />
      <div class="stars-container">
        <span class="star s1">✦</span>
        <span class="star s3">✨</span>
      </div>
    </button>

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

              <select v-model="selectedPersona" class="persona-select" title="切換喵喵性格">
                <option v-for="p in personasList" :key="p.value" :value="p.value">
                  {{ p.label }}
                </option>
              </select>
              <button class="clear-btn" @click="clearChat" title="清空對話">🗑️</button>
              <button class="close-x" @click="isOpen = false">✕</button>
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


/* ==========================================
   🆕 新增：記帳確認卡片樣式
   ========================================== */
.action-card {
  margin-top: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  /* 防止卡片太寬撐破對話框 */
  width: 100%;
  min-width: 200px;
}

.card-header {
  background: #f8fafc;
  padding: 8px 12px;
  font-weight: bold;
  font-size: 0.85rem;
  color: #475569;
  border-bottom: 1px solid #e2e8f0;
}

.card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.data-row .label {
  color: #64748b;
}

.data-row .value {
  font-weight: bold;
  color: #1e293b;
}

.data-row .amount {
  color: #ef4444;
  /* 紅色強調金額 */
  font-size: 1.1rem;
}

.card-footer {
  display: flex;
  border-top: 1px solid #e2e8f0;
}

.card-footer .btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}

.card-footer .btn.cancel {
  color: #64748b;
  border-right: 1px solid #e2e8f0;
}

.card-footer .btn.cancel:hover {
  background: #f1f5f9;
}

.card-footer .btn.confirm {
  color: #3b82f6;
  /* 藍色確認鈕 */
}

.card-footer .btn.confirm:hover {
  background: #eff6ff;
}

.tag-text {
  font-size: 0.8rem;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
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