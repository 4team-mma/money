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
const route = useRoute()
const messagesContainer = ref(null)
const inputRef = ref(null)
const accountStore = useAccountStore()


// 🌟 帳戶與 Icon 處理
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

// 🌟 格式化工具
const formatTime = (isoStr) => isoStr ? new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '';
const formatDuration = (seconds) => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return `${mins}m ${secs}s`;
};
const scrollToBottom = () => {
  nextTick(() => { if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight });
};
// ==========================================
// 2. 互動功能 (Drag, Paint Game & WebSocket)
// ==========================================
const position = ref({ x: window.innerWidth - 120, y: window.innerHeight - 120 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })

const startDrag = (e) => {
  isDragging.value = true
  startPos.value = { x: e.clientX, y: e.clientY }
  dragOffset.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
  window.addEventListener('mousemove', onDragging);
  window.addEventListener('mouseup', stopDrag);
}
const onDragging = (e) => {
  if (!isDragging.value) return
  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y
  const maxX = window.innerWidth - 100
  const maxY = window.innerHeight - 100
  position.value.x = Math.max(10, Math.min(newX, maxX))
  position.value.y = Math.max(10, Math.min(newY, maxY))
}
const stopDrag = (e) => {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('mouseup', stopDrag);
  const moveDistance = Math.sqrt(Math.pow(e.clientX - startPos.value.x, 2) + Math.pow(e.clientY - startPos.value.y, 2));
  if (moveDistance < 5) isOpen.value = true;
}

// 🎨 噴漆畫圖功能
const paintDrops = ref([]);
const isDrawing = ref(false);
const startDrawing = (e) => { isDrawing.value = true; sprayPaint(e, false); };
const draw = (e) => { if (isDrawing.value) sprayPaint(e, true); };
const stopDrawing = () => { isDrawing.value = false; };
const sprayPaint = (e, isDraggingFlag) => {
  if (paintDrops.value.length > 300) paintDrops.value.shift();
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', '#FF8ED4'];
  const size = isDraggingFlag ? (Math.random() * 15 + 10) : (Math.random() * 50 + 30);
  paintDrops.value.push({
    id: Date.now() + Math.random(),
    style: {
      left: `${e.clientX - size / 2}px`, top: `${e.clientY - size / 2}px`,
      width: `${size}px`, height: `${size}px`, backgroundColor: colors[Math.floor(Math.random() * colors.length)],
      borderRadius: '50%', position: 'fixed', pointerEvents: 'none', zIndex: 9999, transform: `rotate(${Math.random() * 360}deg)`
    }
  });
};

// 🔗 WebSocket 連線
let ws = null;
const connectWebSocket = () => {
  const token = localStorage.getItem("user_token") || localStorage.getItem("token");
  if (!token) return;
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const wsUrl = apiBase === '/api'
    ? `ws://localhost:8000/api/ws/chat?token=${token}`
    : `${apiBase.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/chat?token=${token}`;
  ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'siri_sync') {
      isOpen.value = true;
      messages.value.push({
        id: Date.now(),
        text: `📱 (Siri 語音) \n${data.user_query}`,
        sender: 'user',
        timestamp: new Date().toISOString()
      });
      messages.value.push({
        id: Date.now() + 1,
        text: data.ai_reply,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        duration: data.duration
      });
      scrollToBottom();
      accountStore.loadAccounts(true);
    }
  };
  ws.onclose = () => setTimeout(connectWebSocket, 3000);
};
// ==========================================
// 3. AI 對話邏輯 (Chat & AI Response)
// ==========================================
const isOpen = ref(localStorage.getItem('isMeowChatOpen') === 'true')
const messages = ref(JSON.parse(localStorage.getItem('meowChatHistory')) || [{
  id: 1, text: '嗨！我是 喵喵小助手 💰', sender: 'bot', timestamp: new Date().toISOString()
}])
const input = ref('')
const isTyping = ref(false)
const loadingText = ref('思考中喵...')
let loadingInterval = null
const catImg = new URL('@/assets/AI_cat.png', import.meta.url).href
const selectedPersona = ref(localStorage.getItem('meowPersona') || 'cute');
const waitingJokes = ["喵喵正在翻閱帳本... 📖", "正在計算罐罐的匯率... 🐟", "數據量大，喵喵努力消化中... 🐾"];

const personasList = [
  { value: 'cute', label: '😽 可愛喵喵' }, { value: 'gentle', label: '🐈 溫柔管家喵' },
  { value: 'professional', label: '🦁 嚴肅顧問' }, { value: 'tsundere', label: '😼 傲嬌喵' },
  { value: 'lazy', label: '😿 厭世喵' }, { value: 'rich', label: '💰 土豪喵' }
];

