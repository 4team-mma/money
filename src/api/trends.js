import api from '@/api'

// 這裡必須寫 export，別人才 import 得到
export const getNetWorthHistory = (userId) => {
    return api.get(`/trends/net-worth-history?user_id=${userId}`)
}