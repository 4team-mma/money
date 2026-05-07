<!-- Add.vue -->
<script setup>
import Add_bar from '@/components/AddBar.vue'
import Add_cato from '@/components/AddCato.vue'
import Add_account from '@/components/AddAccount.vue'
import Add_member from '@/components/AddMember.vue'
import Add_tag from '@/components/AddTag.vue'
import { useAddRecord } from '@/composables/useAddRecord'
import { useAccountStore } from '@/stores/useAccountStore'
import { onMounted, computed, ref } from 'vue';

// 月曆與通知套件
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';



// 🌟 1. 修正順序：先定義 Store，這樣下面的 computed 才能用
const accountStore = useAccountStore()

// 調用 Composable
const {
    form, handleCatoUpdate, handleAccountUpdate,
    handleMemberUpdate, handleTagUpdate, handleSave,
    handleSaveNext, 
} = useAddRecord(false)


//引用餘額近來(錢多的=轉入帳戶)
const now_money = computed(()=>{
    return accountStore.formatAccountBalance(form.account)
})

// 修改 Add.vue 的 computed

const currentCurrency = computed(() => {
    const selected = form.account;

    // 1. 防呆：如果是 null 或 undefined
    if (!selected) return '金額';

    // 2. 🌟 關鍵修正：如果它已經是「物件」，直接讀取裡面的 currency
    if (typeof selected === 'object') {
        // 如果物件裡有 currency 就用，沒有就預設 NT$
        return selected.currency || 'NT$';
    }

    // 3. 如果它是「ID (數字或字串)」，才去 Store 列表尋找
    // (這是為了相容如果有人傳 ID 進來的情況)
    if (accountStore.accounts.length > 0) {
        const found = accountStore.accounts.find(acc => acc.account_id == selected);
        return found ? (found.currency || 'NT$') : '金額';
    }

    return '金額';
})

// ───────────────────────────────────────────
// 發票掃描相關狀態
// ───────────────────────────────────────────

// 控制掃描結果預覽框是否顯示
const showScanResult = ref(false)

// 掃描中的 loading 狀態
const isScanning = ref(false)

// 掃描錯誤訊息
const scanError = ref('')

// 儲存掃描結果（給預覽框顯示用）
const scanResult = ref(null)

// 隱藏的 file input 的 ref（用來觸發拍照）
const fileInputRef = ref(null)

// 點擊相機圖示時，觸發隱藏的 file input
function triggerCamera() {
    scanError.value = ''
    fileInputRef.value.click()
}

// 使用者選完圖片後，送到後端辨識
async function handleFileSelected(event) {
    const file = event.target.files[0]
    if (!file) return

    // 重置狀態
    isScanning.value = true
    scanError.value = ''
    showScanResult.value = false

    try {
        // 準備 FormData，把圖片包起來送給後端
        const formData = new FormData()
        formData.append('file', file)

        // 取得 JWT token（你的專案存在 localStorage）
        const token = localStorage.getItem('token') || 
                            localStorage.getItem('user_token') || ''

        const response = await fetch('/api/v1/ai/invoice/analyze', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })

        const data = await response.json()

        if (!response.ok) {
            throw new Error(data?.detail?.message || '辨識失敗，請重試')
        }

        // 辨識成功，把結果存起來
        scanResult.value = data.data
        showScanResult.value = true

    } catch (err) {
        scanError.value = err.message || '發生錯誤，請重試'
    } finally {
        isScanning.value = false
        // 清空 file input，讓使用者可以重複選同一張圖
        event.target.value = ''
    }
}

// 使用者點「套用」時，把掃描結果填入表單
function applyScanResult() {
    if (!scanResult.value) return

    const r = scanResult.value

// 同步日期到行事曆 (form.add_date)
    if (r.invoice_date) {
        // 假設後端回傳格式為 "2026-04-15" 或 "2026/04/15"
        const parsedDate = new Date(r.invoice_date);
        
        // 檢查日期是否有效 (防止後端回傳奇怪的字串導致 Invalid Date)
        if (!isNaN(parsedDate.getTime())) {
            form.add_date = parsedDate;
        }
    }

    // 填入金額
    if (r.total_amount) {
        form.add_amount = r.total_amount
    }

    // 組合備註文字
    const lines = []

    if (r.seller_name) lines.push(`店家：${r.seller_name}`)
    if (r.invoice_number) lines.push(`發票：${r.invoice_number}`)
    if (r.receipt_type) lines.push(`類型：${r.receipt_type}`)

    // 如果有商品明細，把每一項列出來
    if (r.items && r.items.length > 0) {
        lines.push('─────────────')
        r.items.forEach(item => {
            const qty = item.quantity ? `x${item.quantity}` : ''
            const price = item.subtotal ? ` NT$${item.subtotal}` : ''
            lines.push(`${item.name} ${qty}${price}`.trim())
        })
    }

    form.add_note = lines.join('\n')

    // 關閉預覽框
    showScanResult.value = false
    scanResult.value = null
}

