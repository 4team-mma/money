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

const greetingsMap = {
  '/': '嗨！我是 喵喵小助手 💰',
  '/admins': '歡迎來到控制中心喵！',
  '/user': '小主人歡迎回來，今天想記點什麼喵？'
};

const messagesContainer = ref(null)
const inputRef = ref(null)
const accountStore = useAccountStore()
import { processSpeechCorrection } from '@/api/speech'

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

// === 🚀 拖拽功能邏輯 ===
const position = ref({ x: 92, y: 85 })
// ==========================================
// 2. 互動功能 (Drag, Paint Game & WebSocket)
// ==========================================
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const startPos = ref({ x: 0, y: 0 })

const pixelPosition = computed(() => ({
  x: (position.value.x / 100) * window.innerWidth,
  y: (position.value.y / 100) * window.innerHeight
}))

// 開始拖拽
const startDrag = (e) => {
  isDragging.value = true;
  startPos.value = { x: e.clientX, y: e.clientY };

  // 計算點擊位置相對於目前「像素位置」的偏移
  dragOffset.value = {
    x: e.clientX - pixelPosition.value.x,
    y: e.clientY - pixelPosition.value.y
  };

  window.addEventListener('mousemove', onDragging);
  window.addEventListener('mouseup', stopDrag);
};

const onDragging = (e) => {
  if (!isDragging.value) return;

  // 1. 計算新的像素座標
  let newX = e.clientX - dragOffset.value.x;
  let newY = e.clientY - dragOffset.value.y;

  // 2. 邊界檢查 (預留 100px 寬度給貓咪)
  const safeX = Math.max(10, Math.min(newX, window.innerWidth - 90))
  const safeY = Math.max(10, Math.min(newY, window.innerHeight - 90))

  // 3. ⚡️ 存回百分比：這樣畫面縮放時，比例才會維持
  position.value.x = (safeX / window.innerWidth) * 100;
  position.value.y = (safeY / window.innerHeight) * 100;
};

const stopDrag = (e) => {
  if (!isDragging.value) return;
  isDragging.value = false;

  // 移除全域監聽
  window.removeEventListener('mousemove', onDragging);
  window.removeEventListener('mouseup', stopDrag);

  // 判定是否為單純點擊
  const moveDistance = Math.sqrt(
    Math.pow(e.clientX - startPos.value.x, 2) +
    Math.pow(e.clientY - startPos.value.y, 2)
  );

  if (moveDistance < 5) {
    isOpen.value = true;
    return; // 如果是點擊，就不要執行後面的自動吸附
  }

  // 🤖 自動吸附邊緣邏輯 (讓喵喵永遠靠邊)
  // 如果 X 超過螢幕一半(50%) 就吸到右邊，否則吸到左邊
  if (position.value.x > 50) {
    position.value.x = 92  // 靠右但不超出
  } else {
    position.value.x = 2   // 靠左
  }
};

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
let wsRetryCount = 0; // 記錄重試次數
const MAX_WS_RETRIES = 3; // 最多只允許重試 3 次

