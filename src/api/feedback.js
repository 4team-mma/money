
import api from '@/api';
export const submitFeedbackApi = (feedbackData) => {

  // 💡 這裡現在是 service.post 了，不會再報 ReferenceError

    return api.post('/feedback/', feedbackData);

};