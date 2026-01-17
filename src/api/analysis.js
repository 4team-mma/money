// src/api/analysis.js
import api from '@/api';

// export const 是給「電腦」看的命令
// @param 是給「開發者（也就是您和您的隊友）」看的說明書


//JSDoc 必須包在「雙星號」的註解區塊內,例如@param 
//@param功用:懸停提示 (Hover)：當您在別的檔案（如 .vue）使用這個函式時，把滑鼠移到函式名稱 getSalaryComparison 上面，就會彈出小視窗。

/**
 * 1. 取得消費 CPI 比較數據
 * @param {Object} params - { year: '2025', month: '10' }
 */
export const getCpiComparison = (params) => {
    return api.get('/analysis/cpi-comparison', { params });
};

/**
 * 2. 取得薪資行情比對數據 (與同行平均比較)
 * @param {Object} params - { year: '2025', month: '10' }
 */
export const getSalaryComparison = (params) => {
    return api.get('/analysis/salary-comparison', { params });
};

/**
 * 3. 取得 12 個月實質薪資趨勢 (用於繪製趨勢圖)
 * @param {Object} params - { industry: '教育業' }
 */
export const getRealSalaryTrend = (params) => {
    return api.get('/analysis/real-salary-trend', { params });
};