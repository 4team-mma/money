// src/api/robot.js
import api from '@/api'; // 引用你的 index.js (已包含攔截器)

// 1. 取得 AI 設定
// 對應後端: GET /api/ai_models/config
export const getAiRobotConfig = (provider = null) => {
  // 你的後端支援 Query Parameter: ?provider=gemini
  const url = provider ? `/ai_models/config?provider=${provider}` : "/ai_models/config";
  return api.get(url);
};

// 2. 儲存 AI 設定
// 對應後端: POST /api/ai_models/save
// 對應 Schema: AIConfigSave (JSON)
export const saveAiRobotConfig = (data) => {
  return api.post("/ai_models/save", data);
};

// 3. 與 AI 對話 (最關鍵的部分)
// 對應後端: POST /api/ai_models/chat
// 對應 Schema: ChatRequest
export const postAiRobotChat = (data) => {
  return api.post("/ai_models/chat", data, {
    // ⚠️ 關鍵：這裡必須覆蓋全域的 10秒 設定，改成 120秒
    // 因為 AI 生成很慢，不加這個會導致前端報錯 "timeout of 10000ms exceeded"
    timeout: 120000 
  });
};