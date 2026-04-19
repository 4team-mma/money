// src/composables/aiCat/useMeowChat.js
import { ref, watch, nextTick } from "vue";
import { postAiRobotChat, postAiFeedback } from "@/api/robot";
import { processSpeechCorrection } from "@/api/speech";
import { useAccountStore } from "@/stores/useAccountStore";

// 🌟 打招呼配置 (維持妳的優化版)
const greetingsMap = {
  '/Book': '準備好翻閱帳本了嗎喵？🗓️',
  '/dashboard': '來看看今天的財務體質吧喵！📊',
  '/Account': '這裡可以管理妳的錢包喵！⛺',
  '/BudgetManager': '目標是存到好多罐罐喵！🐱',
  '/Add': '今天花了什麼趕快跟我說喵！➕',
  '/Chart': '讓喵喵幫妳分析趨勢喵！📈',
  '/ConsumerAnalysis': '妳最近好像買了不少東西喔喵？⛽',
  '/SalaryAnalysis': '看到薪水漲了喵喵最開心喵！💵',
  '/Achievements': '哇！妳解鎖了好多成就喵！🏆',
  '/Feedback': '有什麼想對喵喵說的嗎喵？❓',
  '/Notifications': '有重要的訊息要看喔喵！🔔',
  '/Settings': '調整成妳最喜歡的喵喵吧喵！⚙️'
};
const greetedPaths = ref(new Set());

