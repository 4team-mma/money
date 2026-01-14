import api from '@/api'

export const fetchMembers = () => api.get('/members')
export const deleteMember = (user_id) => api.delete(`/members/${user_id}`)
export const submitFeedbackApi = (feedbackData) => {

 // 💡 這裡現在是 service.post 了，不會再報 ReferenceError

return api.post('/feedback/', feedbackData);

};