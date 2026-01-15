import api from '@/api'

// 對應資料庫的 Adds 表
export const recordApi = {
    // 1. 新增記錄 (你目前用的)
    create: (data) => api.post('/records/', data),

    // 2. 獲取所有記錄 (用於歷史清單頁面)
    getList: (params) => api.get('/records/', { params }),

    // 3. 獲取單筆詳細資料 (用於查看詳情)
    getDetail: (recordId) => api.get(`/records/${recordId}`),

    // 4. 修改記錄 (用於編輯功能)
    update: (recordId, data) => api.put(`/records/${recordId}`, data),

    // 5. 刪除記錄 (用於註銷功能)
    delete: (recordId) => api.delete(`/records/${recordId}`)
}

// 為了相容你目前的 useAddRecord.js，保留這個導出
export const createRecord = recordApi.create;


// 🌟 請補上這段：更新紀錄
export const updateRecord = (id, data) => {
    return axios.put(`/records/${id}`, data)
}