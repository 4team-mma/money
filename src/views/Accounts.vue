<template>
  <DashboardLayout>
    <div class="accounts-page">
      <div class="page-header">
        <div>
          <h1>帳戶管理</h1>
          <p>管理您的所有帳戶與資產</p>
        </div>
        <button @click="showAddDialog = true" class="add-button">
          <span>➕</span>
          新增帳戶
        </button>
      </div>

      <div class="summary-cards">
        <div class="summary-card net-worth">
          <div class="card-header">
            <span class="card-title">總淨值</span>
            <span class="card-icon">💼</span>
          </div>
          <div class="card-value accent">NT$ {{ totalBalance.toLocaleString() }}</div>
          <p class="card-desc">總資產減去總負債</p>
        </div>

        <div class="summary-card assets">
          <div class="card-header">
            <span class="card-title">總資產</span>
            <span class="card-icon">📈</span>
          </div>
          <div class="card-value">NT$ {{ totalAssets.toLocaleString() }}</div>
          <p class="card-desc">所有正資產總和</p>
        </div>

        <div class="summary-card liabilities">
          <div class="card-header">
            <span class="card-title">總負債</span>
            <span class="card-icon">📉</span>
          </div>
          <div class="card-value negative">NT$ {{ totalLiabilities.toLocaleString() }}</div>
          <p class="card-desc">所有負債總和</p>
        </div>
      </div>

      <div class="accounts-grid">
        <div v-for="account in accounts" :key="account.id" class="account-card">
          <div class="account-color-bar" :style="{ backgroundColor: account.color }"></div>
          <div class="account-header">
            <div class="account-info">
              <div class="account-icon-wrapper" :style="{ backgroundColor: account.color + '33' }">
                <span class="account-icon" :style="{ color: account.color }">{{ getIcon(account.icon) }}</span>
              </div>
              <div class="account-details">
                <h3>{{ account.name }}</h3>
                <p>{{ account.type }}</p>
              </div>
            </div>
            <button class="menu-button" @click="toggleMenu(account.id)">⋮</button>
          </div>
          <div class="account-balance" :class="{ negative: account.balance < 0 }">
            {{ account.balance < 0 ? '-' : '' }}NT$ {{ Math.abs(account.balance).toLocaleString() }}
          </div>
          <div class="account-footer">最後更新：今天</div>
        </div>
      </div>

      <div v-if="showAddDialog" class="modal-overlay" @click="showAddDialog = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>新增帳戶</h3>
            <button @click="showAddDialog = false" class="modal-close">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>帳戶名稱</label>
              <input v-model="newAccount.name" type="text" placeholder="例如：玉山銀行" />
            </div>
            <div class="form-group">
              <label>帳戶類型</label>
             <select v-model="selectedType">
    <option v-for="type in accountTypes" :key="type.value" :value="type.value">
      {{ type.label }}
    </option>
    <option value="new">➕ 新增類型</option>
  </select>
<input
    v-if="selectedType === 'new'"
    v-model="newTypeLabel"
    placeholder="輸入新帳戶類型"
    @keyup.enter="addNewType"
  />
         
            </div>
            <div class="form-group">
              <label>初始餘額</label>
              <input v-model.number="newAccount.balance" type="number" placeholder="0" />
            </div>
            <div class="form-group">
              <label>顏色</label>
              <div class="color-picker">
                <button
                  v-for="color in colors"
                  :key="color"
                  :class="['color-option', { selected: newAccount.color === color }]"
                  :style="{ backgroundColor: color }"
                  @click="newAccount.color = color"
                ></button>
              </div>
            </div>
            <button @click="handleAddAccount" class="submit-button" :disabled="!newAccount.name">
              新增帳戶
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'

// 控制新增帳戶模態框
const showAddDialog = ref(false)

// 帳戶資料
const accounts = ref([
  { id: 1, name: '主要銀行帳戶', type: 'bank', balance: 125000, currency: 'TWD', color: '#3B82F6', icon: 'credit' },
  { id: 2, name: '現金', type: 'cash', balance: 8500, currency: 'TWD', color: '#22C55E', icon: 'banknote' },
  { id: 3, name: '信用卡（中國信託）', type: 'credit', balance: -12300, currency: 'TWD', color: '#EF4444', icon: 'credit' },
  { id: 4, name: '投資帳戶', type: 'investment', balance: 450000, currency: 'TWD', color: '#8B5CF6', icon: 'wallet' }
])

