import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useRecordStore = defineStore('record', () => {
    const records = ref([])

// 🌟 同時提供舊名稱與新功能，避免 ChartPreface.vue 報錯
    const fetchAllRecords = async (filterParams = {}) => {
        try {
            // 預設抓取 500 筆，確保分析圖表有足夠資料
            const res = await api.get('/records/', { 
                params: { ...filterParams, page_size: 500 } 
            })
            
            if (res && res.success && Array.isArray(res.data)) {
                records.value = res.data
            }
        } catch (error) {
            console.error('🍍 抓取紀錄失敗:', error)
        }
    }

    // 別名，方便開發理解
    const fetchRecords = fetchAllRecords 

    return { records, fetchAllRecords, fetchRecords }
})