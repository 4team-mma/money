/**
 * 財務計算工具類
 */

// 期間天數計算
export const calculatePeriodDays = (period, startDate, endDate) => {
    const now = new Date();
    // 取得本地今天的日期（去除時分秒，確保計算天數精確）
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (period === 'month') {
        // 邏輯：如果是當月，分母應為「今天」是幾號；如果是舊資料，才是當月總天數
        const start = new Date(startDate);
        if (start.getFullYear() === today.getFullYear() && start.getMonth() === today.getMonth()) {
            return today.getDate(); 
        }
        // 若非當月，回傳該月總天數
        return new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    }

    if (period === 'year') {
        const start = new Date(startDate);
        if (start.getFullYear() === today.getFullYear()) {
            // 計算今天是今年的第幾天
            const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
            return Math.floor((today - firstDayOfYear) / (1000 * 60 * 60 * 24)) + 1;
        }
        // 若非今年，判斷是否為閏年
        const year = start.getFullYear();
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 366 : 365;
    }

    if (period === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // 使用 Math.round 避免日光節約時間導致的小數點誤差
        const diffTime = Math.abs(end - start);
        return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    return 1;
};