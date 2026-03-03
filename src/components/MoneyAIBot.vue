<script setup>
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

// ⚡️ 修改點 1：改用具名匯入，直接引入需要的函式
import { postAiRobotChat } from '@/api/robot';

const route = useRoute()
const messagesContainer = ref(null)

// === 🚀 拖拽功能邏輯 ===
const position = ref({ x: window.innerWidth - 120, y: window.innerHeight - 120 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })
// 開始拖拽
const startDrag = (e) => {
  isDragging.value = true
  // 記錄點擊時的原始座標
  startPos.value = { x: e.clientX, y: e.clientY }
  
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  window.addEventListener('mousemove', onDragging)
  window.addEventListener('mouseup', stopDrag)
}

const onDragging = (e) => {
  if (!isDragging.value) return
  
  // 計算新座標並加上簡易邊界檢查（預留 10px 邊距）
  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y
  
  const maxX = window.innerWidth - 100
  const maxY = window.innerHeight - 100
  
  position.value.x = Math.max(10, Math.min(newX, maxX))
  position.value.y = Math.max(10, Math.min(newY, maxY))
}

const stopDrag = (e) => {
  if (!isDragging.value) return;

  // 1. 停止拖拽狀態
  isDragging.value = false;
  
  // 2. 移除全域監聽
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('mouseup', stopDrag);

  // 3. 關鍵判定：如果滑鼠放開時，位移極小，代表使用者只是想「點一下」
  const moveDistance = Math.sqrt(
    Math.pow(e.clientX - startPos.value.x, 2) + 
    Math.pow(e.clientY - startPos.value.y, 2)
  );

  if (moveDistance < 5) {
    // 只有位移小於 5px 才觸發開啟視窗
    isOpen.value = true;
  }
}

// 讀取狀態與紀錄：localStorage 確保換頁不消失
const isOpen = ref(localStorage.getItem('isMeowChatOpen') === 'true')
const messages = ref(JSON.parse(localStorage.getItem('meowChatHistory')) || [{
  id: 1,
  text: '嗨！我是 喵喵小助手 💰 有什麼財務問題我可以幫你嗎？',
  sender: 'bot',
  timestamp: new Date().toISOString(),
  duration: null
}])

const input = ref('')
const isTyping = ref(false)
// 新增：隨機等待語錄變數
const loadingText = ref('思考中喵...');
let loadingInterval = null;

const catImg = new URL('@/assets/AI_cat.png', import.meta.url).href

// 換頁自動問候語地圖
const greetingsMap = {
  '/Book': '喵～今天有什麼開支要紀錄嗎？點擊日期可以看詳細紀錄喔！🗓️',
  '/dashboard': '喵～這是你的財務總覽，看看最近的收支平衡了嗎？📊',
  '/Account': '喵～這裡可以管理你的金庫，要新增銀行帳號或錢包嗎？⛺',
  '/BudgetManager': '喵～預算控管是修仙的第一步！我們來規劃這月的開銷吧。🐱',
  '/Add': '喵～記下一筆支出，用戶等級就會提升喔！快輸入金額吧。➕',
  '/Chart': '喵～想看哪段時間的支出分佈？我可以幫你解讀這些圖表喔。📈',
  '/ConsumerAnalysis': '喵～最近的 CPI 物價趨勢有影響到你的錢包嗎？來看看分析。⛽',
  '/SalaryAnalysis': '喵～想知道你的薪資在行業中位置？來看看增長率吧！💵',
  '/Achievements': '喵～好多成就等著你收集！離理財大師又近一步了。🏆',
  '/Feedback': '喵～有什麼不滿意的地方嗎？告訴喵喵，我會努力改進的！❓',
  '/Settings': '喵～這裡可以調整樣式和系統設定，選個你喜歡的主題吧。⚙️'
}

// 🐱 喵喵的隨機等待語錄
const waitingJokes = [
  "喵喵正在翻閱帳本... 📖",
  "正在計算罐罐的匯率... 🐟",
  "數據量有點大，喵喵努力消化中... 🐾",
  "連線到大腦中，請稍候喵... ⚡",
  "喵？這筆帳好像有點複雜... 🤔",
  "正在幫你省錢，別急別急... 💰",
  "喵喵正在跟財神爺連線... ☎️",
  "正在偷看你的錢包... 啊不是，是幫你分析... 🫣"
];

