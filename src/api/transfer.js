// 這是個別命名匯出（Named Export）
import api from '@/api'

// 1. 新增轉帳
export const createTransfer = (data) => {
    return api.post('/transfers/', data);
}

// 2. 更新轉帳
export const updateTransfer = (id, data) => {
    // 這裡使用 patch 是因為後端 transfers.py 使用 @router.patch
    return api.patch(`/transfers/${id}`, data); 
}
//3.刪除
export const deleteTransfer = (id) => {
    
    return api.delete(`/transfers/${id}`); 
}

//4.讀取單筆
export const getTransfer = (id) => {
    
    return api.get(`/transfers/${id}`); 
}

// 5. 獲取轉帳清單 (用於查詢歷史紀錄)
export const getTransferList = (params) => {
    // params 可能包含日期區間、搜尋關鍵字等
    // params 會變成網址後的 ?key=value
    return api.get('/transfers/', { params }); 
}
