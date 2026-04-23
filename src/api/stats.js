// src/api/stats.js
import api from './interceptors'; 
//  直接引用 interceptors 避開循環引用

export const statsApi = {

    // 
    getExpenseCategoryStats: (params) =>
        api.get('/stats/expenses/category', { params }),

    // 🔥 新增這個（重點）
    getExpenseCategoryStatsWithItems: (params) =>
        api.get('/stats/expenses/category-with-items', { params }),

    getIncomeCategoryStats: (params) =>
        api.get('/stats/income/category', { params }),

    getCashFlowTrend: (params) =>
        api.get('/stats/trends/cash-flow', { params }),

    getNetWorthTrend: (params) =>
        api.get('/stats/trends/net-worth-history', { params }),
};

