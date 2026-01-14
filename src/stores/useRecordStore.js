import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useRecordStore = defineStore('record', () => {
    const records = ref([])

    const fetchAllRecords = async () => {
        try {
            // 調用 API
            const res = await api.get('/records/', { params: { page_size: 1000 } })
            
            // 🔍 除錯監控：res 現在就是後端傳回的 JSON 物件
            console.log('API 回傳內容:', res)

            // 修正點：根據你的 Log 顯示，資料就在 res.data 裡
            if (res && res.success && Array.isArray(res.data)) {
                records.value = res.data
        
            } else {
                console.error('❌ 資料解析失敗：res.data 不是陣列或 res.success 不為 true')
            }
        } catch (error) {
            console.error('❌ 請求發生錯誤:', error)
        }
    }

    return { records, fetchAllRecords }
})