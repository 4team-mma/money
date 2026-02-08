<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { robotApi } from '../api/robot';

const route = useRoute()
const messagesContainer = ref(null)

// 修正：從 localStorage 讀取狀態，確保換頁不縮起來
const isOpen = ref(localStorage.getItem('isMeowChatOpen') === 'true')

const input = ref('')
const isTyping = ref(false) // 確保變數定義在頂部
const catImg = new URL('@/assets/AI_cat.png', import.meta.url).href

/* ========================
   路徑問候語地圖
   ======================== */
const greetingsMap = {
  '/Book': '喵～今天有什麼開支要紀錄嗎？點擊日期可以看詳細紀錄喔！🗓️',
  '/dashboard': '喵～這是你的財務總覽，看看最近的收支平衡了嗎？📊',
  '/Account': '喵～這裡可以管理你的金庫，要新增銀行帳號或錢包嗎？⛺',
  '/BudgetManager': '喵～預算控管是修仙的第一步！我們來規劃這月的開銷吧。🐱',
  '/Add': '喵～記下一筆支出，修仙等級就會提升喔！快輸入金額吧。➕',
  '/Chart': '喵～想看哪段時間的支出分佈？我可以幫你解讀這些圖表喔。📈',
  '/ConsumerAnalysis': '喵～最近的 CPI 物價趨勢有影響到你的錢包嗎？來看看分析。⛽',
  '/SalaryAnalysis': '喵～想知道你的薪資在行業中的位置嗎？來分析增長率吧！💵',
  '/Achievements_new': '喵～恭喜你獲得這麼多成就！離理財大師又近一步了。🏆',
  '/Feedback': '喵～有什麼不滿意的地方嗎？告訴喵喵，我會努力改進的！❓',
  '/Settings': '喵～這裡可以調整我的樣式和系統設定，選個你喜歡的主題吧。⚙️'
}

const messages = ref([
  {
    id: 1,
    text: '嗨！我是 喵喵小助手 💰 有什麼財務問題我可以幫你嗎？',
    sender: 'bot',
    timestamp: new Date()
  }
])

// 監聽 isOpen 狀態並存入 localStorage
watch(isOpen, (newVal) => {
  localStorage.setItem('isMeowChatOpen', newVal)
  if (newVal) {
    checkAndGreet()
  }
})

// 自動問候邏輯
const checkAndGreet = () => {
  const customText = greetingsMap[route.path]
  if (customText) {
    setTimeout(() => {
      // 檢查是否已經說過這句話，避免重複
      const alreadySent = messages.value.some(m => m.text === customText)
      if (!alreadySent) {
        messages.value.push({
          id: Date.now(),
          text: customText,
          sender: 'bot',
          timestamp: new Date()
        })
        scrollToBottom()
      }
    }, 400)
  }
}

// 監聽路徑：換頁時如果貓咪是開著的，就檢查問候語
watch(() => route.path, () => {
  if (isOpen.value) {
    checkAndGreet()
  }
})

onMounted(() => {
  if (isOpen.value) {
    checkAndGreet()
  }
})

const formatTime = (date) => date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const handleSend = async () => {
  // 檢查輸入是否為空或正在思考中
  if (!input.value.trim() || isTyping.value) return

  const query = input.value
  
  // 1. 使用者訊息加入列表
  messages.value.push({ 
    id: Date.now(), 
    text: query, 
    sender: 'user', 
    timestamp: new Date() 
  })
  
  input.value = ''
  isTyping.value = true // 開始思考
  scrollToBottom()

  try {
    // 2. 呼叫後端 API (robotApi)
    const response = await robotApi.postAiRobotChat({ message: query });

    // 3. 取得回覆內容 (相容不同的 axios 返回結構)
    const replyText = response.data?.reply || response.reply;

    messages.value.push({
      id: Date.now() + 1,
      text: replyText,
      sender: 'bot',
      timestamp: new Date()
    })
  } catch (error) {
    console.error("AI 請求失敗:", error);
    // 顯示錯誤具體細節，方便偵測 401 或 400
    const errorMsg = error.response?.data?.detail || "喵... 我好像斷線了，請檢查後端伺服器喵！";
    messages.value.push({
      id: Date.now() + 1,
      text: errorMsg,
      sender: 'bot',
      timestamp: new Date()
    })
  } finally {
    isTyping.value = false // 結束思考
    scrollToBottom()
  }
}
</script>

