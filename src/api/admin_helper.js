// src/api/admin_helper.js
// 🌟 直接引入 index.js (預設會抓資料夾下的 index.js)，取得完全體 axios
import request from '@/api';

export const generateDevCode = (data) => {
  return request({
    url: '/admin_helper/generate', 
    method: 'post',
    data: data,
    // 🌟 關鍵新增：覆蓋原本的 30 秒，針對 AI 生成放寬到 120 秒 (120000 毫秒)
    // 這跟你在後端 ollama_service.py 設定的 timeout=120.0 剛好對齊！
    timeout: 120000 
  })
}