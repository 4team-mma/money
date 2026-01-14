<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import AdminsComments from './AdminsComments.vue'

// 接收父組件狀態
const props = defineProps({
    activeTab: String,
    tabs: Array,
    currentStyle: Object,
    currentLoginAdmin: Object,
    themes: Object,
    currentTheme: String
})

// 通知父組件動作
const emit = defineEmits(['open-edit', 'set-theme'])

const userStore = useUserStore()
const categoryStore = useCategoryStore()
const searchQuery = ref('')

/* ========================
   數據計算與過濾 (從原檔完整搬移)
   ======================== */
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val)

const rankingsFilter = (list) => {
    if (!list) return [];
    return list.filter(u => u.role === 'user');
};

const totalTransactionAmount = computed(() => {
    if (!userStore.users) return 0
    return userStore.users
        .filter(u => u.role === 'user')
        .reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
})

const adminFiltered = computed(() => {
    return userStore.formattedAdmins.filter(a =>
        (a.name || '').includes(searchQuery.value) ||
        (a.username || '').includes(searchQuery.value)
    )
})

const normalUsersFiltered = computed(() => {
    return userStore.formattedNormalUsers.filter(u => {
        const search = searchQuery.value.toLowerCase();
        return (
            (u.username || '').toLowerCase().includes(search) ||
            (u.name || '').toLowerCase().includes(search) ||
            (u.email || '').toLowerCase().includes(search)
        );
    });
});
</script>