<template>
  <div class="money-ai-bot">
    <button v-if="!isOpen" class="bot-toggle-transparent" @click="isOpen = true">
      <img :src="catImg" class="floating-cat" alt="cat" />
      <div class="stars-container">
        <span class="star s1">✦</span>
        <span class="star s3">✨</span>
      </div>
    </button>

    <div v-if="isOpen" class="chat-window-custom">
      <div class="chat-header-custom">
        <div class="header-left">
          <img :src="catImg" class="header-icon" />
          <div class="bot-status">
            <span class="name">Money 喵喵小助手</span>
            <span class="status">{{ isTyping ? '喵喵正在思考中...' : '隨時為您服務' }}</span>
          </div>
        </div>
        <button class="close-x" @click="isOpen = false">✕</button>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div v-for="message in messages" :key="message.id" :class="['msg-row', message.sender]">
          <img v-if="message.sender === 'bot'" :src="catImg" class="msg-avatar" />
          <div class="bubble">
            <p>{{ message.text }}</p>
            <span class="time">{{ formatTime(message.timestamp) }}</span>
          </div>
        </div>
        <div v-if="isTyping" class="msg-row bot">
           <img :src="catImg" class="msg-avatar" />
           <div class="bubble typing">...正在思考中喵...</div>
        </div>
      </div>

      <div class="input-area">
        <input 
          v-model="input" 
          placeholder="輸入訊息..." 
          @keydown.enter="handleSend" 
          :disabled="isTyping"
        />
        <button class="send-btn" @click="handleSend" :disabled="isTyping">🐾</button>
      </div>
      <p class="bottom-hint">喵～問問我「預算」、「帳戶」或「分析」！</p>
    </div>
  </div>
</template>

<style scoped>
.money-ai-bot {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
}

.bot-toggle-transparent {
  background: transparent !important;
  border: none !important;
  cursor: pointer;
  padding: 0;
  position: relative;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-cat {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.3s;
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
  text-shadow: 0 0 5px rgba(255,202,40,0.5);
  animation: blink 1.5s infinite alternate;
}

.s1 { top: 20%; right: 5%; font-size: 0.9rem; animation-delay: 0s; }
.s3 { top: 35%; right: 18%; font-size: 0.7rem; animation-delay: 0.8s; }

@keyframes blink {
  0% { opacity: 0.4; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1.2); }
}

.chat-window-custom {
  width: 360px;
  height: 520px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.chat-header-custom { padding: 16px; background: #f8faff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; }
.header-left { display: flex; align-items: center; gap: 10px; }
.header-icon { width: 32px; height: 32px; object-fit: contain; }
.bot-status .name { display: block; font-weight: 700; color: #333; font-size: 0.95rem; }
.bot-status .status { font-size: 0.75rem; color: #888; }
.close-x { background: #eee; border: none; width: 28px; height: 28px; border-radius: 6px; cursor: pointer; }
.messages-container { flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; background: #fff; }

.msg-row { display: flex; gap: 10px; max-width: 85%; }
.msg-row.user { align-self: flex-end; flex-direction: row-reverse; }

.msg-avatar { width: 28px; height: 28px; object-fit: contain; }
.bubble { padding: 10px 14px; border-radius: 14px; font-size: 0.9rem; line-height: 1.4; position: relative; }

.bot .bubble { background: #f0f2f5; color: #333; border-top-left-radius: 2px; }
.user .bubble { background: #3b82f6; color: white; border-top-right-radius: 2px; }

.bubble.typing { color: #888; font-style: italic; }

.time { font-size: 0.7rem; opacity: 0.5; margin-top: 4px; display: block; text-align: right; }

.input-area { padding: 12px; display: flex; gap: 8px; border-top: 1px solid #f0f0f0; }
.input-area input { flex: 1; border: 1px solid #ddd; padding: 8px 12px; border-radius: 10px; outline: none; }
.input-area input:disabled { background: #f9f9f9; }

.send-btn { background: #3b82f6; border: none; border-radius: 8px; width: 40px; color: white; cursor: pointer; }
.send-btn:disabled { background: #ccc; cursor: not-allowed; }

.bottom-hint { font-size: 0.7rem; color: #aaa; text-align: center; margin-bottom: 10px; }
</style>