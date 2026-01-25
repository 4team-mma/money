// src/api/setting.js
import api from './interceptors';

export const settingApi = {
/**
     * 導出報表 API
     * @param {string} type - report_type (monthly/yearly/quarterly)
     * @param {string} format - report_format (excel/pdf/csv)
     * @param {string} timeRange -  確保這裡叫 timeRange
     */
    exportReport: (type, format, timeRange) => {
        return api.get('/setting/setting_export/report', {
            params: { 
                report_type: type,
                report_format: format,
                time_range: timeRange
            },
            responseType: 'blob' //  必填，否則二進位檔案會損毀
        });
    }
};

 // 告訴 Axios 這是要下載檔案用的
 // Axios 預設會把後端傳回的東西當作 字串 (String) 或 JSON 來解析。
            // Blob (Binary Large Object)：代表「大型二進位物件」
            // Axios 會嘗試把 Excel 的二進位碼轉成亂碼字串，妳下載後的檔案就會報錯「格式損壞」。設定為 blob 是告訴瀏覽器：「這是一坨原始數據，請原封不動交給我」