import api from '@/api' // 確保這裡導入的是你封裝好的 axios 實例

export const integrationApi = {
  /**
   * 🧠 STEP 1: 將圖片送往 AI 解析
   * 因為有 File 物件，必須使用 FormData，axios 會自動處理邊界(Boundary)
   */
  analyze: (formData) => {
    return api.post('/integrations/calendar/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000 // 🌟 延長到 120 秒 (2分鐘)
    });
  },

  /**
   * 📅 STEP 2: 將解析好的 events 陣列同步到 Google
   * 後端改用 Body 接收，所以這裡直接傳物件 (Object)
   */
  sync: (data) => {
    // data 應該長這樣：{ events: [...], google_token: '...' }
    return api.post('/integrations/calendar/sync', data);
  },
  // 🌟 新增這一段：抓取 Google 日曆內容
getEvents: (token, timeMin, timeMax) => {
  return api.get('/integrations/calendar/events', {
    params: {
      google_token: token,
      time_min: timeMin,
      time_max: timeMax
    }
  });
},
// ... 其他 API
  cleanupTestEvents: (token) => {
    return api.delete(`/integrations/calendar/test-cleanup?google_token=${token}`);
  }


};

