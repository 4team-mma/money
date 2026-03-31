<script setup>
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { onUnmounted } from 'vue';
import api from '@/api';
// ⚡️ 修改點 1：改用具名匯入，直接引入需要的函式
import { postAiRobotChat } from '@/api/robot';
import { useAccountStore } from '@/stores/useAccountStore';
const route = useRoute()
const messagesContainer = ref(null)


// 初始化 Store
const accountStore = useAccountStore();

// 🌟 修正版：動態尋找帳戶 ID，增加安全檢查
const getAccountId = (accountName) => {
  if (!accountName || typeof accountName !== 'string') return null;

  // 🌟 注意：比對的是 a.itemName，這是你在 Store 裡定義的名稱
  const found = accountStore.accounts.find(a => {
    const storeName = a.itemName || '';
    return storeName.includes(accountName) || accountName.includes(storeName);
  });
  return found ? found.account_id : null;
};

// ==========================================
// 🆕 新增：Icon 自動匹配小幫手 (配合資料庫 add_class_icon)
// ==========================================
const getClassIcon = (className) => {
  const iconMap = {
    '飲食': '🍔',
    '交通': '🚗',
    '居家': '🏠',
    '娛樂': '🎮',
    '醫療': '💊',
    '學習': '📚',
    '帳單': '🧾',
    '其他': '📦'
  };
  return iconMap[className] || '📌'; // 找不到就給個圖釘
};

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

// 🌟 喵喵人格清單
const personasList = [
  // 把這行的 label 改成可愛喵喵 👇
  { value: 'cute', label: '😽 可愛喵喵' },
  { value: 'gentle', label: '🐈 溫柔管家喵' },
  { value: 'professional', label: '🦁 嚴肅顧問' },
  { value: 'tsundere', label: '😼 傲嬌喵' },
  { value: 'lazy', label: '😿 厭世喵' },
  { value: 'rich', label: '💰 土豪喵' },
  { value: 'panic', label: '😹 恐慌喵' },
  { value: 'poet', label: '😺 文青喵' },
  { value: 'chuuni', label: '🙀 中二病喵' }
];

// 讀取/儲存選擇的人格
const selectedPersona = ref(localStorage.getItem('meowPersona') || 'cute');
watch(selectedPersona, (newVal) => {
  localStorage.setItem('meowPersona', newVal);
  scrollToBottom();
});


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


// === 🎨 噴漆與畫圖發洩小遊戲邏輯 ===
const paintDrops = ref([]);
const isDrawing = ref(false); // 判斷是否正在按住滑鼠

// 滑鼠按下去：開始畫圖，並先噴一發大圈圈
const startDrawing = (e) => {
  isDrawing.value = true;
  sprayPaint(e, false);
};

// 滑鼠移動：如果是按住的狀態，就連續畫出小圈圈（畫筆效果）
const draw = (e) => {
  if (!isDrawing.value) return;
  sprayPaint(e, true);
};

// 滑鼠放開或離開畫面：停止畫圖
const stopDrawing = () => {
  isDrawing.value = false;
};