<template>
    <main class="main-content">
        <header class="main-header">
            <div class="breadcrumb">控制中心 / <span :style="{ color: currentStyle.primary }">{{ tabs.find(t => t.id === activeTab)?.label }}</span></div>
            <div class="user-status"><span class="dot-online"></span> 登入者：<strong>{{ currentLoginAdmin.username }}</strong></div>
        </header>

        <div class="scroll-view">
            <div class="stats-grid">
                <div class="stat-glass-card">
                    <div class="stat-info"><span class="stat-label">總註冊用戶</span><div class="stat-value">{{ userStore.users ? userStore.users.length : 0 }}</div></div>
                    <div class="stat-icon-circle" style="background: #3b82f620; color: #3b82f6;">👥</div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-info"><span class="stat-label">總用戶消費總額</span><div class="stat-value" :style="{ color: currentStyle.primary }">{{ formatCurrency(totalTransactionAmount) }}</div></div>
                    <div class="stat-icon-circle" style="background: #10b98120; color: #10b981;">💰</div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-info"><span class="stat-label">系統反應</span><div class="stat-value">28ms</div></div>
                    <div class="stat-icon-circle" style="background: #f59e0b20; color: #f59e0b;">⚡</div>
                </div>
            </div>

            <div class="content-glass-card" :style="{ backgroundColor: currentStyle.cardBg, borderColor: currentStyle.border }">

                <section v-if="activeTab === 'analytics'" class="tab-content">
                    <div class="section-header"><h3>🏆 財富英雄榜 <small>Top Spenders (Users Only)</small></h3></div>
                    <div class="table-wrapper mma-main-table">
                        <table class="mma-table">
                            <thead><tr><th>排名</th><th>帳號</th><th>暱稱</th><th>累積金額</th><th>次數</th><th>單筆平均</th></tr></thead>
                            <tbody>
                                <tr v-for="(u, i) in rankingsFilter(userStore.topUsers)" :key="u.uid">
                                    <td><span class="rank-badge" :class="'rank-' + (i + 1)">{{ i + 1 }}</span></td>
                                    <td class="font-bold opacity-60">{{ u.username }}</td>
                                    <td class="font-bold">{{ u.name }}</td>
                                    <td class="amount-text" :style="{ color: currentStyle.primary }">{{ formatCurrency(u.totalSpent) }}</td>
                                    <td>{{ u.transactions }} 次</td>
                                    <td class="opacity-60">{{ formatCurrency(u.avgSpent) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="rankings-sub-grid">
                        <div class="sub-rank-box">
                            <div class="section-header"><h4>💰 各路財神消費榜 <small>(類別支出)</small></h4></div>
                            <div class="table-wrapper"><table class="mma-table mini-mode">
                                <thead><tr><th>排名</th><th>項目</th><th class="text-right">累積金額</th></tr></thead>
                                <tbody>
                                    <tr v-for="(item, index) in categoryStore.allRankings.category_spending" :key="index">
                                        <td><span class="mini-rank">{{ index + 1 }}</span></td>
                                        <td>{{ item.name }}</td>
                                        <td class="text-right font-bold">{{ formatCurrency(item.value) }}</td>
                                    </tr>
                                </tbody>
                            </table></div>
                        </div>

                        <div class="sub-rank-box">
                            <div class="section-header"><h4>✍️ 勤勞小蜜蜂獎 <small>(記帳次數)</small></h4></div>
                            <div class="table-wrapper"><table class="mma-table mini-mode">
                                <thead><tr><th>排名</th><th>暱稱</th><th class="text-right">次數</th></tr></thead>
                                <tbody>
                                    <tr v-for="(item, index) in rankingsFilter(categoryStore.allRankings.active_bees)" :key="index">
                                        <td><span class="mini-rank">{{ index + 1 }}</span></td>
                                        <td>{{ item.name }}</td>
                                        <td class="text-right font-bold">{{ item.value }} 次</td>
                                    </tr>
                                </tbody>
                            </table></div>
                        </div>

                        <div class="sub-rank-box">
                            <div class="section-header"><h4>🛡️ 金庫大總管 <small>(帳戶總額)</small></h4></div>
                            <div class="table-wrapper"><table class="mma-table mini-mode">
                                <thead><tr><th>排名</th><th>暱稱</th><th class="text-right">總餘額</th></tr></thead>
                                <tbody>
                                    <tr v-for="(item, index) in rankingsFilter(categoryStore.allRankings.wealth_masters)" :key="index">
                                        <td><span class="mini-rank">{{ index + 1 }}</span></td>
                                        <td>{{ item.name }}</td>
                                        <td class="text-right font-bold">{{ formatCurrency(item.value) }}</td>
                                    </tr>
                                </tbody>
                            </table></div>
                        </div>

                        <div class="sub-rank-box">
                            <div class="section-header"><h4>🆙 修仙進度表 <small>(XP 等級)</small></h4></div>
                            <div class="table-wrapper"><table class="mma-table mini-mode">
                                <thead><tr><th>排名</th><th>暱稱</th><th>等級</th><th class="text-right">經驗值</th></tr></thead>
                                <tbody>
                                    <tr v-for="(item, index) in rankingsFilter(categoryStore.allRankings.xp_immortals)" :key="index">
                                        <td><span class="mini-rank">{{ index + 1 }}</span></td>
                                        <td>{{ item.name }}</td>
                                        <td><span class="level-tag">Lv.{{ item.level }}</span></td>
                                        <td class="text-right font-bold">{{ item.value }} XP</td>
                                    </tr>
                                </tbody>
                            </table></div>
                        </div>
                    </div>
                </section>

                <section v-if="activeTab === 'users'" class="tab-content">
                    <div class="search-box"><input v-model="searchQuery" placeholder="🔍 搜尋..." class="mma-input" /></div>
                    <div class="user-group-div admin-section">
                        <div class="group-title">🛡️ 管理權限組 ({{ adminFiltered.length }})</div>
                        <div class="table-wrapper"><table class="mma-table">
                            <thead><tr><th>顯示編號</th><th>帳號</th><th>姓名</th><th>電子郵件</th><th>職位勳章</th><th>操作</th></tr></thead>
                            <tbody>
                                <tr v-for="u in adminFiltered" :key="u.username">
                                    <td><span class="uid-tag admin-uid">{{ u.displayUid }}</span></td>
                                    <td class="font-bold">{{ u.username }}</td>
                                    <td>{{ u.name }}</td>
                                    <td class="email-cell">{{ u.email }}</td>
                                    <td><span class="job-badge">{{ u.job || '管理者' }}</span></td>
                                    <td><button class="btn-mma-action" :class="{ 'is-disabled': u.username !== currentLoginAdmin.username }" @click="emit('open-edit', u)">
                                        {{ u.username === currentLoginAdmin.username ? '修改資訊' : '不可修改' }}
                                    </button></td>
                                </tr>
                            </tbody>
                        </table></div>
                    </div>

                    <div class="user-group-div" style="margin-top: 50px;">
                        <div class="group-title">👤 一般用戶組 ({{ normalUsersFiltered.length }})</div>
                        <div class="table-wrapper"><table class="mma-table">
                            <thead><tr><th>顯示編號</th><th>帳號</th><th>名稱</th><th>電子郵件</th><th>操作</th></tr></thead>
                            <tbody>
                                <tr v-for="u in normalUsersFiltered" :key="u.uid">
                                    <td><span class="uid-tag user-uid">{{ u.displayUid }}</span></td>
                                    <td class="font-bold">{{ u.username }}</td>
                                    <td>{{ u.name }}</td>
                                    <td>{{ u.email }}</td>
                                    <td class="action-btns"><button class="btn-mma-action" :style="{ borderColor: currentStyle.primary, color: currentStyle.primary }">詳情</button><button class="btn-mma-action delete" @click="userStore.deleteUser(u.uid)">註銷</button></td>
                                </tr>
                            </tbody>
                        </table></div>
                    </div>
                </section>

                <section v-if="activeTab === 'api'" class="tab-content"><div class="section-header"><h3>🤖 模型控制中心</h3></div><div><p>開發中...</p></div></section>

                <section v-if="activeTab === 'feedback'" class="tab-content"><AdminsComments /></section>

                <section v-if="activeTab === 'system'" class="tab-content">
                    <div class="section-header"><h3>🎨 視覺主題設定</h3></div>
                    <div class="theme-picker">
                        <div v-for="(style, id) in themes" :key="id" class="theme-item" :class="{ 'is-selected': currentTheme === id }" @click="emit('set-theme', id)">
                            <div class="theme-preview" :style="{ background: style.bgGradient }">
                                <div class="preview-sidebar" :style="{ background: style.sidebarBg }"></div>
                                <div class="preview-accent" :style="{ background: style.primary }"></div>
                            </div>
                            <span>{{ style.name }}</span>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </main>
</template>

<style scoped>
@import "../assets/css/admin.css";

</style>