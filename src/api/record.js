import api from '@/api'

// 對應資料庫的 Adds 表
export const recordApi = {
  // 1. 新增記錄
  create: (data) => api.post('/records/', data),
  
  // 2. 獲取所有記錄 (支援分頁與搜尋，預設一頁 10 筆)
  getList: (params) => api.get('/records/', { params }),
  
  // 3. 獲取特定月份的「完整清單」與「統計總額」
  getMonthly: (year, month) => api.get('/records/calendar/monthly', { 
    params: { year, month } 
  }),

  // 4. 獲取「當前月份」的簡單統計數據
  getCurrentStats: () => api.get('/records/stats/monthly'),

  // 5. 修改記錄 (用於編輯功能)
  update: (recordId, data) => api.patch(`/records/${recordId}`, data),

  // 6. 刪除記錄 (用於註銷功能)
  delete: (recordId) => api.delete(`/records/${recordId}`),

  // ── AI 辨識相關 ──
  parseReceipt: (formData) => {
    return api.post("/records/ai-parse", formData, {
      // ⚠️ 關鍵：給地端視覺模型充足的思考時間，設為 100 秒
      timeout: 100000 
    });
  },

  confirmOrder: (data) => {
    return api.post("/records/ai-confirm", data);
  }, // 👈 關鍵在這裡：這組大括號結束後，必須加上逗號，才能繼續接下一個屬性！

  // ── 歷史訂單相關 (你新增的) ──
  getOrderList: (params) => api.get('/records/orders', { params }),
  getOrderItems: (recordId) => api.get(`/records/${recordId}/items`)
}

// 為了相容你目前的 useAddRecord.js，保留這些單獨導出
export const createRecord = recordApi.create;

export const updateRecord = (id, data) => {
  return recordApi.update(id, data)
}

export const getMonthlyRecords = recordApi.getMonthly;
export const getMonthlyStats = recordApi.getCurrentStats;