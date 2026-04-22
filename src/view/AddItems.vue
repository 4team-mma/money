<script setup>
import Add_bar from '@/components/AddBar.vue'
import Add_account from '@/components/AddAccount.vue'
import { useAccountStore } from '@/stores/useAccountStore'
import { recordApi } from '@/api/record'
import { onMounted, computed, ref } from 'vue'

const accountStore = useAccountStore()

// ── 步驟狀態：'upload' | 'preview' | 'success' ──
const step = ref('upload')

const fileInputRef    = ref(null)
const isScanning      = ref(false)
const isSubmitting    = ref(false)
const scanError       = ref('')
const selectedAccount = ref(null)

// 可編輯的解析結果（使用者在 preview 步驟修改這些）
const editStore      = ref('')
const editNote       = ref('')
const editAmount     = ref(0)
const editItems      = ref([])  // [{ item_name, item_amount, item_class }]

// ── 計算屬性 ──────────────────────────────────
const currentCurrency = computed(() =>
    selectedAccount.value?.currency || 'NT$'
)

const accountBalance = computed(() =>
    accountStore.formatAccountBalance(selectedAccount.value)
)

const itemsTotal = computed(() =>
    editItems.value.reduce((sum, item) => sum + (Number(item.item_amount) || 0), 0)
)

const amountMismatch = computed(() =>
    editItems.value.length > 0 && itemsTotal.value !== Number(editAmount.value)
)

// ── 上傳圖片 → 呼叫 ai-parse ─────────────────
function triggerCamera() {
    scanError.value = ''
    fileInputRef.value.click()
}

async function handleFileSelected(event) {
    const file = event.target.files[0]
    if (!file) return

    isScanning.value = true
    scanError.value  = ''

    try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await recordApi.parseReceipt(formData)

        // 把解析結果填入可編輯欄位
        const d = res.data
        editStore.value  = d.store || ''
        editNote.value   = d.store ? `${d.store} 訂單` : '訂單記帳'
        editAmount.value = d.add_amount || 0
        editItems.value  = (d.items || []).map((item, idx) => ({
            sort_order:  idx,
            item_name:   item.item_name || item.name || '',
            item_amount: Number(item.item_amount || item.amount || 0),
            item_class:  item.item_class || ''
        }))

        step.value = 'preview'  // 進入預覽步驟

    } catch (err) {
        scanError.value = err?.message || '辨識失敗，請重試'
    } finally {
        isScanning.value = false
        event.target.value = ''
    }
}

// ── 新增 / 刪除品項 ───────────────────────────
function addItem() {
    editItems.value.push({ sort_order: editItems.value.length, item_name: '', item_amount: 0, item_class: '' })
}

function removeItem(idx) {
    editItems.value.splice(idx, 1)
}

// ── 確認送出 → 呼叫 ai-confirm ───────────────
async function confirmRecord() {
    if (!selectedAccount.value) {
        scanError.value = '請選擇帳戶'
        return
    }

    isSubmitting.value = true
    try {
        await recordApi.confirmOrder({
            store:        editStore.value,
            add_amount:   Number(editAmount.value),
            add_class:    '飲食',
            add_note:     editNote.value,
            account_name: selectedAccount.value.account_name,
            add_member:   '自己',
            add_tag:      '需要',
            items:        editItems.value
        })
        step.value = 'success'
    } catch (err) {
        scanError.value = err?.message || '記帳失敗，請重試'
    } finally {
        isSubmitting.value = false
    }
}

function resetAll() {
    step.value       = 'upload'
    scanError.value  = ''
    editStore.value  = ''
    editNote.value   = ''
    editAmount.value = 0
    editItems.value  = []
}

onMounted(async () => {
    await accountStore.loadAccounts()
    if (accountStore.accounts.length > 0) {
        selectedAccount.value = accountStore.accounts[0]
    }
})
</script>

