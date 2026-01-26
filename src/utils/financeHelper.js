/**
 * 財務計算工具類
 */

// 1. 分類計算邏輯
// export const calculateCategoryData = (records, period, startDate, endDate) => {
//     const map = {};
//     let total = 0;

//     // 過濾出「支出」(add_type 為 false)
//     const expenses = records.filter(r => r.add_type === false || r.add_type === 0);

//     expenses.forEach(item => {
//         // 如果是自訂區間，進行日期比對
//         if (period === 'custom') {
//             const d = new Date(item.add_date);
//             const start = new Date(startDate);
//             const end = new Date(endDate);
//             end.setHours(23, 59, 59, 999);
//             if (d < start || d > end) return;
//         }

//         const catName = item.add_class || '未分類';
//         const amount = parseFloat(item.add_amount || 0);

//         if (!map[catName]) {
//             map[catName] = { category: catName, amount: 0 };
//         }
//         map[catName].amount += amount;
//         total += amount;
//     });

//     return Object.values(map)
//         .sort((a, b) => b.amount - a.amount)
//         .map((item, index) => ({
//             id: index + 1,
//             category: item.category,
//             amount: item.amount,
//             ratio: total ? (item.amount / total) * 100 : 0
//         }));
// };

// 2. 期間天數計算
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