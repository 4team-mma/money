// src/api/transfer.js
import api from '@/api'

// 1. 新增轉帳
export const createTransfer = (data) => {
    return api.post('/transfers/', data);
}

// 2. 更新轉帳 (這裡的名字一定要叫 updateTransfer)
export const updateTransfer = (id, data) => {
    return api.put(`/transfers/${id}`, data); // 記得用 api 而不是 axios
}