import axios from '@/utils/axios'

export const fetchMembers = () => axios.get('/members')
export const deleteMember = (user_id) => axios.delete(`/members/${user_id}`)
