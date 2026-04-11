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

// 🌟 關鍵新增：專門處理「打字機串流」的封裝函式
// onChunk 是一個回呼函式，用來把接收到的字傳回給 Vue
export const generateDevCodeStream = async (data, token, onChunk) => {
  const response = await fetch('/api/admin_helper/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    throw new Error(`伺服器發生錯誤 (狀態碼: ${response.status})`)
  }

  // 開啟串流閱讀器
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')

  // 不斷讀取資料，直到結束
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    
    // 將解碼後的文字，透過回呼函式傳回給 Vue
    onChunk(decoder.decode(value, { stream: true }))
  }
}