// 新帳戶表單
const newAccount = reactive({
  name: '',
  type: '',
  balance: 0,
  currency: 'TWD',
  color: '#3B82F6',
  icon: 'credit'
})

// 顏色選項
const colors = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4']

// 帳戶類型清單（可介面端新增）
const accountTypes = ref([
  { value: 'bank', label: '銀行帳戶' },
  { value: 'cash', label: '現金' },
  { value: 'credit', label: '信用卡' },
  { value: 'investment', label: '投資帳戶' }
])

// 下拉選單綁定
const selectedType = ref(accountTypes.value[0].value)

// 輸入新帳戶類型
const newTypeLabel = ref('')

// 新增帳戶類型
const addNewType = () => {
  if (!newTypeLabel.value.trim()) return
  const value = newTypeLabel.value.trim().replace(/\s+/g, '_')
  const newType = { value, label: newTypeLabel.value.trim() }
  accountTypes.value.push(newType)
  selectedType.value = value
  newTypeLabel.value = ''
}

// 計算總資產、總負債、總淨值
const totalBalance = computed(() => accounts.value.reduce((sum, acc) => sum + acc.balance, 0))
const totalAssets = computed(() => accounts.value.filter(acc => acc.balance > 0).reduce((sum, acc) => sum + acc.balance, 0))
const totalLiabilities = computed(() => Math.abs(accounts.value.filter(acc => acc.balance < 0).reduce((sum, acc) => sum + acc.balance, 0)))

// 取得圖示
const getIcon = (icon) => {
  const icons = {
    wallet: '💼',
    credit: '💳',
    banknote: '💵'
  }
  return icons[icon] || '💼'
}

// 新增帳戶
const handleAddAccount = () => {
  if (!newAccount.name) return
  const account = {
    id: Date.now(),
    name: newAccount.name,
    type: selectedType.value,
    balance: newAccount.balance,
    currency: 'TWD',
    color: newAccount.color,
    icon: 'credit'
  }
  accounts.value.push(account)
  showAddDialog.value = false

  // 重置表單
  Object.assign(newAccount, { name: '', type: '', balance: 0, currency: 'TWD', color: '#3B82F6', icon: 'credit' })
  selectedType.value = accountTypes.value[0].value
}

// 側邊選單（未實作功能）
const toggleMenu = (id) => {
  console.log('Toggle menu for account:', id)
}
</script>

<style scoped>
.accounts-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #64748B;
}

.add-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.summary-card.net-worth {
  border-left-color: #3B82F6;
}

.summary-card.assets {
  border-left-color: #10B981;
}

.summary-card.liabilities {
  border-left-color: #EF4444;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
}

.card-icon {
  font-size: 1.25rem;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 0.25rem;
}

.card-value.accent {
  color: #3B82F6;
}

.card-value.negative {
  color: #EF4444;
}

.card-desc {
  font-size: 0.75rem;
  color: #94A3B8;
}

.accounts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.account-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.account-color-bar {
  height: 8px;
}

.account-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1rem 1rem 0.5rem;
}

.account-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.account-icon-wrapper {
  padding: 0.75rem;
  border-radius: 8px;
}

.account-icon {
  font-size: 1.5rem;
}

.account-details h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-details p {
  font-size: 0.875rem;
  color: #64748B;
  text-transform: capitalize;
}

.menu-button {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  color: #64748B;
}

.account-balance {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1E293B;
  padding: 0 1rem;
}

.account-balance.negative {
  color: #EF4444;
}

.account-footer {
  font-size: 0.75rem;
  color: #94A3B8;
  padding: 0.5rem 1rem 1rem;
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
  max-width: 480px;
  width: 100%;
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

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 44px;
  padding: 0 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.color-picker {
  display: flex;
  gap: 0.5rem;
}

.color-option {
  width: 40px;
  height: 40px;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #1E293B;
  transform: scale(1.15);
  box-shadow: 0 0 0 2px white, 0 0 0 4px #1E293B;
}

.submit-button {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