const handleSend = async () => {
  if (!input.value.trim() || isTyping.value) return;
  const query = input.value;
  const now = new Date();
  const exactTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  messages.value.push({ id: Date.now(), text: query, sender: 'user', timestamp: new Date().toISOString() });
  input.value = '';
  paintDrops.value = [];
  isTyping.value = true;
  scrollToBottom();

  loadingInterval = setInterval(() => {
    loadingText.value = waitingJokes[Math.floor(Math.random() * waitingJokes.length)];
  }, 1500);

  try {
    const historyText = messages.value.slice(-5, -1).map(m => `${m.sender === 'user' ? '小主人' : '喵喵'}：${m.text.substring(0, 30)}`).join('\n');
    const finalPrompt = `[台北時間 ${exactTime}]\n${historyText}\n小主人：${query}`;
    const rawRes = await postAiRobotChat({ message: finalPrompt, persona: selectedPersona.value });
    const response = rawRes?.data || rawRes;

    let actionData = response.action_data || null;
    if (actionData && !Array.isArray(actionData)) actionData = [actionData];

    // 確保帳戶資料同步，避免下拉選單空白
    if (response.is_command && accountStore.accounts.length === 0) await accountStore.loadAccounts(true);
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
      intent: response.intent,           // 🌟 儲存後端傳來的意圖
      confidence: response.confidence    // 🌟 儲存後端傳來的信心度

    });
  } catch (error) {
    messages.value.push({ id: Date.now() + 1, text: "喵... 我斷線了喵！", sender: 'bot', timestamp: new Date().toISOString() });
  } finally {
    isTyping.value = false;
    if (loadingInterval) clearInterval(loadingInterval);
    scrollToBottom();
    await nextTick();
    if (inputRef.value) inputRef.value.focus();
  }
};
// ==========================================
// 4. 卡片操作與生命週期 (Card Actions & Lifecycle)
// ==========================================
const confirmRecord = async (msgId, index, data) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (!msg) return;
  try {
    const todayStr = getLocalDate();
    if (accountStore.accounts.length === 0) await accountStore.loadAccounts(true);
    const firstAccount = accountStore.accounts[0];

    // 🌟 關鍵修改：優先取用 AI 推算出來的 record_date，如果 AI 沒給，才用今天的日期保底
    const finalDate = data.record_date || todayStr;

    // 🔄 模式 1：轉帳模式
    if (data.record_type === 'transfer') {
      const payload = {
        transaction_date: finalDate, // 👈 換成 finalDate
        from_account_id: getAccountId(data.from_account) || firstAccount.account_id,
        to_account_id: getAccountId(data.to_account) || (accountStore.accounts[1]?.account_id || firstAccount.account_id),
        transaction_note: data.add_note || 'AI轉帳',
        amount: parseFloat(data.add_amount || data.amount || 0)
      };
      await api.post('/transfers/', payload);
    }
    // 📝 模式 2：一般收支模式
    else {
      const isIncome = data.record_type === 'income' || data.add_type === true;
      const payload = {
        add_date: finalDate, // 👈 換成 finalDate
        add_amount: parseFloat(data.add_amount || data.amount || 0),
        add_type: isIncome,
        add_class: data.add_class || '其他',
        add_class_icon: getClassIcon(data.add_class),
        account_id: getAccountId(data.account_name) || firstAccount.account_id,
        add_member: data.add_member || '自己',
        add_tag: data.add_tag || '需要',
        add_note: data.add_note || 'AI記帳'
      };
      await api.post('/records/', payload);
    }

    // 成功後處理：從卡片清單移除
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

const cancelRecord = (msgId, index) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (!msg) return;
  msg.action_data.splice(index, 1);
  if (msg.action_data.length === 0) {
    msg.is_command = false;
    msg.text = `❌ 喵～已經取消操作囉！`;
  }
};

const chatWindowStyle = computed(() => {
  const isInBottomHalf = position.value.y > window.innerHeight / 2;
  const isInRightHalf = position.value.x > window.innerWidth / 2;
  return {
    position: 'absolute', zIndex: 10000,
    bottom: isInBottomHalf ? '10px' : 'auto', top: isInBottomHalf ? 'auto' : '10px',
    right: isInRightHalf ? '0px' : 'auto', left: isInRightHalf ? 'auto' : '0px',
    transformOrigin: `${isInRightHalf ? 'right' : 'left'} ${isInBottomHalf ? 'bottom' : 'top'}`
  };
});

