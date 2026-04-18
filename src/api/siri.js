// src/api/siri.js

import api from '@/api'; // 引用你的 index.js (已包含攔截器)
export const siriApi = {
  // 取得 Siri 通知
  getNotifications(userId) {
    return api({
      url: `/api/v1/ai/siri_voice/notifications`,
      method: 'get',
      params: { user_id: userId }
    })
  }
}