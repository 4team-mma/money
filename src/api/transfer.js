// src/api/transfer.js
import api from '@/api'

// 對應資料庫的 Transactions 表
export const createTransfer = (data) => {
    return api.post('/transfers/', data);
}