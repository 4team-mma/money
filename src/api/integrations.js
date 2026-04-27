// integrations.js
import api from '@/api'

export const integrationApi = {
    /**
     * 🧠 STEP 1: 將圖片送往 AI 解析
     */
    analyze: (formData) => {
        return api.post('/integrations/calendar/analyze', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000
        })
    },

    /**
     * 📅 STEP 2: 將解析好的 events 陣列同步到 Google
     */
    sync: (data) => {
        return api.post('/integrations/calendar/sync', data)
    },

    /**
     * 📥 拉取 Google 日曆指定區間行程
     */
    getEvents: (token, timeMin, timeMax) => {
        return api.get('/integrations/calendar/events', {
            params: { google_token: token, time_min: timeMin, time_max: timeMax }
        })
    },

    /**
     * ✏️ 更新單一行程（同步至 Google Calendar）
     */
    updateEvent: (token, eventId, eventData) => {
        return api.put(
            `/integrations/calendar/events/${encodeURIComponent(eventId)}`,
            eventData,
            { params: { google_token: token } }
        )
    },

    /**
     * 🗑️ 刪除單一行程（同步至 Google Calendar）
     */
    deleteEvent: (token, eventId) => {
        return api.delete(
            `/integrations/calendar/events/${encodeURIComponent(eventId)}`,
            { params: { google_token: token } }
        )
    },

    /**
     * 🧹 批次刪除指定月份的 App 匯入行程
     * 只刪除有 app_source_id 標記的行程（即本 App 上傳的），手動建立的不受影響
     */
    deleteMonthEvents: (token, timeMin, timeMax) => {
        return api.delete('/integrations/calendar/events-by-month', {
            params: { google_token: token, time_min: timeMin, time_max: timeMax }
        })
    },

    /**
     * 🧹 開發專用：清理所有 App 匯入行程（不限月份）
     */
    cleanupTestEvents: (token) => {
        return api.delete(`/integrations/calendar/test-cleanup?google_token=${token}`)
    },
}