// 🧹 清空紀錄
// 🧹 清空紀錄
const clearChat = () => {
  if (confirm('喵？確定要清空嗎？')) {
    messages.value = [{ id: Date.now(), text: '紀錄已清空喵！', sender: 'bot', timestamp: new Date().toISOString() }];

    // 🌟 新增：3秒後自動變回預設打招呼，體驗更滑順
    setTimeout(() => {
      messages.value = [{
        id: Date.now(),
        text: '嗨！我是 喵喵小助手 💰 有什麼能幫你的嗎喵？',
        sender: 'bot',
        timestamp: new Date().toISOString()
      }];
    }, 3000);
  }
};


// ==========================================
// 🌟 5. 用戶主動反饋機制 (Human Feedback)
// ==========================================
const handleFeedback = async (message, isGood) => {
  // 標記這則訊息已經給過回饋，避免重複點擊
  message.feedbackGiven = true;

  if (!isGood) {
    try {
      // 找出小主人的上一句話
      const msgIndex = messages.value.findIndex(m => m.id === message.id);
      const userMsg = msgIndex > 0 ? messages.value[msgIndex - 1].text : '未知問題';

      // 🌟 使用 robot.js 封裝的 API
      await postAiFeedback({
        user_message: userMsg,
        llm_response: message.text,
        predicted_intent: message.intent || 'UNKNOWN',
        confidence_score: message.confidence || 0.0
      });
      ElMessage.success('收到倒讚！已將這筆對話送交後台審核 📝');
    } catch (error) {
      console.error('反饋發送失敗', error);
      ElMessage.error('糟糕，反饋傳送失敗了喵...');
    }
  } else {
    ElMessage.success('謝謝小主人的稱讚喵！🥰');
  }
};




onMounted(async () => {
  await accountStore.loadAccounts();
  connectWebSocket();
  window.addEventListener('resize', () => {
    position.value.x = Math.min(position.value.x, window.innerWidth - 100);
    position.value.y = Math.min(position.value.y, window.innerHeight - 100);
  });
});
onUnmounted(() => { if (ws) { ws.onclose = null; ws.close(); } });

watch(isOpen, (newVal) => localStorage.setItem('isMeowChatOpen', newVal));
watch(messages, (newVal) => localStorage.setItem('meowChatHistory', JSON.stringify(newVal)), { deep: true });
watch(selectedPersona, (newVal) => localStorage.setItem('meowPersona', newVal));




</script>

