import api from './interceptors'; 
// GET /config: 負責「讀取」目前庫存的設定（不含金鑰）。
// POST /save: 負責「加密」並「寫入」新設定。
// POST /chat: 負責「解密」並「發送」訊息給 AI 大腦。
export const robotApi = {
    // 1. 取得 AI 設定 (GET) - 對應 @router.get("/config")
    getAiRobotConfig: () => api.get('/ai_models/config'),

    // 2. 儲存 AI 設定 (POST) - 改為對應 @router.post("/save")
    // 這樣後端邏輯才不會跟 GET 路徑搞混，且符合我給你的後端程式碼
    saveAiRobotConfig: (data) => api.post('/ai_models/save', data),

    // 3. AI 對話測試 (POST) - 對應 @router.post("/chat")
    postAiRobotChat: (data) => api.post('/ai_models/chat', data),
};