// 關閉預覽框（不套用）
function closeScanResult() {
    showScanResult.value = false
    scanResult.value = null
    scanError.value = ''
}


onMounted(async () => {
    await accountStore.loadAccounts()

    // 設定預設值
    if (accountStore.accounts.length > 0) {
        // 這裡確保 handleAccountUpdate 會正確更新 form.account
        handleAccountUpdate(accountStore.accounts[0])
    }

    if (window.history.state?.date) {
        form.add_date = window.history.state?.date;
    }
})
</script>

<template>
        <div class="page">
            <Add_bar />

            <div class="card">
                <div class="header">
                    <div class="header-left">
                        <h2>新增支出</h2>
                        <DatePicker v-model="form.add_date" mode="date" :popover="{ visibility: 'click' }"
                            :masks="{ title: 'YYYY年 MMM' }" :transition="'none'">
                            <template #default="{ togglePopover, inputValue, inputEvents }">
                                <div class="date-input-container">
                                    <button type="button" @click="togglePopover"
                                        style="border:0; cursor:pointer">🗓</button>
                                    <input :value="inputValue || ''" v-on="inputEvents" readonly
                                        class="date-display-input" />
                                </div>
                            </template>
                        </DatePicker>
                    </div>

                    <button 
                        class="scan-btn" 
                        @click="triggerCamera"
                        :disabled="isScanning"
                        title="掃描發票"
                    >
                        <span v-if="isScanning" class="scanning-text">辨識中...</span>
                        <span v-else>📷 掃描發票</span>
                    </button>

                    <!-- 隱藏的 file input，accept 限制只能選圖片，capture 會優先開相機 -->
                    <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style="display: none"
                        @change="handleFileSelected"
                    />
                </div>

                <!-- 掃描錯誤提示 -->
                <div v-if="scanError" class="scan-error">
                    ⚠️ {{ scanError }}
                </div>

                <!-- 掃描結果預覽框 -->
                <div v-if="showScanResult && scanResult" class="scan-result-card">
                    <div class="scan-result-header">
                        <span>📄 辨識結果</span>
                        <button class="close-btn" @click="closeScanResult">✕</button>
                    </div>

                    <div class="scan-result-body">
                        <div class="result-row">
                            <span class="result-label">店家</span>
                            <span>{{ scanResult.seller_name || '未辨識' }}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">發票號碼</span>
                            <span>{{ scanResult.invoice_number }}</span>
                        </div>
                        <div class="result-row">
                            <span class="result-label">日期</span>
                            <span>{{ scanResult.invoice_date }}</span>
                        </div>
                        <div class="result-row highlight">
                            <span class="result-label">總金額</span>
                            <span>NT$ {{ scanResult.total_amount }}</span>
                        </div>

                        <!-- 商品明細（有的話才顯示） -->
                        <div v-if="scanResult.items && scanResult.items.length > 0" class="items-section">
                            <div class="items-title">商品明細</div>
                            <div 
                                v-for="item in scanResult.items" 
                                :key="item.name" 
                                class="item-row"
                            >
                                <span>{{ item.name }}</span>
                                <span>NT$ {{ item.subtotal ?? '-' }}</span>
                            </div>
                        </div>
                    </div>

                    <div class="scan-result-actions">
                        <button class="btn-apply" @click="applyScanResult">套用到表單</button>
                        <button class="btn-cancel" @click="closeScanResult">取消</button>
                    </div>
                </div>

                <div class="form-group">
                    <label>支出金額</label>
                    <input v-model.number="form.add_amount" type="number" :placeholder="`${currentCurrency}`"
                        class="amount-input" max="999999999" />
                </div>

                <div class="grid">
                    <div class="form-group">
                        <label>消費類別</label>
                        <Add_cato @update:model-value="handleCatoUpdate" />
                        <div class="change-text">-可自定義類別-</div>
                    </div>

                    <div class="form-group">
                        <label>帳戶</label>
                        <Add_account v-model:account="form.account" />
                        <div class="change-text">餘額 : {{ now_money }}</div>
                        
                    </div>
        
                    <div class="form-group">
                        <label>成員</label>
                        <Add_member @update:model-value="handleMemberUpdate" />
                    </div>

                    <div class="form-group">
                        <label>標籤</label>
                        <Add_tag @update:model-value="handleTagUpdate" />
                    </div>
                </div>



                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label>備註: ({{ form.add_note.length }}/500)</label> 
                        
                    </div>
                    <textarea v-model="form.add_note" placeholder="補充說明（選填）"></textarea>
                </div>

                <div class="actions">
                    <button @click="handleSave" class="btn-primary">儲存支出</button>
                    <button @click="handleSaveNext" class="btn-secondary">再記一筆</button>
                </div>
            </div>
        </div>
