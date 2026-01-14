// src/api/analysis.js
import api from '@/api';

// 取得 CPI 比較數據
// params 會包含 { year: 2025, month: 10 }
export const getCpiComparison = (params) => {
    return api.get('/analysis/cpi-comparison', { params });
};