<template>
  <div class="money-ai-bot" :style="{ left: position.x + 'px', top: position.y + 'px' }">
    <button v-if="!isOpen" class="bot-toggle-transparent" @mousedown="startDrag">
      <img :src="catImg" class="floating-cat" alt="cat" draggable="false" />
      <div class="stars-container">
        <span class="star s1">✦</span>
        <span class="star s3">✨</span>
      </div>
    </button>
    <Teleport to="body">
      <div v-if="isTyping" class="spray-canvas" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing"
        @mouseleave="stopDrawing">
        <div v-for="drop in paintDrops" :key="drop.id" class="paint-drop" :style="drop.style"></div>
        <div class="spray-hint">AI 思考中... 點擊畫面亂噴發或按住滑鼠畫圖，發洩一下吧喵！🎨</div>
      </div>
    </Teleport>

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

        <div class="messages-container" ref="messagesContainer">
          <div v-for="message in messages" :key="message.id" :class="['msg-row', message.sender]">
            <div v-if="message.sender === 'bot'" class="avatar-container-msg">
              <img :src="catImg" class="msg-avatar" />
            </div>
            <div class="bubble">
              <p style="white-space: pre-wrap;">{{ message.text }}</p>

              <template v-if="message.is_command && message.action_data && message.action_data.length > 0">
                <div v-for="(actionItem, idx) in message.action_data" :key="idx" class="action-card"
                  style="margin-bottom: 12px;">
                  <div class="card-header">
                    {{ actionItem.record_type === 'transfer' ? '🔄 轉帳確認' : '📝 收支確認' }}
                    <span style="font-size: 12px; color: #94a3b8; font-weight: normal; margin-left: auto;">({{ idx + 1
                    }}/{{ message.action_data.length }})</span>
                  </div>

                  <div class="card-body">
                    <div class="data-row">
                      <span class="label">日期：</span>
                      <input type="date" v-model="actionItem.record_date" class="value ai-select"
                        style="max-width: 130px;" />
                    </div>

                    <div class="data-row">
                      <span class="label">金額：</span>
                      <span class="value amount"
                        :style="{ color: actionItem.record_type === 'income' ? '#10b981' : (actionItem.record_type === 'expense' ? '#ef4444' : '#3b82f6') }">
                        {{ actionItem.record_type === 'income' ? '+' : (actionItem.record_type === 'expense' ? '-' : '')
                        }} $ {{ actionItem.add_amount }}
                      </span>
                    </div>

                    <template v-if="actionItem.record_type !== 'transfer'">
                      <div class="data-row"><span class="label">類別：</span><span class="value">{{ actionItem.add_class
                      }}</span></div>
                      <div class="data-row"><span class="label">項目：</span><span class="value">{{ actionItem.add_note
                      }}</span></div>

                      <div class="data-row">
                        <span class="label">帳戶：</span>
                        <select v-model="actionItem.account_name" class="value ai-select">
                          <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">
                            {{ acc.itemName }}
                          </option>
                        </select>
                      </div>

                      <div class="data-row"><span class="label">標籤：</span><span class="value tag-text">{{
                        actionItem.add_member }} / {{ actionItem.add_tag }}</span></div>
                    </template>

                    <template v-else>
                      <div class="data-row">
                        <span class="label">轉出 (From)：</span>
                        <select v-model="actionItem.from_account" class="value ai-select">
                          <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">{{
                            acc.itemName }}</option>
                        </select>
                      </div>

                      <div class="data-row">
                        <span class="label">轉入 (To)：</span>
                        <select v-model="actionItem.to_account" class="value ai-select">
                          <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">{{
                            acc.itemName }}</option>
                        </select>
                      </div>

                      <div class="data-row"><span class="label">備註：</span><span class="value">{{ actionItem.add_note
                      }}</span></div>
                    </template>
                  </div>

                  <div class="card-footer">
                    <button class="btn cancel" @click="cancelRecord(message.id, idx)">取消</button>
                    <button class="btn confirm" @click="confirmRecord(message.id, idx, actionItem)">確認送出</button>
                  </div>
                </div>
              </template>

              <span class="time">
                {{ formatTime(message.timestamp) }}
                <span v-if="message.sender === 'bot' && message.duration" class="meta-info">
                  <span class="provider-tag" v-if="message.provider">[{{ message.provider.toUpperCase() }}]</span>
                  <span class="duration-tag">⏱️{{ formatDuration(message.duration) }}</span>
                </span>

                <span v-if="message.sender === 'bot'" class="feedback-actions">
                  <template v-if="!message.feedbackGiven">
                    <button class="feedback-btn" title="回答很棒" @click="handleFeedback(message, true)">👍</button>
                    <button class="feedback-btn" title="回答有誤" @click="handleFeedback(message, false)">👎</button>
                  </template>
                  <template v-else>
                    <span class="feedback-thanks">已回饋 ✓</span>
                  </template>
                </span>
              </span>
            </div>
          </div>
          <div v-if="isTyping" class="msg-row bot">
            <div class="avatar-container-msg">
              <img :src="catImg" class="msg-avatar" />
            </div>
            <div class="bubble typing">{{ loadingText }}</div>
          </div>
        </div>

        <div class="input-area">
          <input ref="inputRef" v-model="input" placeholder="輸入訊息..." @keyup.enter.prevent="handleSend"
            :disabled="isTyping" />
          <button class="send-btn" @click="handleSend" :disabled="isTyping">🐾</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import "../assets/css/ai_painting.css";

/* 🎯 恢復您最愛的 Win11 原始樣式 */
.money-ai-bot {
  position: fixed;
  z-index: 9999;
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
  position: absolute;
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

.avatar-container-msg {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  margin-top: 5px;
}

.msg-avatar {
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

.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: #fff;
}

.msg-row {
  display: flex;
  gap: 10px;
  max-width: 85%;
}

.msg-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.bubble {
  padding: 10px 14px;
  border-radius: 14px;
  font-size: 0.9rem;
  line-height: 1.4;
  position: relative;
}

.bot .bubble {
  background: #f0f2f5;
  color: #333;
  border-top-left-radius: 2px;
}

.user .bubble {
  background: #3b82f6;
  color: white;
  border-top-right-radius: 2px;
}

.time {
  font-size: 0.7rem;
  opacity: 0.5;
  margin-top: 4px;
  display: block;
  text-align: right;
}

.duration {
  font-size: 9px;
  color: #9ca3af;
  margin-left: 4px;
}

.typing {
  color: #888;
  font-style: italic;
  font-size: 0.85rem;
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

/* 🌟 新增的反饋按鈕樣式 */
.feedback-actions {
  margin-left: 8px;
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.feedback-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.4;
  transition: all 0.2s ease;
  padding: 0 2px;
}

.feedback-btn:hover {
  opacity: 1;
  transform: scale(1.2) translateY(-2px);
}

.feedback-thanks {
  font-size: 12px;
  color: #10b981;
  margin-left: 4px;
  font-weight: bold;
}
</style>