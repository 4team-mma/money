# 前端日期處理技術規範
[回首頁](../README.md)<br>
這份說明文件旨在解釋為何在 2026 年開發時，必須捨棄傳統的 `toISOString()` ，並改用本地時間格式化方案。這對於確保財務統計報表（如：收支趨勢、類別分析）的準確性至關重要。    
編寫日期： 2026-01-26

## 核心問題：消失的 8 小時 (UTC 陷阱)
### 錯誤現象
當你在台灣的 2026 年 1 月 1 日 早上 7 點 (台北時間 GMT+8) 執行以下代碼：
```javascript
// 假設現在是 2026-01-01 07:00 AM (本地)
const date = new Date().toISOString().split('T')[0];
// 結果會得到 "2025-12-31" ❌
```

### 原因分析
- `new Date()` 抓到本地 2026-01-01 07:00。
- `.toISOString()` 會強制將時間轉為 UTC+0，時間變成 2025-12-31T23:00:00.000Z。
- `.split('T')[0]` 抓取前面字串，結果為 `"2025-12-31"`。
- 由於台灣比 UTC 快 8 小時，轉換後時間會倒退回前一天的下午，導致 API 抓到錯誤的日期區間，報表數據因此不準確，使用者明明在 2026 元旦記帳，你的 API 卻去抓了 2025 年的資料。

##  解決方案：本地化格式化函數
為了確保 API 參數永遠符合本地 2026 年的日期，我們統一使用 `getLocalDate` 或 `getLocalDateString`。
### 工具函數 `utils/dateHelper.js`
```javascript
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
```

### 函數對比與使用場景
|函數名稱|核心原理|最佳使用場景|優點|
|--|--|--|--|
|`getLocalDate`|使用瀏覽器內建的`Intl`格式化工具。|獲取「今天」。例如：初始化`endDate`。|代碼極簡，自動處理補零。|
|`getLocalDateString`|手動提取`Date`物件的年、月、日。|處理「特定日期」。例如：計算「當月 1 號」。	|靈活性高，可傳入任何`Date`物件。|

## 在 Vue 組件中的實作範例代碼
在 2026-01-26 這一天的實際應用邏輯如下：
```javascript
import { ref } from 'vue';
import { getLocalDate, getLocalDateString } from '@/utils/dateHelper';

const now = new Date();

// 1. 初始化結束日期 (今天：2026-01-26)
const endDate = ref(getLocalDate());

// 2. 初始化開始日期 (當月 1 號：2026-01-01)
// 這裡必須用 getLocalDateString，因為需要傳入一個「調整過」的 Date 物件
const startDate = ref(getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)));

// 3. 在 watch 邏輯中重置 (當年 1 號：2026-01-01)
const resetToYear = () => {
    startDate.value = `${new Date().getFullYear()}-01-01`; // 或是 getLocalDateString(new Date(now.getFullYear(), 0, 1))
    endDate.value = getLocalDate();
};
```

為什麼這比 `toISOString()` 好？
1. 時區安全：這兩個方法都直接讀取電腦本地時間（Local Time），不會像 `toISOString()` 那樣在凌晨時段減去 8 小時導致日期跳回 2025-12-31。
2. 易於維護：`sv-SE` (瑞典語系) 的日期格式固定為 `YYYY-MM-DD`，是目前 JS 最精簡的本地日期獲取技巧。
3. 效能穩定：不涉及複雜的時區庫（如 Moment.js 或 Day.js），適合輕量級的 2026 年 Web 專案。

## 後端配合要點 (FastAPI/Python)
前端發送 `2026-01-26` 字串後，後端應使用 `datetime.date` 接收：
1. 自動轉換：FastAPI 的 `Query(..., start_date: date)` 會自動將 ISO 字串轉為 Python date 物件。
2. 時區中性：資料庫欄位類型建議使用 `DATE` 而非 `DATETIME` ，可完全消除時區轉換的複雜性。

## 文件結語
本方案確保了系統在 2026 年及跨年期間，無論使用者何時開啟網頁，都能看到正確、一致的本地財務統計數據。