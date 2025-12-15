<template>
  <div class="money-ai-bot">
    <button v-if="!isOpen" class="bot-toggle" @click="isOpen = true">
      <span class="bot-emoji">💰</span>
      <span class="sparkle">✨</span>
    </button>

    <div v-if="isOpen" class="chat-window">
      <div class="chat-header">
        <div class="header-content">
          <div class="bot-avatar-wrapper">
            <span class="bot-avatar">💰</span>
            <div class="status-dot"></div>
          </div>
          <div class="bot-info">
            <h3>Money AI 小幫手</h3>
            <p>隨時為您服務</p>
          </div>
        </div>
        <button class="close-button" @click="isOpen = false">✕</button>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.sender]"
        >
          <div v-if="message.sender === 'bot'" class="message-avatar">💰</div>
          <div class="message-bubble">
            <p class="message-text">{{ message.text }}</p>
            <p class="message-time">{{ formatTime(message.timestamp) }}</p>
          </div>
          <div v-if="message.sender === 'user'" class="message-avatar">😊</div>
        </div>
      </div>

      <div class="input-container">
        <input 
          v-model="input"
          type="text"
          placeholder="輸入訊息..."
          @keydown.enter="handleSend"
          class="message-input"
        />
        <button @click="handleSend" class="send-button">
          <span>📤</span>
        </button>
      </div>
      <p class="input-hint">試試問我「預算」、「股票」或「統計」！</p>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const isOpen = ref(false)
const input = ref('')
const messagesContainer = ref(null)

const messages = ref([
  {
    id: 1,
    text: '嗨！我是 Money 小幫手 💰 有什麼財務問題我可以幫你嗎？',
    sender: 'bot',
    timestamp: new Date()
  }
])

const formatTime = (date) => {
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const getBotResponse = (query) => {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('預算') || lowerQuery.includes('budget')) {
    return '根據你的記帳記錄，本月飲食預算已使用 65%，建議控制外食頻率。需要我幫你調整預算嗎？ 📊'
  } else if (lowerQuery.includes('股票') || lowerQuery.includes('投資')) {
    return '目前台積電 (2330) 價格 NT$ 598，今日上漲 0.84%。需要查看更多股票資訊或投資建議嗎？ 📈'
  } else if (lowerQuery.includes('統計') || lowerQuery.includes('分析')) {
    return '本月總支出 NT$ 45,678，比上月增加 8.3%。主要支出類別：飲食 (35%)、交通 (25%)、娛樂 (20%)。💡'
  } else if (lowerQuery.includes('帳戶') || lowerQuery.includes('餘額')) {
    return '您的主要帳戶餘額：NT$ 128,450。信用卡待繳金額：NT$ 12,340，繳款日期為本月 15 日。💳'
  } else {
    return '我可以幫你查詢財務數據、分析支出趨勢、提供投資建議，或回答任何關於記帳的問題！試試問我「本月預算」或「股票資訊」吧！ ✨'
  }
}

const handleSend = () => {
  if (!input.value.trim()) return

  const userMessage = {
    id: Date.now(),
    text: input.value,
    sender: 'user',
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  const query = input.value
  input.value = ''
  scrollToBottom()

  setTimeout(() => {
    const botResponse = {
      id: Date.now() + 1,
      text: getBotResponse(query),
      sender: 'bot',
      timestamp: new Date()
    }
    messages.value.push(botResponse)
    scrollToBottom()
  }, 1000)
}
</script>

<style scoped>
.money-ai-bot {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.bot-toggle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  border: 2px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bot-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.4);
}

.bot-emoji {
  font-size: 2rem;
}

.sparkle {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 1rem;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

.chat-window {
  width: 384px;
  height: 600px;
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 2px solid #E2E8F0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bot-avatar-wrapper {
  position: relative;
}

.bot-avatar {
  font-size: 2rem;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  background: #10B981;
  border: 2px solid white;
  border-radius: 50%;
}

.bot-info h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.bot-info p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748B;
  transition: all 0.2s;
}

.close-button:hover {
  color: #EF4444;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: linear-gradient(180deg, #F8FAFC, rgba(59, 130, 246, 0.02));
}

.message {
  display: flex;
  gap: 0.5rem;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6, #10B981);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-bubble {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message.bot .message-bubble {
  background: white;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-bottom-left-radius: 4px;
}

.message.user .message-bubble {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-text {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 0.25rem 0;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin: 0;
}

.input-container {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 2px solid #E2E8F0;
  background: white;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.send-button {
  width: 44px;
  height: 44px;
  border: none;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  border-radius: 8px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-button:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.input-hint {
  text-align: center;
  font-size: 0.75rem;
  color: #64748B;
  margin: 0;
  padding: 0 1rem 0.75rem;
}

@media (max-width: 640px) {
  .chat-window {
    width: calc(100vw - 48px);
    height: calc(100vh - 48px);
  }
}
</style>
