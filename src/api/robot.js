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
    timeout: 30000
  });
};



/**
 * 4. 邱比特大腦：A/B 意圖測試對比
 * 對應後端: POST /api/ai_test/compare
 * @param {string} message - 測試語句
 */
// 1. 手動對比
export const compareAiIntents = (message) => {
  // 必須包含 v1/ai 這兩層父路徑
  return api.post("/v1/ai/ai_test/compare", { message }); 
};

// 2. 批次測試
export const runAiBatchTest = () => {
  return api.post("/v1/ai/ai_test/batch_run", undefined, {
    // ⚠️ 關鍵：覆蓋全域的 10秒 設定，改成 120秒 (兩分鐘)
    // 批次測試 32 題需要時間，讓前端耐心等候！
    timeout: 120000 
  });
};

// 3. 上傳 Excel
export const uploadAiTestExcel = (formData) => {
  return api.post("/v1/ai/ai_test/upload_test_file", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 4. 清除暫存
export const clearAiTestFile = () => {
  return api.delete("/v1/ai/ai_test/clear_test_file");
};

/**
 * 5. (選填) 更新審核結果
 * 如果你在測試頁面發現 AI 錯了，可以直接修正它
 */
export const updateCorrectedIntent = (reviewId, correctedIntent) => {
  return api.put(`/v1/ai/ai_test/logs/${reviewId}`, { corrected_intent: correctedIntent });
};

// 🌟 新增：用戶主動反饋 (倒讚)
export const postAiFeedback = (data) => {
  return api.post("/v1/ai/ai_test/feedback", data);
};

// 🌟 新增：刪除單筆審核紀錄
export const deleteAiReviewLog = (reviewId) => {
  return api.delete(`/v1/ai/ai_test/logs/${reviewId}`);
};

// 🌟 新增：一鍵清空所有未審核紀錄
export const clearAllPendingAiLogs = () => {
  return api.delete("/v1/ai/ai_test/logs/clear_all_pending");
};