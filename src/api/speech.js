// src/api/speech.js
import api from '@/api';

// 🌟 加回狀態查詢，網址對齊我們已經測試成功的 toggle
export const getAiCorrectionStatus = () => {
    return api.get('/v1/ai/correct/status'); 
}

// 1. 開關 AI 糾錯引擎
export const toggleAiCorrectionModel = (enable) => {
    // 🌟 補上 /ai，完整路徑會變成baseURL的 /api + /ai/correct/toggle
    return api.post('/v1/ai/correct/toggle', { enable }, { timeout: 30000 });
}

// 2. 送出語音草稿進行修正
export const processSpeechCorrection = (raw_text) => {
    return api.post('/v1/ai/correct/process', { raw_text }, { timeout: 15000 });
}