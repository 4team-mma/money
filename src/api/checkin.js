import api from '@/api'; // 引用你們專案共用的 axios 實例

export const checkinApi = {
    // 取得當前狀態
    getStatus: () => api.get('/game/checkin/status'),
    
    // 執行打卡動作
    performAction: () => api.post('/game/checkin/action')
};