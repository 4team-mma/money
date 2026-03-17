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

/**
 * 將日期字串與時間字串 結合成 本地 Date 物件
 * 解決：Safari 解析 YYYY-MM-DD 失敗與時區偏移 8 小時的問題
 */
export const parseToLocalContact = (dateStr, timeStr = "00:00:00") => {
    if (!dateStr) return new Date();
    // 將 2023-10-01 轉為 2023/10/01 確保相容性
    const safeDateStr = dateStr.replace(/-/g, "/");
    return new Date(`${safeDateStr} ${timeStr}`);
};

/**
 * 比較時間 (忽略秒與毫秒，僅比對到分)
 * 判斷 target 是否在 start 與 end 之間 (左開右閉)
 */
export const isTimeInRange = (target, start, end) => {
    const t = new Date(target).setSeconds(0, 0);
    const s = new Date(start).setSeconds(0, 0);
    const e = new Date(end).setSeconds(0, 0);
    return t > s && t <= e;
};