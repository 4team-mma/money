<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'

const props = defineProps({ currentStyle: Object })
const userStore = useUserStore()
const categoryStore = useCategoryStore()

const subActiveTab = ref('topSpenders')
const subTabs = [
    { id: 'topSpenders', label: '消費支出排行', icon: '🏆' },
    { id: 'categories', label: '類別支出統計', icon: '💰' },
    { id: 'activeBees', label: '記帳排名', icon: '🐝' }
]

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val || 0)
const rankingsFilter = (list) => list ? list.filter(u => u.role === 'user') : []

onMounted(() => categoryStore.fetchAllRankings())
</script>

<template>
  <div class="content-glass-card" :style="{ backgroundColor: currentStyle.cardBg, borderColor: currentStyle.border }">
    
    <div class="stats-grid">
        <div class="stat-glass-card">
            <div class="stat-info">
                        <span class="stat-label">總註冊用戶</span>
                        <div class="stat-value">{{ userStore.users ? userStore.users.length : 0 }}</div>
                    </div>
                    <div class="stat-icon-circle" style="background: #3b82f620; color: #3b82f6;">👥</div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-info">
                        <span class="stat-label">總用戶消費總額</span>
                        <div class="stat-value" :style="{ color: currentStyle.primary }">
                            {{ formatCurrency(totalTransactionAmount) }}
                        </div>
                    </div>
                    <div class="stat-icon-circle" style="background: #10b98120; color: #10b981;">💰</div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-info">
                        <span class="stat-label">系統反應</span>
                        <div class="stat-value">28ms</div>
                    </div>
                    <div class="stat-icon-circle" style="background: #f59e0b20; color: #f59e0b;">⚡</div>
                </div>
    </div>

    <div class="sub-tab-nav">
        <button v-for="sub in subTabs" :key="sub.id" 
            class="sub-tab-item" :class="{ active: subActiveTab === sub.id }" 
            @click="subActiveTab = sub.id">
            <span class="sub-tab-icon">{{ sub.icon }}</span> {{ sub.label }}
        </button>
    </div>

    <div class="table-wrapper mma-main-table">
        <div v-if="subActiveTab === 'topSpenders'" class="animate-fade-in">
            <div class="section-header">
                <h3>🏆 財富英雄榜</h3>
            </div>
            <table class="mma-table">
                <thead><tr><th>排名</th><th>暱稱</th><th>累積金額</th></tr></thead>
                <tbody>
                    <tr v-for="(u, i) in rankingsFilter(userStore.topUsers)" :key="i">
                        <td><span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                        <td>{{ u.name }}</td>
                        <td class="amount-text" :style="{ color: currentStyle.primary }">{{ formatCurrency(u.totalSpent) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  </div>
</template>

<style scoped>
@import "../assets/css/admin.css";
</style>