export function useMeowChat(paintCanvasRef, inputAreaRef, messagesRef) {
  const accountStore = useAccountStore();

  // --- 狀態定義 ---
  const isOpen = ref(localStorage.getItem("isMeowChatOpen") === "true");
  const messages = ref(JSON.parse(localStorage.getItem("meowChatHistory")) || [
    { id: 1, text: "嗨！我是 Money 喵喵小助手 💰", sender: "bot", timestamp: new Date().toISOString() }
  ]);
  const isTyping = ref(false);
  const loadingText = ref("思考中喵...");
  let loadingInterval = null;
  const waitingJokes = ["喵喵正在翻閱帳本... 📖", "正在計算罐罐的匯率... 🐟", "數據量大，努力消化中... 🐾"];
  const selectedPersona = ref(localStorage.getItem("meowPersona") || "cute");

  const personasList = [
    { value: 'cute', label: '😽 可愛喵喵' }, { value: 'gentle', label: '🐈 溫柔管家喵' },
    { value: 'professional', label: '🦁 嚴肅顧問' }, { value: 'tsundere', label: '😼 傲嬌喵' },
    { value: 'lazy', label: '😿 厭世喵' }, { value: 'rich', label: '💰 土豪喵' }
  ];

  // --- 工具函數 ---
  const scrollToBottom = () => {
    nextTick(() => {
      if (messagesRef.value) messagesRef.value.scrollToBottom();
    });
  };

  // 🌟 打招呼功能 (維持妳的 5 秒自動刪除)
  const checkAndGreet = (currentPath) => {
    if (greetedPaths.value.has(currentPath)) return;
    const customText = greetingsMap[currentPath];
    if (!customText) return;

    greetedPaths.value.add(currentPath);
    const greetId = Date.now();

    messages.value.push({
      id: greetId, text: customText, sender: 'bot',
      timestamp: new Date().toISOString(), is_greeting: true
    });
    scrollToBottom();

    setTimeout(() => {
      messages.value = messages.value.filter(m => m.id !== greetId);
    }, 5000);
  };

  // 🌟 新增：專家建議選單
  const showAdvisorMenu = () => {
    messages.value.push({
      id: Date.now(), text: '喵！請選擇你想進行的財務分析：', sender: 'bot', timestamp: new Date().toISOString(),
      quick_replies: ['📈 幫我查一下最近物價是不是變貴了？', '💼 請幫我比對目前的薪資競爭力']
    });
    scrollToBottom();
  };

  // 🌟 新增：知識庫選單
  const showKnowledgeMenu = () => {
    messages.value.push({
      id: Date.now(), text: '想了解什麼理財知識呢喵？可以直接點擊，或輸入你想問的名詞：', sender: 'bot', timestamp: new Date().toISOString(),
      quick_replies: ['📖 什麼是 CPI (消費者物價指數)？', '🏦 ETF 是什麼？新手適合買嗎？', '💰 什麼是 50/30/20 理財法則？']
    });
    scrollToBottom();
  };

  const clearChat = () => {
    if (confirm('喵？確定要清空嗎？')) {
      messages.value = [{ id: Date.now(), text: '紀錄已清空喵！', sender: 'bot', timestamp: new Date().toISOString() }];
      setTimeout(() => {
        messages.value = [{ id: Date.now(), text: '嗨！我是 喵喵小助手 💰 有什麼能幫你的嗎喵？', sender: 'bot', timestamp: new Date().toISOString() }];
      }, 3000);
    }
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
      } catch (e) { console.error(e); }
    }
  };

  // 🌟 核心對話請求
  const handleChatRequest = async ({ query, wasSpoken }) => {
    if (isTyping.value) return;

    const now = new Date();
    const exactTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const userMsgId = Date.now();
    messages.value.push({ id: userMsgId, text: query, sender: 'user', timestamp: new Date().toISOString() });

    if (paintCanvasRef.value) paintCanvasRef.value.clearCanvas();
    isTyping.value = true;
    scrollToBottom();

    loadingInterval = setInterval(() => { 
      loadingText.value = waitingJokes[Math.floor(Math.random() * waitingJokes.length)]; 
    }, 1500);

    let finalQuery = query;

    // 🎤 語音修正邏輯
    if (wasSpoken) {
      loadingText.value = "啟動 RTX 4060 Ti 糾錯中喵... 🐾";
      try {
        const correctRes = await processSpeechCorrection(query);
        const responseData = correctRes?.data || correctRes;
        if (responseData?.corrected_text && responseData.corrected_text !== query) {
          finalQuery = responseData.corrected_text;
          const msgIndex = messages.value.findIndex(m => m.id === userMsgId);
          if (msgIndex !== -1) messages.value[msgIndex].text = `🎤 原始：${query}\n✨ 修正：${finalQuery}`;
        }
      } catch (err) { console.warn(err); } 
      finally { loadingText.value = waitingJokes[0]; }
    }

    try {
      const historyText = messages.value.slice(-5, -1)
        .map(m => `${m.sender === 'user' ? '小主人' : '喵喵'}：${m.text.substring(0, 30)}`)
        .join('\n');
      const finalPrompt = `[台北時間 ${exactTime}]\n${historyText}\n小主人：${finalQuery}`;

      const rawRes = await postAiRobotChat({ message: finalPrompt, persona: selectedPersona.value });
      const response = rawRes?.data || rawRes || {};

      if (!response.reply) throw new Error("AI empty");

      let actionData = null;
      if (Array.isArray(response.action_data)) actionData = response.action_data;
      else if (response.action_data) actionData = [response.action_data];

      // 🌟 同步強化：如果是指令，且帳戶列表為空，強制更新
      if (response.is_command && accountStore.accounts.length === 0) {
        await accountStore.loadAccounts(true);
      }

      messages.value.push({
        id: Date.now() + 1, text: response.reply, sender: 'bot',
        timestamp: new Date().toISOString(), duration: response.duration,
        provider: response.provider, is_command: response.is_command,
        action_data: actionData, intent: response.intent,
        confidence: response.confidence
      });

    } catch (error) {
      messages.value.push({
        id: Date.now() + 1, text: "喵... 我斷線了喵！請檢查後端連線！",
        sender: 'bot', timestamp: new Date().toISOString()
      });
    } finally {
      isTyping.value = false;
      if (loadingInterval) clearInterval(loadingInterval);
      scrollToBottom();
      
      // 🌟 補回：AI 說完後自動聚焦輸入框
      await nextTick();
      if (inputAreaRef.value && inputAreaRef.value.focusInput) {
        inputAreaRef.value.focusInput();
      }
    }
  };

  // 持久化監聽
  watch(isOpen, (newVal) => localStorage.setItem('isMeowChatOpen', newVal));
  watch(messages, (newVal) => localStorage.setItem('meowChatHistory', JSON.stringify(newVal)), { deep: true });
  watch(selectedPersona, (newVal) => localStorage.setItem('meowPersona', newVal));

  return {
    isOpen, messages, isTyping, loadingText, selectedPersona, personasList,
    checkAndGreet, showAdvisorMenu, showKnowledgeMenu, // 🌟 新增導出
    scrollToBottom, clearChat, handleFeedback, handleChatRequest
  };
}