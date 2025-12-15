<template>
  <DashboardLayout>
    <div class="transactions-page">
      <div class="page-header">
        <h1>記一筆</h1>
        <p><span class="sparkle">✨</span> 快速記錄您的收支交易</p>
      </div>

      <div class="transaction-card">
        <div class="card-header">
          <h2>交易資訊</h2>
          <p>填寫交易的詳細資訊</p>
        </div>

        <div class="card-content">
          <div class="tabs">
            <button 
              v-for="type in transactionTypes" 
              :key="type.value"
              :class="['tab-button', { active: transactionType === type.value }]"
              @click="transactionType = type.value"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>

          <form @submit.prevent="handleSubmit" class="transaction-form">
            <div class="form-group">
              <label>{{ transactionType === 'expense' ? '💸 支出金額' : transactionType === 'income' ? '💰 收入金額' : '轉帳金額' }}</label>
              <div class="amount-input-wrapper">
                <span class="currency">NT$</span>
                <input 
                  v-model="amount" 
                  type="number" 
                  placeholder="0"
                  class="amount-input"
                  required
                />
              </div>
            </div>

            <div v-if="transactionType !== 'transfer'" class="form-group">
              <label>{{ transactionType === 'expense' ? '支出類別' : '收入類別' }}</label>
              <div class="category-display" @click="showCategorySelector = true">
                <span class="category-icon">{{ selectedCategory.icon }}</span>
                <span class="category-name">{{ selectedCategory.itemName }}</span>
                <span class="arrow">›</span>
              </div>
            </div>

            <div v-if="transactionType === 'transfer'" class="form-group">
              <label>從帳戶</label>
              <select v-model="fromAccount" class="select-input">
                <option value="main">🏦 主要帳戶</option>
                <option value="cash">💵 現金</option>
                <option value="credit">💳 信用卡</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ transactionType === 'transfer' ? '到帳戶' : '帳戶' }}</label>
              <select v-model="account" class="select-input">
                <option value="main">🏦 主要帳戶</option>
                <option value="cash">💵 現金</option>
                <option value="credit">💳 信用卡</option>
              </select>
            </div>

            <div class="form-group">
              <label>交易日期</label>
              <input v-model="date" type="date" class="date-input" />
            </div>

            <div v-if="transactionType !== 'transfer'" class="form-group">
              <label>上傳收據（選填）</label>
              <div class="upload-area">
                <span class="upload-icon">📤</span>
                <p class="upload-text">點擊上傳或拖曳檔案</p>
                <p class="upload-hint">支援 JPG, PNG, PDF</p>
              </div>
            </div>

            <div class="form-group">
              <label>備註（選填）</label>
              <textarea 
                v-model="note" 
                placeholder="輸入交易備註..."
                rows="3"
                class="textarea-input"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="submit-button">
                <span>✓</span>
                儲存交易
              </button>
              <button type="button" class="secondary-button">
                再記一筆
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="tips-card">
        <div class="tips-content">
          <span class="tips-icon">✨</span>
          <div class="tips-text">
            <div class="tips-title">小提示</div>
            <p>您可以自訂類別和顏色標籤，讓記帳更加個性化。別忘了上傳收據，方便日後查詢對帳。</p>
          </div>
        </div>
      </div>

      <div v-if="showCategorySelector" class="modal-overlay" @click="showCategorySelector = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>選擇類別</h3>
            <button @click="showCategorySelector = false" class="modal-close">✕</button>
          </div>
          <div class="category-grid">
            <div 
              v-for="cat in (transactionType === 'expense' ? expenseCategories : incomeCategories)"
              :key="cat.id"
              class="category-item"
              :style="{ borderColor: cat.color }"
              @click="selectCategory(cat)"
            >
              <span class="category-icon">{{ cat.icon }}</span>
              <span class="category-label">{{ cat.itemName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
<script setup>
import { ref, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'

/* ===== 類別資料（一定要先宣告） ===== */
const expenseCategories = [
  { id: 1, itemName: '飲食', icon: '🍔', color: '#EF4444' },
  { id: 2, itemName: '交通', icon: '🚗', color: '#F59E0B' },
  { id: 3, itemName: '購物', icon: '🛍️', color: '#EC4899' },
  { id: 4, itemName: '娛樂', icon: '🎮', color: '#8B5CF6' },
  { id: 5, itemName: '醫療', icon: '💊', color: '#10B981' },
  { id: 6, itemName: '教育', icon: '📚', color: '#3B82F6' }
]

const incomeCategories = [
  { id: 101, itemName: '工資', icon: '💰', color: '#10B981' },
  { id: 102, itemName: '獎金', icon: '🎁', color: '#F59E0B' },
  { id: 103, itemName: '投資', icon: '📈', color: '#3B82F6' },
  { id: 104, itemName: '兼職', icon: '💼', color: '#8B5CF6' }
]

/* ===== 基本狀態 ===== */
const transactionType = ref('expense')
const amount = ref('')
const account = ref('main')
const fromAccount = ref('main')
const date = ref(new Date().toISOString().split('T')[0])
const note = ref('')
const showCategorySelector = ref(false)

/* ===== 各類型自己的選擇 ===== */
const selectedExpenseCategory = ref(expenseCategories[0])
const selectedIncomeCategory = ref(incomeCategories[0])

/* ===== Tabs ===== */
const transactionTypes = [
  { value: 'expense', icon: '💸', label: '支出' },
  { value: 'income', icon: '💰', label: '收入' },
  { value: 'transfer', icon: '🔄', label: '轉帳' }
]

/* ===== 顯示用類別（computed） ===== */
const selectedCategory = computed(() => {
  if (transactionType.value === 'expense') {
    return selectedExpenseCategory.value
  }
  if (transactionType.value === 'income') {
    return selectedIncomeCategory.value
  }
  return {}
})

/* ===== 選擇類別 ===== */
const selectCategory = (cat) => {
  if (transactionType.value === 'expense') {
    selectedExpenseCategory.value = cat
  } else if (transactionType.value === 'income') {
    selectedIncomeCategory.value = cat
  }
  showCategorySelector.value = false
}

/* ===== 送出 ===== */
const handleSubmit = () => {
  console.log('Transaction submitted:', {
    type: transactionType.value,
    amount: amount.value,
    category: selectedCategory.value,
    note: note.value
  })

  amount.value = ''
  note.value = ''
}
</script>


<style scoped>
.transactions-page {
  max-width: 768px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sparkle {
  color: #3B82F6;
}

.transaction-card {
  background: white;
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.card-header {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(37, 99, 235, 0.05));
  padding: 1.5rem;
  border-bottom: 2px solid #E2E8F0;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 0.25rem;
}

.card-header p {
  font-size: 0.875rem;
  color: #64748B;
}

.card-content {
  padding: 1.5rem;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  padding: 0.25rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.75rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748B;
}

.tab-button:hover {
  background: rgba(255, 255, 255, 0.5);
}

.tab-button.active {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
}

.transaction-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1E293B;
}

.amount-input-wrapper {
  position: relative;
}

.currency {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  font-weight: 500;
}

.amount-input {
  width: 100%;
  height: 56px;
  padding-left: 3.5rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 1.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

.amount-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.category-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-display:hover {
  border-color: #3B82F6;
  background: rgba(59, 130, 246, 0.02);
}

.category-icon {
  font-size: 1.5rem;
}

.category-name {
  flex: 1;
  font-weight: 500;
  color: #1E293B;
}

.arrow {
  color: #94A3B8;
  font-size: 1.25rem;
}

.select-input,
.date-input {
  height: 48px;
  padding: 0 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.select-input:focus,
.date-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.upload-area {
  border: 2px dashed #CBD5E1;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #3B82F6;
  background: rgba(59, 130, 246, 0.02);
}

.upload-icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  margin-bottom: 0.25rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: #94A3B8;
}

.textarea-input {
  padding: 0.75rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;
}

.textarea-input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
}

.submit-button,
.secondary-button {
  flex: 1;
  height: 48px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.submit-button {
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.4);
}

.secondary-button {
  background: transparent;
  border: 2px solid #E2E8F0;
  color: #64748B;
}

.secondary-button:hover {
  border-color: #3B82F6;
  color: #3B82F6;
}

.tips-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1));
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 1rem;
}

.tips-content {
  display: flex;
  gap: 0.75rem;
}

.tips-icon {
  font-size: 1.25rem;
  color: #3B82F6;
}

.tips-text {
  flex: 1;
}

.tips-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 0.25rem;
}

.tips-text p {
  font-size: 0.75rem;
  color: #64748B;
  line-height: 1.5;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 2px solid #E2E8F0;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1E293B;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748B;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.category-item .category-icon {
  font-size: 2rem;
}

.category-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #1E293B;
}
</style>