const connectWebSocket = () => {
  const token = localStorage.getItem("user_token") || localStorage.getItem("token");
  if (!token) return;
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const wsUrl = apiBase === '/api'
    ? `ws://localhost:8000/api/ws/chat?token=${token}`
    : `${apiBase.replace('https://', 'wss://').replace('http://', 'ws://')}/ws/chat?token=${token}`;
  ws = new WebSocket(wsUrl);
  // 一旦成功連上，就把失敗計數器歸零
  ws.onopen = () => {
    wsRetryCount = 0;
  };
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
  // 🌟 修改：加入重試上限的判斷邏輯
  ws.onclose = () => {
    if (wsRetryCount < MAX_WS_RETRIES) {
      wsRetryCount++;
      console.warn(`[WebSocket] 連線中斷，3秒後進行第 ${wsRetryCount} 次重連...`);
      setTimeout(connectWebSocket, 3000);
    } else {
      console.error("[WebSocket] 重連失敗次數過多，停止重連。可能是 Token 已過期。");

      // 在畫面上溫柔地提醒小主人
      messages.value.push({
        id: Date.now(),
        text: "喵... 連線一直失敗，可能是登入憑證過期了。請小主人「重新整理網頁」或「重新登入」試試看喵！",
        sender: 'bot',
        timestamp: new Date().toISOString()
      });
      scrollToBottom();

      // 彈出右上角錯誤提示
      ElMessage.error('連線中斷，請重新登入！');
    }
  };
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

// 🌟 乾淨整合版的 onMounted
onMounted(async () => {
  await accountStore.loadAccounts();
  if (isOpen.value) checkAndGreet();

  // 視窗縮放時，強迫重新渲染 (Vue Computed 會自動處理比例)
  window.addEventListener('resize', () => {
    // 視窗縮小時，強制把貓咪推回安全範圍內
    // x 只允許在 2% ~ 88% 之間（保留貓咪本身寬度）
    position.value.x = Math.min(Math.max(2, position.value.x), 88)
    position.value.y = Math.min(Math.max(2, position.value.y), 88)

    // 自動吸附：縮小後重新判斷靠左或靠右
    if (position.value.x > 50) {
      position.value.x = 88
    } else {
      position.value.x = 2
    }
  })

  connectWebSocket();
});

// 🌟 乾淨整合版的 onUnmounted
onUnmounted(() => {
  // 離開網頁時，優雅地關閉電話線
  if (ws) {
    ws.onclose = null; // 防止觸發自動重連
    ws.close();
  }
});

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

  // 🌟 修正 1：統一使用 userMsgId，這樣等一下 AI 改錯字才找得到這個泡泡
  const userMsgId = Date.now();
  messages.value.push({ id: userMsgId, text: query, sender: 'user', timestamp: new Date().toISOString() });
  
  input.value = '';
  paintDrops.value = [];
  isTyping.value = true;
  scrollToBottom();

  loadingInterval = setInterval(() => {
    loadingText.value = waitingJokes[Math.floor(Math.random() * waitingJokes.length)];
  }, 1500);


// ==========================================
  // 🚀 核心防呆機制：本地端 GPU 糾錯攔截
  // ==========================================
  let finalQuery = query; // 預設使用原句
  if (wasSpoken.value) {
    loadingText.value = "啟動 RTX 4060 Ti 糾錯中喵... 🐾";
    console.log(`🎤 [耳朵聽寫] 收到語音原始草稿：【${query}】`);
    
    try {
      // 送給後端
      const correctRes = await processSpeechCorrection(query);
      const responseData = correctRes?.data || correctRes;

      if (responseData && responseData.corrected_text) {
        finalQuery = responseData.corrected_text;
        console.log("🔍 [Debug] 後端原始回傳：", correctRes);

        // 如果 AI 真的發現錯字並改掉了
        if (finalQuery !== query) {
          console.log(`✨ [大腦 LoRA 發功] 發現錯字並成功修正！\n❌ 原句：${query}\n✅ 修正：${finalQuery}`);
          const msgIndex = messages.value.findIndex(m => m.id === userMsgId);
          if (msgIndex !== -1) {
              
              // ✅ 請改成這行：保留原始草稿，並加上 AI 修正結果！
              messages.value[msgIndex].text = `🎤 原始：${query}\n✨ 修正：${finalQuery}`;
          }
        } else {
          console.log(`🛡️ [大腦 LoRA 判定] 原句已經很完美，無需修正！保持原樣：【${finalQuery}】`);
        }
      }
    } catch (err) {
      // 🌟 修正 2：如果 GPU 沒開 (404) 或失敗，不要跳斷線！直接印出警告，然後用原句繼續記帳！
      console.warn("⚠️ [大腦休眠] GPU 糾錯引擎未開啟或連線失敗，直接使用原句記帳！", err);
    } finally {
      wasSpoken.value = false; // 處理完畢，重置標記
      loadingText.value = waitingJokes[0]; // 切回原本的等待文字
    }
  }
  // ==========================================

  try {
    const historyText = messages.value.slice(-5, -1).map(m => `${m.sender === 'user' ? '小主人' : '喵喵'}：${m.text.substring(0, 30)}`).join('\n');
    const finalPrompt = `[台北時間 ${exactTime}]\n${historyText}\n小主人：${finalQuery}`;

    const rawRes = await postAiRobotChat({ message: finalPrompt, persona: selectedPersona.value });
    const response = rawRes?.data || rawRes;

    let actionData = response.action_data || null;
    if (actionData && !Array.isArray(actionData)) actionData = [actionData];

    // 確保帳戶資料同步
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
      intent: response.intent,           
      confidence: response.confidence    
    });
  } catch (error) {
    // 🌟 修正 3：這才是真正的 Ollama (記帳大腦) 斷線錯誤處理！
    console.error("❌ 聊天大腦發生錯誤：", error); 
    messages.value.push({ id: Date.now() + 1, text: "喵... 我斷線了喵！請檢查後端終端機或 Ollama 狀態！", sender: 'bot', timestamp: new Date().toISOString() });
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


// ⚡️ 修正視窗位置：Teleport 到 body 後的絕對座標計算
const chatWindowStyle = computed(() => {
  const isInRightHalf = position.value.x > 50;
  const catX = pixelPosition.value.x;
  const catY = pixelPosition.value.y;
  const windowHeight = window.innerHeight;
  const chatHeight = 520; 

  const style = {
    position: 'fixed', // 確保浮動在最上層
    zIndex: 10000,
    width: '360px',
  };

  // 1. 水平定位：確保對話框出現在貓咪的旁邊，不會擋到貓
  if (isInRightHalf) {
    style.right = `${window.innerWidth - catX + 10}px`; // 貓咪在右，對話框靠左一點
    style.left = 'auto';
    style.transformOrigin = 'right center';
  } else {
    style.left = `${catX + 100}px`; // 貓咪在左，對話框靠右一點
    style.right = 'auto';
    style.transformOrigin = 'left center';
  }

  // 2. 垂直定位：讓對話框中心對齊貓咪中心
  let topPosition = catY + 45; // 預設對齊貓咪中心點
  
  // 智慧防溢出：如果貓太靠上面或下面，強制把對話框推回安全範圍內
  if (topPosition - (chatHeight / 2) < 20) {
    topPosition = (chatHeight / 2) + 20; // 防止撞到天花板
  } else if (topPosition + (chatHeight / 2) > windowHeight - 20) {
    topPosition = windowHeight - (chatHeight / 2) - 20; // 防止撞到地板
  }

  style.top = `${topPosition}px`;
  style.transform = `translateY(-50%)`;

  return style;
});

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


// ==========================================
// 🌟 6. 語音辨識功能 (Web Speech API)
// ==========================================
const isRecording = ref(false);
const wasSpoken = ref(false); // 🌟 新增：用來記錄這句話是不是用語音輸入的
let recognition = null;
let originalInput = ''; // 用來暫存錄音前已經輸入的文字

const toggleRecording = () => {
  // 如果正在錄音，就停止
  if (isRecording.value && recognition) {
    recognition.stop();
    return;
  }

  // 檢查瀏覽器是否支援 Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    ElMessage.warning('小主人的瀏覽器不支援語音辨識喵...請用 Chrome 或 Edge 瀏覽器！');
    return;
  }

  // 初始化語音辨識引擎
  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW'; // 設定為台灣中文
    recognition.interimResults = true; // 🌟 開啟即時辨識 (邊講邊上字)
    recognition.continuous = false; // 講完一句話自動停止

    recognition.onstart = () => {
      isRecording.value = true;
      originalInput = input.value; // 記住講話前輸入框原本就有的字
    };

    // 處理辨識結果
    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      // 把原本的字 加上 正在講的字
      input.value = originalInput + currentTranscript;
      wasSpoken.value = true; // 🌟 標記：這句話含有語音輸入！
    };

    recognition.onerror = (event) => {
      console.error("語音辨識發生錯誤:", event.error);
      isRecording.value = false;
      if (event.error === 'not-allowed') {
        ElMessage.error('需要麥克風權限才能用語音喵！');
      }
    };

    recognition.onend = () => {
      isRecording.value = false;
    };
  }

  // 開始錄音！
  recognition.start();
};



