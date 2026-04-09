import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCalendarStore = defineStore('calendar', () => {
    // 存放從 Google 抓回來的行程
    const googleEvents = ref([])

    // 設定行程（並存入本地，防止重整消失）
    const setGoogleEvents = (events) => {
        const formatted = events.map(e => {
        // 🌟 重新解析時間，確保顯示格式為 HH:mm
        const startTime = e.start?.dateTime?.substring(11, 16) || "09:00";
        const endTime = e.end?.dateTime?.substring(11, 16) || "12:00";
        
        return {
            ...e,
            add_id: e.id || Math.random().toString(36).substr(2, 9),
            add_date: e.start.dateTime.substring(0, 10),
            add_type: 'event', // 關鍵：這是拆分邏輯的依據
            
            // 🌟 這裡決定列表顯示什麼
            add_class: e.summary,            // 顯示：LLM
            add_note: `${startTime} ~ ${endTime}`, // 顯示：09:00 ~ 12:00
            
            add_class_icon: '🗓️',
            add_amount: 0,
            currency: ''
        }
        });
        googleEvents.value = formatted
        // 同步存到 localStorage
        localStorage.setItem('cached_google_events', JSON.stringify(formatted))
    }

    // 初始化：從本地讀回資料
    const initStore = () => {
        const saved = localStorage.getItem('cached_google_events')
        if (saved) {
            googleEvents.value = JSON.parse(saved)
        }
    }

    return {
        googleEvents,
        setGoogleEvents,
        initStore
    }
})