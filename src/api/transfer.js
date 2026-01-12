// src/api/transfer.js
import api from '@/api'

export const createTransfer = (data) => api.post('/transfers/', data)