// 核心噴漆/畫圖功能
const sprayPaint = (e, isDragging) => {
  // 🛡️ 防當機機制：畫面上最多保留 300 個圈圈，超過就從最舊的開始刪除
  // 避免使用者瘋狂畫圖導致 Vue 渲染太多 DOM 而卡死
  if (paintDrops.value.length > 300) {
    paintDrops.value.shift();
  }

  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', '#FF8ED4', '#A8E6CF', '#FF9F43'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  // 💡 如果是拖曳中，筆刷小一點 (10px~25px)；如果是單點噴漆，筆刷大一點 (30px~80px)
  const size = isDragging ? (Math.random() * 15 + 10) : (Math.random() * 50 + 30);
  const borderRadius = `${Math.random() * 30 + 35}% ${Math.random() * 30 + 35}% ${Math.random() * 30 + 35}% ${Math.random() * 30 + 35}%`;

  paintDrops.value.push({
    id: Date.now() + Math.random(),
    style: {
      left: `${e.clientX - size / 2}px`,
      top: `${e.clientY - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: randomColor,
      borderRadius: borderRadius,
      transform: `rotate(${Math.random() * 360}deg) scale(${Math.random() * 0.5 + 0.8})`
    }
  });
};
// === 🎨 噴漆發洩小遊戲尾巴 ===
let ws = null; // 存放 WebSocket 實例
// 新增：建立 WebSocket 連線 (取代了原本的 checkVoiceSuccess)

const connectWebSocket = () => {
  const token = localStorage.getItem("user_token") || localStorage.getItem("token");

  if (!token) {
    console.log('👀 [喵喵小助手] 尚未登入，等待小主人登入後再接通電話線...');
    return;
  }

  // 🌟 完美兼容寫法：從環境變數抓 API 網址
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  let wsUrl = '';

  if (apiBase === '/api') {
    // 【地端開發模式】
    wsUrl = `ws://localhost:8000/api/ws/chat?token=${token}`;
  } else {
    // 【雲端 Vercel 模式】
    // apiBase 會是 https://money-api-tdc5.onrender.com/api
    // 我們要把 https:// 換成 wss://，並把 http:// 換成 ws://
    const wssBase = apiBase.replace('https://', 'wss://').replace('http://', 'ws://');
    wsUrl = `${wssBase}/ws/chat?token=${token}`;
  }

  console.log('🔗 準備連線 WebSocket 網址:', wsUrl);
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('✅ [喵喵小助手] WebSocket 連線成功！電話線接通啦！');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'siri_sync') {
      console.log('⚡ 收到 Siri 同步對話！', data);

      isOpen.value = true;

      messages.value.push({
        id: Date.now(),
        text: `📱 (Siri 語音傳送) \n${data.user_query}`,
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

  ws.onclose = () => {
    console.log('❌ [喵喵小助手] 斷線了，3秒後嘗試重連...');
    setTimeout(connectWebSocket, 3000);
  };
};

// 🌟 乾淨整合版的 onMounted
onMounted(async () => {
  // 1. 確保元件掛載時立即同步帳戶資料
  await accountStore.loadAccounts();

  // 2. 檢查是否需要發送問候語
  if (isOpen.value) checkAndGreet();

  // 3. 視窗縮放邊界判定
  window.addEventListener('resize', () => {
    position.value.x = Math.min(position.value.x, window.innerWidth - 100);
    position.value.y = Math.min(position.value.y, window.innerHeight - 100);
  });

  // 4. 啟動 WebSocket 連線 (取代了原本的 setInterval)
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
  // 🌟 新增：取得正確的台灣時間字串
  const now = new Date();
  // 手動組合成標準格式，最安全！
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const exactTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;


  messages.value.push({ id: Date.now(), text: query, sender: 'user', timestamp: new Date().toISOString() })

  // ✅ 1. 馬上清空輸入框
  input.value = ''
  // 🎨 清空畫布與狀態
  paintDrops.value = []
  isDrawing.value = false // 確保每次發問都是重置狀態

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

    // 🧠 1. 抓取最近 4 筆對話當作「短期記憶」 (避開剛剛才 push 的自己這句)
    const historyText = messages.value
      .slice(-5, -1)
      .map(m => {
        // 🌟 核心修改：如果是喵喵說的廢話，超過 30 個字就切斷，只留重點！
        const safeText = m.text.length > 30 ? m.text.substring(0, 30) + '...' : m.text;
        return `${m.sender === 'user' ? '小主人' : '喵喵'}：${safeText}`;
      })
      .join('\n');

    // 🛡️ 2. 獨立宣告「台北時區防護咒語」 (絕對不能丟掉！)
    const timeInstruction = `[系統指令：目前台北正確時間為 ${exactTime}，請以此為準，不要自行換算時區]`;

    // 🧠 3. 動態組合 prompt：有記憶就帶記憶，沒記憶就照舊
    let finalPrompt = '';
    if (historyText.trim().length > 0) {
      // 把時區指令、歷史記憶、現在的問題，三合一完美打包！
      finalPrompt = `${timeInstruction}\n【以下是我們剛剛的對話記憶，請參考上下文回答】\n${historyText}\n\n【現在】\n小主人說：${query}`;
    } else {
      finalPrompt = `${timeInstruction} ${query}`;
    }

    // 🌟 4. 發送給後端
    const rawRes = await postAiRobotChat({
      message: finalPrompt,
      persona: selectedPersona.value
    });


    const response = rawRes?.data || rawRes;
    if (!response || !response.reply) {
      throw new Error("前端收不到正確的資料格式喵！");
    }

    const replyText = response.reply;
    const duration = response.duration;
    const provider = response.provider;

    // 🆕 新增：把後端傳來的 JSON 指令抓出來
    const isCommand = response.is_command || false;
    let actionData = response.action_data || null;

    // 🛡️ 魔法 1：不管 AI 吐單一物件還是陣列，我們通通把它包裝成陣列！
    if (actionData !== null && !Array.isArray(actionData)) {
      actionData = [actionData];
    }

    // 🌟 魔法 2：解決「需要手動刷新」的 Token 時間差問題！
    // 如果準備要出卡片了，卻發現帳戶清單是空的，立刻強制重抓一次！
    if (isCommand && accountStore.accounts.length === 0) {
        await accountStore.loadAccounts(true);
    }

    // 🌟 魔法 3：自動對齊下拉選單的預設值
    // 確保 AI 說的帳戶名稱，能 100% 對應到下拉選單裡的選項，避免選單變空白
    if (isCommand && actionData) {
        actionData.forEach(item => {
            if (item.record_type !== 'transfer') {
                const match = accountStore.accounts.find(a => a.itemName === item.account_name);
                if (!match && accountStore.accounts.length > 0) {
                    item.account_name = accountStore.accounts[0].itemName; // 找不到就塞第一個帳戶給它
                }
            } else {
                const matchFrom = accountStore.accounts.find(a => a.itemName === item.from_account);
                if (!matchFrom && accountStore.accounts.length > 0) item.from_account = accountStore.accounts[0].itemName;
                
                const matchTo = accountStore.accounts.find(a => a.itemName === item.to_account);
                if (!matchTo && accountStore.accounts.length > 0) item.to_account = accountStore.accounts[0].itemName;
            }
        });
    }

    // ✅ 4. 顯示回應來源模型  `耗時: ${duration}s`
    console.log(`✨ [Chat] 收到回應 (${provider}):`, replyText, `指令模式: ${isCommand}`, `耗時: ${duration}s`);

    messages.value.push({
      id: Date.now() + 1,
      text: replyText,
      sender: 'bot',
      timestamp: new Date().toISOString(),
      duration: duration,
      provider: provider,
      is_command: isCommand,
      action_data: actionData
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

// ==========================================
// 🚀 升級：雙模式確認卡片 (多筆記帳支援版)
// ==========================================
const confirmRecord = async (msgId, index, data) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (!msg) return;

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 🌟 1. 取得 Store 裡的帳戶資料
    if (accountStore.accounts.length === 0) {
      await accountStore.loadAccounts(true);
    }
    const firstAccount = accountStore.accounts[0];
    if (!firstAccount) throw new Error("喵... 找不到可用帳戶，請先新增帳戶喵！");

    // 🌟 2. 轉帳模式
    if (data.record_type === 'transfer' || data.type === 'transfer') {
      const fromName = data.from_account || data.account_from;
      const toName = data.to_account || data.account_to;

      const fromId = getAccountId(fromName) || firstAccount.account_id;
      const toId = getAccountId(toName) || (accountStore.accounts[1]?.account_id || fromId);
      const transferNote = (data.add_note === '領生活費' || !data.add_note) ? '一般轉帳' : data.add_note;

      const transferPayload = {
        transaction_date: todayStr,
        from_account_id: fromId,
        to_account_id: toId,
        transaction_note: transferNote,
        amount: parseFloat(data.add_amount || data.amount || 0)
      };

      await api.post('/transfers/', transferPayload);
    }
    // 🌟 3. 收支模式 (收入/支出)
    else {
      const accName = data.account_name || data.account;
      const finalAccountId = getAccountId(accName) || firstAccount.account_id;
      const isIncome = data.record_type === 'income' || data.add_type === true || data.type === 'income';
      
      const payload = {
        add_date: todayStr,
        add_amount: parseFloat(data.add_amount || data.amount || 0),
        add_type: isIncome,
        add_class: data.add_class || '其他',
        add_class_icon: getClassIcon(data.add_class),
        account_id: finalAccountId,
        add_member: data.add_member || '自己',
        add_tag: data.add_tag || '需要',
        add_note: data.add_note || data.note || 'AI記帳'
      };

      await api.post('/records/', payload);
    }

    // ✅ 4. 成功後，把這張卡片從陣列中刪除
    msg.action_data.splice(index, 1);

    // 如果陣列空了 (所有卡片都確認或取消完畢)，就關閉指令模式
    if (msg.action_data.length === 0) {
      msg.is_command = false;
      msg.text = `✅ 喵！已經幫小主人把所有帳都記好囉！`;
    }
    // 🌟 這裡最重要！一定要在 Post 成功後發射
    window.dispatchEvent(new CustomEvent('sync-money-data'));
    console.log("📢 廣播：同步訊號已發出！");

  } catch (error) {
    console.error("❌ 寫入失敗：", error);
    const errorMsg = error.response?.data?.detail?.[0]?.msg || error.message;
    alert(`⚠️ 記錄失敗：${errorMsg}`); // 單筆失敗跳通知就好，不要關閉卡片
  }
};

// ==========================================
// 🆕 取消單張卡片的按鈕邏輯
// ==========================================
const cancelRecord = (msgId, index) => {
  const msg = messages.value.find(m => m.id === msgId);
  if (!msg) return;

  // 移除被取消的卡片
  msg.action_data.splice(index, 1);

  // 如果全部都取消或處理完了，關閉指令模式
  if (msg.action_data.length === 0) {
    msg.is_command = false;
    msg.text = `❌ 喵～已經完成您的指示囉！小主人還有什麼要幫忙的嗎？`;
  }
};


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
    style.bottom = '10px';
    // 檢查視窗頂部是否會超出螢幕
    if (position.value.y - winH < padding) {
      // 如果會超出頂部，改為貼著螢幕頂部
      style.bottom = 'auto';
      style.top = `-${position.value.y - padding}px`;
    }
  } else {
    // 預計向下彈出
    style.top = '10px';
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

onMounted(async () => {
  // 🌟 確保元件掛載時立即同步帳戶資料
  await accountStore.loadAccounts();

  if (isOpen.value) checkAndGreet();

  window.addEventListener('resize', () => {
    position.value.x = Math.min(position.value.x, window.innerWidth - 100);
    position.value.y = Math.min(position.value.y, window.innerHeight - 100);
  });
});
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
                <div v-for="(actionItem, idx) in message.action_data" :key="idx" class="action-card" style="margin-bottom: 12px;">
                  <div class="card-header">
                    {{ actionItem.record_type === 'transfer' ? '🔄 轉帳確認' : '📝 收支確認' }}
                    <span style="font-size: 12px; color: #94a3b8; font-weight: normal; margin-left: auto;">({{ idx + 1 }}/{{ message.action_data.length }})</span>
                  </div>
                  
                  <div class="card-body">
                    <div class="data-row">
                      <span class="label">金額：</span>
                      <span class="value amount"
                        :style="{ color: actionItem.record_type === 'income' ? '#10b981' : (actionItem.record_type === 'expense' ? '#ef4444' : '#3b82f6') }">
                        {{ actionItem.record_type === 'income' ? '+' : (actionItem.record_type === 'expense' ? '-' : '') }} $ {{ actionItem.add_amount }}
                      </span>
                    </div>

                    <template v-if="actionItem.record_type !== 'transfer'">
                      <div class="data-row"><span class="label">類別：</span><span class="value">{{ actionItem.add_class }}</span></div>
                      <div class="data-row"><span class="label">項目：</span><span class="value">{{ actionItem.add_note }}</span></div>

                      <div class="data-row">
                        <span class="label">帳戶：</span>
                        <select v-model="actionItem.account_name" class="value ai-select">
                          <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">
                            {{ acc.itemName }}
                          </option>
                        </select>
                      </div>

                      <div class="data-row"><span class="label">標籤：</span><span class="value tag-text">{{ actionItem.add_member }} / {{ actionItem.add_tag }}</span></div>
                    </template>

                    <template v-else>
                      <div class="data-row">
                        <span class="label">轉出 (From)：</span>
                        <select v-model="actionItem.from_account" class="value ai-select">
                          <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">{{ acc.itemName }}</option>
                        </select>
                      </div>

                      <div class="data-row">
                        <span class="label">轉入 (To)：</span>
                        <select v-model="actionItem.to_account" class="value ai-select">
                          <option v-for="acc in accountStore.accounts" :key="acc.account_id" :value="acc.itemName">{{ acc.itemName }}</option>
                        </select>
                      </div>

                      <div class="data-row"><span class="label">備註：</span><span class="value">{{ actionItem.add_note }}</span></div>
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
          <input v-model="input" placeholder="輸入訊息..." @keyup.enter.prevent="handleSend" :disabled="isTyping" />
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
  user-select: none;
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
  flex: 1; /* 讓它填滿剩餘空間 */
  max-width: 140px; /* 避免選單太長破壞版面 */
}

.ai-select:focus {
  border-color: var(--color-primary);
}

</style>