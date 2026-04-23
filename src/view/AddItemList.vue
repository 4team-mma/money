<!-- AddItemList.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import Add_bar from '@/components/AddBar.vue'
import { recordApi } from '@/api/record'

const searchQuery = ref('')
const isLoading = ref(false)
const orderList = ref([])
const currentPage = ref(1)
const totalRows = ref(0)
const pageSize = 20

const totalPages = computed(() =>
    Math.ceil(totalRows.value / pageSize) || 1
)

async function loadOrders() {
    isLoading.value = true
    try {
        const res = await recordApi.getOrderList({
            page: currentPage.value,
            page_size: pageSize,
            search: searchQuery.value || undefined
        })
        orderList.value = res.data.map(o => ({ ...o, isExpanded: false }))
        totalRows.value = res.pagination.total_rows
    } catch (e) {
        console.error('載入失敗', e)
    } finally {
        isLoading.value = false
    }
}

let searchTimer = null
function onSearchInput() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        currentPage.value = 1
        loadOrders()
    }, 400)
}

function toggleDetails(order) {
    order.isExpanded = !order.isExpanded
}

function prevPage() {
    if (currentPage.value > 1) { currentPage.value--; loadOrders() }
}
function nextPage() {
    if (currentPage.value < totalPages.value) { currentPage.value++; loadOrders() }
}

// 平台 emoji 對應
function platformEmoji(storeName) {
    if (!storeName) return '🏪'
    const s = storeName.toLowerCase()
    if (s.includes('foodpanda') || s.includes('熊貓')) return '🐼'
    if (s.includes('ubereats')) return '🛵'
    if (s.includes('蝦皮')) return '🛍️'
    if (s.includes('momo')) return '🛒'
    if (s.includes('pchome')) return '💻'
    if (s.includes('全聯')) return '🏬'
    if (s.includes('家樂福')) return '🏪'
    return '🏪'
}

onMounted(loadOrders)
</script>

<template>
    <div class="page">
        <Add_bar />
        <div class="card main-container">

            <div class="header-section">
                <div class="header-text">
                    <h2>歷史訂單明細</h2>
                    <p class="subtitle">共 {{ totalRows }} 筆訂單紀錄</p>
                </div>
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input v-model="searchQuery" @input="onSearchInput" type="text" class="search-input"
                        placeholder="搜尋商家名稱或訂單編號..." />
                </div>
            </div>

            <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <p>載入資料中...</p>
            </div>

            <div v-else-if="orderList.length === 0" class="empty-state">
                <span class="empty-icon">📭</span>
                <p>{{ searchQuery ? '找不到符合的訂單' : '還沒有訂單紀錄，去掃描截圖吧！' }}</p>
            </div>

            <div v-else>
                <div class="order-list">
                    <div v-for="order in orderList" :key="order.add_id" class="order-card">
                        <div class="order-summary" @click="toggleDetails(order)">
                            <div class="summary-left">
                                <div class="store-badge">{{ platformEmoji(order.store_name) }}</div>
                                <div class="store-info">
                                    <h3 class="store-name">{{ order.store_name || '未命名商家' }}</h3>
                                    <div class="order-meta">
                                        <span class="meta-item">{{ order.add_date }}</span>
                                        <span class="meta-divider">•</span>
                                        <span class="meta-item account-tag">{{ order.account_name }}</span>
                                        <template v-if="order.order_number">
                                            <span class="meta-divider">•</span>
                                            <span class="meta-item order-num">#{{ order.order_number }}</span>
                                        </template>
                                        <span class="meta-divider">•</span>
                                        <span class="meta-item item-count">{{ order.items.length }} 項</span>
                                    </div>
                                </div>
                            </div>
                            <div class="summary-right">
                                <div class="total-amount">- NT$ {{ order.add_amount.toLocaleString() }}</div>
                                <span class="expand-btn" :class="{ 'is-open': order.isExpanded }">▼</span>
                            </div>
                        </div>

                        <transition name="slide">
                            <div v-show="order.isExpanded" class="order-details">
                                <div class="details-divider"></div>
                                <table class="items-table">
                                    <thead>
                                        <tr>
                                            <th>品項名稱</th>
                                            <th class="text-center">分類</th>
                                            <th class="text-center">數量</th>
                                            <th class="text-right">金額</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(item, idx) in order.items" :key="idx"
                                            :class="{ 'row-discount': item.item_amount < 0 }">
                                            <td class="item-name">{{ item.item_name }}</td>
                                            <td class="text-center">
                                                <span class="class-tag">{{ item.item_class || '-' }}</span>
                                            </td>
                                            <td class="text-center">x{{ item.quantity || 1 }}</td>
                                            <td class="text-right item-price">
                                                <span :class="item.item_amount < 0 ? 'text-discount' : ''">
                                                    {{ item.item_amount > 0 ? '' : '' }}{{ item.item_amount }}
                                                </span>
                                            </td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr class="total-row">
                                            <td colspan="3" class="text-right total-label">總計</td>
                                            <td class="text-right total-value">NT$ {{ order.add_amount.toLocaleString()
                                                }}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </transition>
                    </div>
                </div>

                <!-- 分頁 -->
                <div v-if="totalPages > 1" class="pagination">
                    <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">← 上一頁</button>
                    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
                    <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">下一頁 →</button>
                </div>
            </div>

        </div>
    </div>