<template>
  <div class="page">
    <Add_bar />

    <div class="card">

      <!-- ── 標題 ── -->
      <div class="header">
        <h2>外送 / 訂單掃描</h2>
        <p class="subtitle">上傳截圖，AI 自動拆分品項明細，確認後才記帳</p>
      </div>

      <!-- ── 帳戶選擇（所有步驟都顯示） ── -->
      <div class="form-group">
        <label>記帳到哪個帳戶</label>
        <Add_account v-model:account="selectedAccount" />
        <div class="change-text">餘額：{{ accountBalance }}</div>
      </div>

      <!-- ════════════════ STEP 1：上傳 ════════════════ -->
      <template v-if="step === 'upload'">
        <div
          class="upload-zone"
          :class="{ loading: isScanning }"
          @click="!isScanning && triggerCamera()"
        >
          <div v-if="isScanning" class="scanning-state">
            <div class="spinner"></div>
            <p>AI 喵喵正在辨識中，請稍候...</p>
          </div>
          <div v-else class="upload-hint">
            <span class="upload-icon">📷</span>
            <p class="upload-title">點擊上傳訂單截圖</p>
            <p class="upload-desc">支援 UberEats、FoodPanda、蝦皮等平台截圖</p>
          </div>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          style="display: none"
          @change="handleFileSelected"
        />

        <div v-if="scanError" class="scan-error">
          ⚠️ {{ scanError }}
        </div>
      </template>

      <!-- ════════════════ STEP 2：預覽編輯 ════════════════ -->
      <template v-if="step === 'preview'">
        <div class="preview-section">

          <div class="section-title">📝 確認並修改辨識結果</div>

          <!-- 店名 -->
          <div class="form-group">
            <label>店家名稱</label>
            <input v-model="editStore" class="text-input" placeholder="例：UberEats 麥當勞" />
          </div>

          <!-- 備註 -->
          <div class="form-group">
            <label>備註</label>
            <input v-model="editNote" class="text-input" placeholder="備註說明" />
          </div>

          <!-- 總金額 -->
          <div class="form-group">
            <label>總金額（{{ currentCurrency }}）</label>
            <input v-model.number="editAmount" type="number" class="amount-input" />
          </div>

          <!-- 品項明細 -->
          <div class="items-editor">
            <div class="items-header">
              <span class="section-title">🧾 品項明細</span>
              <button class="add-item-btn" @click="addItem">＋ 新增品項</button>
            </div>

            <div
              v-for="(item, idx) in editItems"
              :key="idx"
              class="item-edit-row"
            >
              <input
                v-model="item.item_name"
                class="item-name-input"
                placeholder="品項名稱"
              />
              <input
                v-model.number="item.item_amount"
                type="number"
                class="item-amount-input"
                placeholder="金額"
              />
              <input
                v-model="item.item_class"
                class="item-class-input"
                placeholder="分類（選填）"
              />
              <button class="remove-btn" @click="removeItem(idx)">✕</button>
            </div>

            <!-- 合計列 -->
            <div class="sum-row" :class="{ mismatch: amountMismatch }">
              <span>品項合計</span>
              <span>{{ currentCurrency }} {{ itemsTotal }}</span>
            </div>
            <p v-if="amountMismatch" class="mismatch-hint">
              ⚠️ 品項合計（{{ itemsTotal }}）與總金額（{{ editAmount }}）不符，請檢查
            </p>
          </div>

          <div v-if="scanError" class="scan-error">⚠️ {{ scanError }}</div>

          <!-- 操作按鈕 -->
          <div class="actions">
            <button class="btn-secondary" @click="resetAll">← 重新上傳</button>
            <button
              class="btn-primary"
              :disabled="isSubmitting || amountMismatch"
              @click="confirmRecord"
            >
              <span v-if="isSubmitting">儲存中...</span>
              <span v-else>✅ 確認記帳</span>
            </button>
          </div>
        </div>
      </template>

      <!-- ════════════════ STEP 3：成功 ════════════════ -->
      <template v-if="step === 'success'">
        <div class="success-banner">
          <span class="success-icon">🎉</span>
          <p class="success-title">記帳成功！</p>
          <p class="success-desc">訂單明細已儲存到「{{ selectedAccount?.account_name }}」</p>
          <button class="btn-primary" style="margin-top: 16px" @click="resetAll">
            再掃一張
          </button>
        </div>
      </template>

    </div>
  </div>
