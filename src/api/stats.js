// src/api/stats.js
import api from './interceptors'; 
//  直接引用 interceptors 避開循環引用

export const statsApi = {
    // 1. 支出分析 (已完成)
    getExpenseCategoryStats: (params) => api.get('/stats/expenses/category', { params }),

    // 2. 收入分析 (已完成)
    getIncomeCategoryStats: (params) => api.get('/stats/income/category', { params }),

    // 3. 收支趨勢 (隊友 B 負責)
    getCashFlowTrend: (params) => api.get('/stats/trends/cash-flow', { params }),

    // 4. 淨資產趨勢 (隊友 C 負責)
    getNetWorthTrend: (params) => api.get('/stats/trends/net-worth', { params }),
};