</template>

<style scoped>
/* 引用共用 CSS */
@import '../assets/css/add.css';

/* 1. 卡片樣式 */
.card {
    background: var(--bg-card); /* 原本 #ffffff */
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--shadow-card); /* 原本 0 10px 25px... */
    /* 建議加上邊框，讓深色模式下的卡片邊緣更清晰 */
    border: 1px solid var(--border-color);
}

/* 2. 標題與日期 */
.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-primary); /* 補上標題顏色 */
}

/* 日期選擇器相關 (雖然在 template 裡有寫 style="border:0"，但這裡可以補強) */
.date-input-container button {
    background: none;
    font-size: 1.2rem;
}
.date-display-input {
    background: transparent;
    border: none;
    font-size: 1rem;
    color: var(--text-secondary);
    width: 120px;
    cursor: pointer;
}

/* 相機按鈕 */
.scan-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 2px dashed var(--border-color);
    background: var(--bg-input);
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    white-space: nowrap;
}

.scan-btn:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.scan-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.scanning-text {
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

/* 錯誤提示 */
.scan-error {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 16px;
    font-size: 0.9rem;
}

/* 掃描結果預覽卡片 */
.scan-result-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    margin-bottom: 20px;
    overflow: hidden;
    background: var(--bg-input);
}

.scan-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-hover);
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text-primary);
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 1rem;
    padding: 2px 6px;
    border-radius: 4px;
}

.close-btn:hover {
    background: var(--border-color);
}

.scan-result-body {
    padding: 12px 16px;
}

.result-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 0.9rem;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-color);
}

.result-row:last-child {
    border-bottom: none;
}

.result-row.highlight {
    font-weight: 600;
    color: var(--color-primary);
}

.result-label {
    color: var(--text-secondary);
    min-width: 80px;
}

.items-section {
    margin-top: 10px;
}

.items-title {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 6px;
}

.item-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    padding: 4px 0;
    color: var(--text-primary);
}

.scan-result-actions {
    display: flex;
    gap: 10px;
    padding: 12px 16px;
    border-top: 1px solid var(--border-color);
    justify-content: flex-end;
}

.btn-apply {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
}

.btn-cancel {
    background: var(--bg-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
}

/* 3. 標籤 */
label {
    font-size: 0.85rem;
    color: var(--text-secondary); /* 原本 #475569 */
    margin-bottom: 8px; /* 增加一點間距比較好看 */
    display: block;
}

/* 4. 金額輸入框 */
.amount-input {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid var(--border-color); /* 原本 #e2e8f0 */
    background: var(--bg-input); /* 補上背景 */
    color: var(--text-primary);  /* 補上文字 */
    width: 100%; /* 確保寬度正確 */
    box-sizing: border-box;
}

/* 5. 備註輸入框 (Textarea) */
textarea {
    min-height: 120px;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid var(--border-color); /* 原本 #e2e8f0 */
    background: var(--bg-input); /* 補上背景 */
    color: var(--text-primary);  /* 補上文字 */
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
    font-family: inherit; /* 確保字體一致 */
}

/* 6. 按鈕區 */
.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

.btn-primary {
    background: var(--color-primary); /* 原本 #2563eb */
    color: var(--text-inverse); /* 原本 white */
    padding: 10px 20px;
    border: 0px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
}

.btn-secondary {
    background: var(--bg-hover); /* 原本 #e7eef5 (淺灰) */
    color: var(--text-secondary); /* 原本 #334155 (深灰) */
    padding: 10px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-color); /* 補個邊框讓它在深色模式更清楚 */
    cursor: pointer;
    font-weight: 600;
}
.btn-secondary:hover {
    background: var(--border-color); /* hover 時稍微深一點 */
    color: var(--text-primary);
}
</style>