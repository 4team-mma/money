import api from '@/api'

export const fetchMembers = () => api.get('/members')
export const deleteMember = (user_id) => api.delete(`/members/${user_id}`)
export const getProfile = () => api.get('/users/me')

// 變更密碼
export const changePassword = (data) => api.put('/users/me/password', data)

// 刪除自己的帳號
export const deleteMe = () => api.delete('/users/me')