</template>

<style scoped>
@import '../assets/css/add.css';

.main-container {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 24px;
    box-shadow: var(--shadow-card);
    border: 1px solid var(--border-color);
}

.header-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
}

@media (min-width: 768px) {
    .header-section {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-end;
    }
}

.header-text h2 {
    margin: 0 0 4px;
    font-size: 1.5rem;
    color: var(--text-primary);
}

.subtitle {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.search-box {
    position: relative;
    width: 100%;
    max-width: 360px;
}

.search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
}

.search-input {
    width: 100%;
    padding: 10px 16px 10px 40px;
    border-radius: 12px;
    border: 2px solid var(--border-color);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 0.9rem;
    box-sizing: border-box;
    transition: border-color 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.order-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.order-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    background: var(--bg-hover);
    overflow: hidden;
    transition: box-shadow 0.2s;
}

.order-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.order-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    user-select: none;
}

.summary-left {
    display: flex;
    align-items: center;
    gap: 14px;
}

.store-badge {
    font-size: 1.6rem;
    background: var(--bg-card);
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
}

.store-name {
    margin: 0 0 4px;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
}

.order-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    font-size: 0.78rem;
    color: var(--text-secondary);
}

.meta-divider {
    opacity: 0.4;
}

.account-tag {
    background: #e0e7ff;
    color: #4338ca;
    padding: 1px 6px;
    border-radius: 4px;
}

.order-num {
    font-family: monospace;
    background: #f3f4f6;
    padding: 1px 6px;
    border-radius: 4px;
}

.item-count {
    background: #dcfce7;
    color: #16a34a;
    padding: 1px 6px;
    border-radius: 4px;
}

.summary-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.total-amount {
    font-size: 1.1rem;
    font-weight: 700;
    color: #dc2626;
}

.expand-btn {
    color: var(--text-secondary);
    font-size: 0.75rem;
    transition: transform 0.3s;
    display: inline-block;
}

.expand-btn.is-open {
    transform: rotate(180deg);
}

.order-details {
    padding: 0 16px 16px;
    background: var(--bg-card);
}

.details-divider {
    height: 1px;
    background: var(--border-color);
    margin-bottom: 12px;
}

.items-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.items-table th {
    color: var(--text-secondary);
    font-weight: 600;
    padding: 8px;
    border-bottom: 2px solid var(--border-color);
    font-size: 0.8rem;
}

.items-table td {
    padding: 9px 8px;
    color: var(--text-primary);
    border-bottom: 1px solid #f3f4f6;
}

.items-table tr:last-child td {
    border-bottom: none;
}

.row-discount td {
    color: #dc2626;
}

.item-name {
    font-weight: 500;
}

.class-tag {
    background: var(--bg-hover);
    color: var(--text-secondary);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.75rem;
}

.item-price {
    font-weight: 600;
    font-family: monospace;
}

.text-discount {
    color: #dc2626;
}

.text-center {
    text-align: center;
}

.text-right {
    text-align: right;
}

.total-row {
    border-top: 2px solid var(--border-color);
}

.total-label {
    font-weight: 700;
    color: var(--text-secondary);
    padding-top: 12px;
}

.total-value {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 1rem;
    padding-top: 12px;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.page-btn {
    background: var(--bg-hover);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s;
}

.page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
}

.page-info {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.empty-state,
.loading-state {
    text-align: center;
    padding: 48px;
    color: var(--text-secondary);
}

.empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 12px;
}

.spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-color);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 12px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.slide-enter-active,
.slide-leave-active {
    transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}
</style>