</template>

<style scoped>
@import '../assets/css/add.css';

.card {
  background: var(--bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color);
}

.header { margin-bottom: 20px; }
.header h2 { margin: 0 0 4px; font-size: 1.5rem; color: var(--text-primary); }
.subtitle { margin: 0; font-size: 0.875rem; color: var(--text-secondary); }

label { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; display: block; }
.change-text { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }

/* 上傳區 */
.upload-zone {
  border: 2px dashed var(--border-color);
  border-radius: 16px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin: 20px 0;
}
.upload-zone:hover:not(.loading) {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}
.upload-zone.loading { cursor: not-allowed; opacity: 0.7; }
.upload-icon { font-size: 3rem; }
.upload-title { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 12px 0 6px; }
.upload-desc { font-size: 0.85rem; color: var(--text-secondary); margin: 0; }

.scanning-state { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--text-secondary); }
.spinner { width: 36px; height: 36px; border: 3px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 錯誤 */
.scan-error {
  background: #fef2f2; color: #dc2626;
  border: 1px solid #fecaca; border-radius: 10px;
  padding: 12px 16px; margin: 12px 0; font-size: 0.9rem;
}

/* 預覽區 */
.preview-section { margin-top: 8px; }
.section-title { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; display: block; }

.text-input, .amount-input {
  width: 100%; padding: 10px 14px;
  border-radius: 10px; border: 2px solid var(--border-color);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 1rem; box-sizing: border-box;
}
.amount-input { font-size: 1.3rem; font-weight: 600; height: 52px; }

/* 品項編輯 */
.items-editor { margin-top: 16px; }
.items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.add-item-btn {
  background: var(--bg-hover); color: var(--color-primary);
  border: 1px dashed var(--color-primary); border-radius: 8px;
  padding: 4px 12px; cursor: pointer; font-size: 0.85rem;
}

.item-edit-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.item-name-input, .item-amount-input, .item-class-input {
  padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-input); color: var(--text-primary);
  font-size: 0.875rem; width: 100%; box-sizing: border-box;
}

.remove-btn {
  background: none; border: none; color: var(--text-secondary);
  cursor: pointer; font-size: 1rem; padding: 4px 8px;
  border-radius: 6px; transition: background 0.15s;
}
.remove-btn:hover { background: #fef2f2; color: #dc2626; }

.sum-row {
  display: flex; justify-content: space-between;
  padding: 10px 0; font-weight: 700;
  border-top: 1px dashed var(--border-color);
  color: var(--text-primary); margin-top: 4px;
}
.sum-row.mismatch { color: #f59e0b; }
.mismatch-hint { font-size: 0.8rem; color: #f59e0b; margin: 4px 0 0; }

/* 成功畫面 */
.success-banner {
  text-align: center; padding: 48px 24px;
}
.success-icon { font-size: 3.5rem; }
.success-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 12px 0 6px; }
.success-desc { color: var(--text-secondary); margin: 0; }

/* 操作按鈕 */
.actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-primary {
  background: var(--color-primary); color: white;
  border: none; padding: 10px 24px; border-radius: 10px;
  font-weight: 600; cursor: pointer; font-size: 0.95rem;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--bg-hover); color: var(--text-secondary);
  border: 1px solid var(--border-color); padding: 10px 20px;
  border-radius: 10px; cursor: pointer; font-weight: 600;
}
.btn-secondary:hover { background: var(--border-color); color: var(--text-primary); }
</style>