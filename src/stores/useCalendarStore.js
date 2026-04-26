// useCalendarStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCalendarStore = defineStore('calendar', () => {

    const googleEvents = ref([])
    // ✅ Token 存記憶體，不存 localStorage（安全考量，過期就過期）
    const googleToken = ref('')

    // ✅ 核心修正：用 user_id 隔離不同帳號的資料
    const getStorageKey = () => {
        try {
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
            const userId = currentUser?.user_id || localStorage.getItem('user_id') || 'anonymous'
            return `cached_google_events_${userId}`
        } catch {
            return 'cached_google_events_anonymous'
        }
    }

    // Token 管理（由 BookCalendarSection 在取得授權後呼叫）
    const setGoogleToken = (token) => {
    googleToken.value = token
    sessionStorage.setItem('google_calendar_token', token) // ← 新增
}

    const clearGoogleToken = () => {
    googleToken.value = ''
    sessionStorage.removeItem('google_calendar_token') // ← 新增
}

    // 存入並格式化行程
    const setGoogleEvents = (events) => {
    const formatted = events.map(e => {
        const startDT = e.start?.dateTime || ''
        const endDT = e.end?.dateTime || ''
        const startTime = startDT.substring(11, 16) || '09:00'
        const endTime = endDT.substring(11, 16) || '12:00'

        // ✅ 如果已經是格式化的行程（有 add_date），直接用，不重新解析
        if (e.add_type === 'event' && e.add_date && !e.start?.dateTime) {
            return {
                ...e,
                start_datetime: e.start_datetime || '',
                end_datetime: e.end_datetime || '',
            }
        }

        return {
            _raw_id: e.id,
            add_id: e.id || e.add_id || `local_${Math.random().toString(36).substr(2, 9)}`,
            add_date: startDT.substring(0, 10) || e.start?.date || e.add_date || '',
            add_type: 'event',
            add_class: e.summary || e.add_class || '未命名行程',
            add_note: `${startTime} ~ ${endTime}`,
            add_class_icon: '🗓️',
            add_amount: 0,
            currency: '',
            start_datetime: startDT,
            end_datetime: endDT,
        }
    })
    googleEvents.value = formatted
    localStorage.setItem(getStorageKey(), JSON.stringify(formatted))
}

    // initStore 裡也補上讀取
const initStore = () => {
    const saved = localStorage.getItem(getStorageKey())
    if (saved) {
        try { googleEvents.value = JSON.parse(saved) } catch { googleEvents.value = [] }
    }
    // ← 新增：恢復 token（同一個 session 內有效）
    const savedToken = sessionStorage.getItem('google_calendar_token')
    console.log('🔑 [Store] 從 sessionStorage 恢復 token:', savedToken ? '有值' : '空的')
    if (savedToken) googleToken.value = savedToken
}

    // 刪除單一行程（本地同步）
    const removeEvent = (eventId) => {
        googleEvents.value = googleEvents.value.filter(e => e.add_id !== eventId)
        localStorage.setItem(getStorageKey(), JSON.stringify(googleEvents.value))
    }

    // 更新單一行程（本地同步）
    const updateEvent = (eventId, updatedData) => {
        const idx = googleEvents.value.findIndex(e => e.add_id === eventId)
        if (idx !== -1) {
            googleEvents.value[idx] = { ...googleEvents.value[idx], ...updatedData }
            localStorage.setItem(getStorageKey(), JSON.stringify(googleEvents.value))
        }
    }

    // 清空指定月份行程（本地）
    const clearMonthEvents = (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`
        googleEvents.value = googleEvents.value.filter(e => !e.add_date.startsWith(prefix))
        localStorage.setItem(getStorageKey(), JSON.stringify(googleEvents.value))
    }

    // 清空所有行程（登出時呼叫）
    const clearAllEvents = () => {
        googleEvents.value = []
        localStorage.removeItem(getStorageKey())
    }

    return {
        googleEvents,
        googleToken,
        setGoogleToken,
        clearGoogleToken,
        setGoogleEvents,
        initStore,
        removeEvent,
        updateEvent,
        clearMonthEvents,
        clearAllEvents,
    }
})