// 監聽狀態變化並儲存
watch(isOpen, (newVal) => localStorage.setItem('isMeowChatOpen', newVal))
watch(messages, (newVal) => {
  localStorage.setItem('meowChatHistory', JSON.stringify(newVal))
}, { deep: true })

watch(() => route.path, () => { if (isOpen.value) checkAndGreet() })

const checkAndGreet = () => {
  const customText = greetingsMap[route.path]
  if (customText && !messages.value.some(m => m.text === customText)) {
    messages.value.push({
      id: Date.now(),
      text: customText,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      duration: null
    })
    scrollToBottom()
  }
}

// 🧹 清空紀錄按鈕 (優化版：6秒自動刪除提示訊息)
const clearChat = () => {
  if (confirm('喵？確定要清空所有對話紀錄嗎？')) {
    const clearMsgId = Date.now();

    // 1. 清空紀錄並放入「暫時性」的清空提示
    messages.value = [{
      id: clearMsgId,
      text: '紀錄已清空喵！有什麼新問題嗎？',
      sender: 'bot',
      timestamp: new Date().toISOString(),
      duration: null
    }]

    // 2. 🚀 6 秒後自動刪除該提示訊息
    setTimeout(() => {
      // 只有在該訊息還在 messages 陣列中時才刪除 (避免使用者已經開始新對話)
      const index = messages.value.findIndex(m => m.id === clearMsgId);
      if (index !== -1) {
        messages.value.splice(index, 1);
        // 刪除提示後，補上當前頁面的正常問候語
        checkAndGreet();
      }
    }, 5000);
  }
}

const formatTime = (isoStr) => new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  })
}

