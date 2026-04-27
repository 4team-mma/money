// useRecordStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const useRecordStore = defineStore('record', () => {
    const records = ref([])
    const isLoaded = ref(false) // 標記位：紀錄是否已經從 API 抓過資料

    /**
     * 同時提供舊名稱與新功能，避免 ChartPreface.vue 報錯
     * @param {Boolean} forceRefresh - 是否強制重新抓取 (忽略快取)
     */
    const fetchAllRecords = async (filterParams = {}, forceRefresh = false) => {
        // 🛡️ 避免重複初始化：如果已經載入過且不要求強制刷新，則直接返回
        if (isLoaded.value && !forceRefresh) {
            return;
        }

        try {
            // 預設抓取 500 筆，確保分析圖表有足夠資料
            const res = await api.get('/records/', { 
                params: { ...filterParams, page_size: 500 } 
            })
            
            if (res && res.success && Array.isArray(res.data)) {
                records.value = res.data
            }
            isLoaded.value = true; // ✅ 標記為已載入
        } catch (error) {
            console.error('🍍 抓取紀錄失敗:', error)
            // 失敗時不標記為已載入，讓下次進入頁面能重試
            isLoaded.value = false;
        }
    }

    // 別名，方便開發理解
    const fetchRecords = fetchAllRecords 

    /**
     * 手動清除快取 (例如登出或需要手動同步時)
     */
    const clearRecords = () => {
        records.value = [];
        isLoaded.value = false;
    }

    return { records, isLoaded, fetchAllRecords, fetchRecords, clearRecords }
})