/**
 * 獲取本地今天的日期字串 (YYYY-MM-DD)
 * 適用於：預設結束日期
 */
export const getLocalDate = () => {
    // 'sv-SE' 語系會強制輸出 YYYY-MM-DD 格式，且保持本地時區
    return new Intl.DateTimeFormat('sv-SE').format(new Date());
};

/**
 * 將指定的 Date 物件轉換為本地日期字串 (YYYY-MM-DD)
 * 適用於：計算月初、年初或特定偏移日期
 */
export const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};