// ⚡️ 新增一個 helper 函式來格式化秒數
const formatDuration = (seconds) => {
  if (!seconds) return '';
  if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}m ${secs}s`;
  }
}

// 🚀 發送邏輯
const handleSend = async () => {
  if (!input.value.trim() || isTyping.value) return

  const query = input.value
  messages.value.push({ id: Date.now(), text: query, sender: 'user', timestamp: new Date().toISOString() })

  // ✅ 1. 馬上清空輸入框
  input.value = ''
  isTyping.value = true
  loadingText.value = "思考中喵..."
  scrollToBottom()

  // ✅ 2. 啟動隨機語錄 (每 1.5 秒換一句)
  loadingInterval = setInterval(() => {
    const randomIdx = Math.floor(Math.random() * waitingJokes.length);
    loadingText.value = waitingJokes[randomIdx];
  }, 1500);

  try {
    console.log(`🚀 [Chat] 發送請求: "${query}"`);

    // 🌟 只需要傳送 message，其他花式指令都交給後端處理
    const response = await postAiRobotChat({
      message: query
    });

    const replyText = response.reply;
    const duration = response.duration;
    const provider = response.provider;

    // ✅ 4. 顯示回應來源模型
    console.log(`✨ [Chat] 收到回應 (${provider}):`, replyText, `耗時: ${duration}s`);

    messages.value.push({
      id: Date.now() + 1,
      text: replyText,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      duration: duration,
      provider: provider
    })
  } catch (error) {
    console.error("❌ [Chat] 錯誤:", error);
    messages.value.push({ id: Date.now() + 1, text: "喵... 我斷線了喵！請檢查網路連線。", sender: 'bot', timestamp: new Date().toISOString() });
  } finally {
    isTyping.value = false
    // 清除隨機語錄計時器
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = null;
    scrollToBottom()
  }
}

// ⚡️ 修正視窗位置：確保對話窗展開時位置正確
const chatWindowStyle = computed(() => {
  // 檢查貓咪是否在螢幕上半部或下半部
  const isInBottomHalf = position.value.y > window.innerHeight / 2;
  const isInRightHalf = position.value.x > window.innerWidth / 2;

  const winW = 360;
  const winH = 520;
  const padding = 20;


  let style = {
    position: 'absolute',
    zIndex: 10000,
  };
  if (isInBottomHalf) {
    // 預計向上彈出
    style.bottom = '100px';
    // 檢查視窗頂部是否會超出螢幕
    if (position.value.y - winH < padding) {
      // 如果會超出頂部，改為貼著螢幕頂部
      style.bottom = 'auto';
      style.top = `-${position.value.y - padding}px`;
    }
  } else {
    // 預計向下彈出
    style.top = '100px';
    // 檢查視窗底部是否會超過螢幕
    if (position.value.y + winH + 100 > window.innerHeight - padding) {
      style.top = 'auto';
      style.bottom = `-${window.innerHeight - position.value.y - padding}px`;
    }
  }

  // 3. 水平位置修正
  if (isInRightHalf) {
    // 預計向左彈出 (右對齊)
    style.right = '0px';
    // 檢查左側是否會超出螢幕 (貓咪 x 座標小於視窗寬度)
    if (position.value.x < winW + padding) {
      // 強制往右偏移，讓視窗左側剛好留在螢幕內
      style.right = 'auto';
      style.left = `-${position.value.x - padding}px`;
    }
  } else {
    // 預計向右彈出 (左對齊)
    style.left = '0px';
    // 檢查右側是否會超出螢幕
    const spaceRight = window.innerWidth - position.value.x;
    if (spaceRight < winW + padding) {
      style.left = 'auto';
      style.right = `-${spaceRight - padding}px`;
    }
  }

// 4. 設定動畫起點 (讓縮放從貓咪中心開始)
  style.transformOrigin = `${isInRightHalf ? 'right' : 'left'} ${isInBottomHalf ? 'bottom' : 'top'}`;

  return style;
});

onMounted(() => { 
  if (isOpen.value) checkAndGreet() 
  // 視窗縮放時重新計算邊界（選配）
  window.addEventListener('resize', () => {
    position.value.x = Math.min(position.value.x, window.innerWidth - 100)
    position.value.y = Math.min(position.value.y, window.innerHeight - 100)
  })
})
</script>

<template>
  <div class="money-ai-bot"
  :style="{ left: position.x + 'px', top: position.y + 'px' }">
    <button v-if="!isOpen" class="bot-toggle-transparent" @mousedown="startDrag">
      <img :src="catImg" class="floating-cat" alt="cat" draggable="false"/>
      <div class="stars-container">
        <span class="star s1">✦</span>
        <span class="star s3">✨</span>
      </div>
    </button>
  <Transition>
    <div v-if="isOpen" class="chat-window-custom" @mousedown.stop :style="chatWindowStyle">
      <div class="chat-header-custom"@mousedown="startDrag" style="cursor: move;">
        <div class="header-left">
          <div class="avatar-container-header">
            <img :src="catImg" class="header-icon" draggable="false"/>
          </div>
          <div class="bot-status">
            <span class="name">Money 喵喵小助手</span>
            <span class="status">{{ isTyping ? '正在動腦...' : '隨時為您服務' }}</span>
          </div>
        </div>
        <div class="header-actions">
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
            <span class="time">
              {{ formatTime(message.timestamp) }}

              <span v-if="message.sender === 'bot' && message.duration" class="meta-info">
                <span class="provider-tag" v-if="message.provider">[{{ message.provider.toUpperCase() }}]</span>
                <span class="duration-tag">⏱️{{ formatDuration(message.duration) }}</span>
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
        <input v-model="input" placeholder="輸入訊息..." @keydown.enter="handleSend" :disabled="isTyping" />
        <button class="send-btn" @click="handleSend" :disabled="isTyping">🐾</button>
      </div>
    </div>
  </Transition>
  </div>
</template>

<style scoped>
/* 🎯 恢復您最愛的 Win11 原始樣式 */
.money-ai-bot {
  position: fixed;
  z-index: 9999;
  /* 禁止選取文字，避免拖曳時選到一堆藍字 */
  user-select: none; 
  overflow: visible !important;
}

.bot-toggle-transparent {
  background: transparent !important;
  border: none !important;
  cursor: grab; /* 抓取手勢 */
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
.v-enter-active, .v-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); /* 帶點 Q 彈感 */
}

.v-enter-from, .v-leave-to {
  opacity: 0;
  transform: scale(0.5); /* 從一半大小開始彈出 */
}

/* 對話窗與頭像防變形處理 */
.chat-window-custom {
  position: absolute; /* 相對於 .money-ai-bot 定位 */
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
</style>