onMounted(async () => {
  await accountStore.loadAccounts();
  connectWebSocket();
  window.addEventListener('resize', () => {
    position.value.x = position.value.x > 50 ? 88 : 2
    position.value.y = Math.min(Math.max(2, position.value.y), 88)
    // 強制觸發 pixelPosition 重新計算
    position.value = { ...position.value }
  });
});
onUnmounted(() => { if (ws) { ws.onclose = null; ws.close(); } });

watch(isOpen, (newVal) => localStorage.setItem('isMeowChatOpen', newVal));
watch(messages, (newVal) => localStorage.setItem('meowChatHistory', JSON.stringify(newVal)), { deep: true });
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
      <div v-if="isTyping" class="spray-canvas" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing"
        @mouseleave="stopDrawing">
        <div v-for="drop in paintDrops" :key="drop.id" class="paint-drop" :style="drop.style"></div>
        <div class="spray-hint">AI 思考中... 點擊畫面亂噴發或按住滑鼠畫圖，發洩一下吧喵！🎨</div>
      </div>
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
          <input ref="inputRef" v-model="input" placeholder="輸入訊息..." 
          @keyup.enter.prevent="handleSend"
          @input="wasSpoken = false"
            :disabled="isTyping" />

          <button class="mic-btn" :class="{ 'is-recording': isRecording }" @click="toggleRecording" :disabled="isTyping"
            :title="isRecording ? '點擊停止錄音' : '語音輸入'">
            {{ isRecording ? '🎙️' : '🎤' }}
          </button>

          <button class="send-btn" @click="handleSend" :disabled="isTyping">🐾</button>
        </div>
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
</style>