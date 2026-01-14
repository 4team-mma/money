import api from '@/api'

export const fetchMembers = () => api.get('/members')
export const deleteMember = (user_id) => api.delete(`/members/${user_id}`)
export const getProfile = () => api.get('/users/me')


