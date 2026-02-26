import api from '@/api'
// 這是物件匯出法

// 對應資料庫的 Adds 表
export const recordApi = {
    // 1. 新增記錄
    create: (data) => api.post('/records/', data),

    // 2. 獲取所有記錄 (支援分頁與搜尋，預設一頁 10 筆)
    getList: (params) => api.get('/records/', { params }),

    // 3. 獲取特定月份的「完整清單」與「統計總額」
    // 這個方法會對應到你的 get_monthly_records，回傳 monthly_income 等欄位
    getMonthly: (year, month) => api.get('/records/calendar/monthly', { 
        params: { year, month } 
    }),

    // 4. 獲取「當前月份」的簡單統計數據 (對應 get_monthly_stats)
    // 適合用在儀表板的小卡片，只回傳三個數字：收入、支出、結餘
    getCurrentStats: () => api.get('/records/stats/monthly'),

    // 5. 修改記錄 (用於編輯功能)
    update: (recordId, data) => api.patch(`/records/${recordId}`, data),

    // 6. 刪除記錄 (用於註銷功能)
    delete: (recordId) => api.delete(`/records/${recordId}`)
}

// 為了相容你目前的 useAddRecord.js，保留這個導出
export const createRecord = recordApi.create;

// 更新紀錄
export const updateRecord = (id, data) => {
    return recordApi.update(id, data)
}

export const getMonthlyRecords = recordApi.getMonthly;
export const getMonthlyStats = recordApi.getCurrentStats;


//下面附上引用到vue的範例:
// import { getMonthlyRecords } from '@/api/record'

// const loadStats = async () => {
//   const res = await getMonthlyRecords(2026, 2)
//   // 即使一頁只顯示 10 筆，這裡拿到的 income 也是整個月的總和！
//   const income = res.monthly_income 
//   const expense = res.monthly_expenses
// }