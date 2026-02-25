
import api from '@/api';

// 1. [一般用戶] 提交新的意見回饋
export const submitFeedbackApi = (feedbackData) => {
    return api.post('/feedback/', feedbackData);
};

// 2. [管理者] 取得系統所有使用者的回饋
export const getAllFeedbacksApi = () => {
    return api.get('/feedback/all');
};

// 3. [管理者] 更新回饋處理狀態 (對應下拉選單)
// feedbackId: 回饋的 ID
// updateData: 包含 { is_replied: 0|1|2, admin_answer: "..." } 的物件
export const updateFeedbackStatusApi = (feedbackId, updateData) => {
    return api.patch(`/feedback/${feedbackId}`, updateData);
};

// 4. [一般用戶] 取得個人提交歷史
export const getFeedbackHistoryApi = () => {
    return api.get('/feedback/my');
};