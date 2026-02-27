<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'

// 接收父組件樣式
const props = defineProps({
    currentStyle: Object
})

const userStore = useUserStore()
const categoryStore = useCategoryStore()

/* ========================
   數據分析：子分頁切換
   ======================== */
const subActiveTab = ref('topSpenders')
const subTabs = [
    { id: 'topSpenders', label: '消費支出排行', icon: '🏆' },
    { id: 'categories', label: '類別支出統計', icon: '💰' },
    { id: 'activeBees', label: '記帳排名', icon: '🐝' },
    { id: 'wealth', label: '儲蓄排行', icon: '🛡️' },
    { id: 'xp', label: 'XP等級榜', icon: '✨' }
]

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { 
    style: 'currency', currency: 'TWD', minimumFractionDigits: 0 
}).format(val || 0)

const rankingsFilter = (list) => {
    if (!list) return [];
    return list.filter(u => u.role === 'user');
};

onMounted(async () => {
    await categoryStore.fetchAllRankings() // 確保排行榜數據有抓取
})
</script>

<template>
    <div class="admin-data-container">
        <div class="sub-tab-nav">
            <button 
                v-for="sub in subTabs" 
                :key="sub.id"
                class="sub-tab-item"
                :class="{ active: subActiveTab === sub.id }"
                @click="subActiveTab = sub.id"
            >
                <span class="sub-tab-icon">{{ sub.icon }}</span>
                {{ sub.label }}
            </button>
        </div>

        <div v-if="subActiveTab === 'topSpenders'" class="animate-fade-in">
            <div class="section-header">
                <h3>🏆 財富英雄榜 <small>Top Spenders (Users Only)</small></h3>
            </div>
            <div class="table-wrapper mma-main-table">
                <table class="mma-table">
                    <thead>
                        <tr>
                            <th>排名</th><th>帳號</th><th>暱稱</th><th>累積金額</th><th>次數</th><th>單筆平均</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(u, i) in rankingsFilter(userStore.topUsers)" :key="u.uid">
                            <td><span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                            <td class="font-bold opacity-60">{{ u.username }}</td>
                            <td class="font-bold">{{ u.name }}</td>
                            <td class="amount-text" :style="{ color: currentStyle.primary }">
                                {{ formatCurrency(u.totalSpent) }}
                            </td>
                            <td>{{ u.transactions }} 次</td>
                            <td class="opacity-60">{{ formatCurrency(u.avgSpent) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="subActiveTab === 'categories'" class="animate-fade-in">
            <div class="section-header">
                <h4>💰 各路財神消費榜 <small>(類別支出統計)</small></h4>
            </div>
            <div class="table-wrapper">
                <table class="mma-table">
                    <thead>
                        <tr>
                            <th>排名</th><th>項目類別</th><th class="text-right">累積總金額</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in categoryStore.allRankings.category_spending" :key="index">
                            <td><span class="mini-rank">{{ index + 1 }}</span></td>
                            <td>{{ item.name }}</td>
                            <td class="text-right font-bold">{{ formatCurrency(item.value) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="subActiveTab === 'activeBees'" class="animate-fade-in">
            <div class="section-header">
                <h4>✍️ 勤勞小蜜蜂獎 <small>(記帳次數排名)</small></h4>
            </div>
            <div class="table-wrapper">
                <table class="mma-table">
                    <thead>
                        <tr>
                            <th>排名</th><th>用戶暱稱</th><th class="text-right">記帳頻率</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in rankingsFilter(categoryStore.allRankings.active_bees)" :key="index">
                            <td><span class="mini-rank">{{ index + 1 }}</span></td>
                            <td>{{ item.name }}</td>
                            <td class="text-right font-bold">{{ item.value }} 次</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="subActiveTab === 'wealth'" class="animate-fade-in">
            <div class="section-header">
                <h4>🛡️ 金庫大總管 <small>(帳戶餘額儲蓄排名)</small></h4>
            </div>
            <div class="table-wrapper">
                <table class="mma-table">
                    <thead>
                        <tr>
                            <th>排名</th><th>用戶暱稱</th><th class="text-right">目前總餘額</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in rankingsFilter(categoryStore.allRankings.wealth_masters)" :key="index">
                            <td><span class="mini-rank">{{ index + 1 }}</span></td>
                            <td>{{ item.name }}</td>
                            <td class="text-right font-bold">{{ formatCurrency(item.value) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div v-if="subActiveTab === 'xp'" class="animate-fade-in">
            <div class="section-header">
                <h4>🆙 修仙進度表 <small>(XP 等級成長榜)</small></h4>
            </div>
            <div class="table-wrapper">
                <table class="mma-table">
                    <thead>
                        <tr>
                            <th>排名</th><th>用戶暱稱</th><th>目前稱號</th><th class="text-right">總經驗值</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, index) in rankingsFilter(categoryStore.allRankings.xp_immortals)" :key="index">
                            <td><span class="mini-rank">{{ index + 1 }}</span></td>
                            <td>{{ item.name }}</td>
                            <td><span class="level-tag">Lv.{{ item.level }}</span></td>
                            <td class="text-right font-bold">{{ item.value }} XP</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import "../assets/css/admin.css";
.admin-data-container {
    width: 100%;
}
.text-right { text-align: right !important; }
</style>