import api from './interceptors'; 
//  直接引用 interceptors 避開循環引用

export const robotApi = {
    // 1. 取得 AI 設定 (GET)
    getAiRobotConfig: () => api.get('/ai_models/config'),

    // 儲存 AI 設定 (讓 AdminModel.vue 使用)
    saveAiRobotConfig: (data) => api.post('/ai_models/config', data),

    // 2. AI 對話測試 (POST) - 並傳遞 data
    postAiRobotChat: (data) => api.post('/ai_models/chat', data),

};