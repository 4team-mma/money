<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import axios from 'axios'
import AdminsComments from './AdminsComments.vue'

/* ========================
Router / Store
======================== */
const router = useRouter()
const userStore = useUserStore()
const categoryStore = useCategoryStore()

/* ========================
UI 狀態管理
======================== */
const activeTab = ref('analytics')
const tabs = [
    { id: 'analytics', label: '數據分析', icon: '📊' },
    { id: 'api', label: '模型管理', icon: '🔌' },
    { id: 'users', label: '用戶管理', icon: '👥' },
    { id: 'feedback', label: '問題回饋', icon: '💬' },
    { id: 'system', label: '系統設定', icon: '⚙️' }
]

/* ========================
管理者名單與身分驗證 (連動登入系統)
======================== */
const getInitialAdmin = () => {
    try {
        const saved = localStorage.getItem('currentUser')
        return saved ? JSON.parse(saved) : { username: 'admin', email: 'mma.save.money@gmail.com' }
    } catch (e) {
        return { username: 'admin', email: 'mma.save.money@gmail.com' }
    }
}

const currentLoginAdmin = ref(getInitialAdmin())

/* ========================
編輯 Modal 邏輯
======================== */
const isEditModalOpen = ref(false)
const editForm = ref({ uid: '', username: '', name: '', email: '', job: '' })

const openEditModal = (u) => {
    if (u.username !== currentLoginAdmin.value.username) {
        alert('權限限制：您僅能修改自己的個人資訊！')
        return
    }
    // 🌟 注意：編輯時帶入原始 uid 以便 API 識別
    editForm.value = { ...u }
    isEditModalOpen.value = true
}

const saveAdmin = async () => {
    try {
        await axios.put(`http://localhost:8000/users/${editForm.value.uid}`, {
            username: editForm.value.username,
            name: editForm.value.name,
            email: editForm.value.email,
            job: editForm.value.job
        });

        await userStore.loadUsers();
        isEditModalOpen.value = false;
        alert('職稱與個人資料已更新！');
    } catch (err) {
        alert('更新失敗：' + (err.response?.data?.detail || '系統錯誤'));
    }
}

/* ========================
Theme System (含防崩潰邏輯)
======================== */
const themes = {
    mma_light: {
        name: 'MMA 經典', primary: '#3b82f6',
        bgGradient: 'linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%)',
        cardBg: 'rgba(255, 255, 255, 0.85)', sidebarBg: 'rgba(255, 255, 255, 0.7)',
        text: '#1e293b', border: 'rgba(255, 255, 255, 0.5)'
    },
    dark: {
        name: '極客深邃', primary: '#60a5fa',
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        cardBg: 'rgba(30, 41, 59, 0.8)', sidebarBg: 'rgba(15, 23, 42, 0.7)',
        text: '#f1f5f9', border: 'rgba(255, 255, 255, 0.1)'
    },
    forest: {
        name: '森林晨曦', primary: '#10b981',
        bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)',
        text: '#064e3b', border: 'rgba(16, 185, 129, 0.2)'
    },
    sunset: {
        name: '微醺夕陽', primary: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
        cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)',
        text: '#78350f', border: 'rgba(245, 158, 11, 0.2)'
    }
}

const currentTheme = ref(localStorage.getItem('adminTheme') || 'mma_light')
const currentStyle = computed(() => themes[currentTheme.value] || themes.mma_light)

const setTheme = (id) => { currentTheme.value = id; localStorage.setItem('adminTheme', id); }

/* ========================
數據計算與過濾 (引用 Store Getters)
======================== */
const totalTransactionAmount = computed(() => {
    if (!userStore.users) return 0
    return userStore.users
        .filter(u => u.role === 'user')
        .reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
})

const rankingsFilter = (list) => {
    if (!list) return [];
    return list.filter(u => u.role === 'user');
};

const searchQuery = ref('')

// 🛡️ 引用 Store 的 formattedAdmins (自動 A-01 序號)
const adminFiltered = computed(() => {
    return userStore.formattedAdmins.filter(a =>
        (a.name || '').includes(searchQuery.value) ||
        (a.username || '').includes(searchQuery.value)
    )
})

// 👤 引用 Store 的 formattedNormalUsers (自動 U-01 序號)
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

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val)
const handleLogout = () => { if (confirm('確定斷開連線並登出系統？')) router.push('/') }

onMounted(async () => {
    if (userStore.loadUsers) await userStore.loadUsers();
    await categoryStore.fetchAllRankings();
});
</script>

<template>
    <div class="admin-layout" :style="{ background: currentStyle.bgGradient, color: currentStyle.text }">
        <div class="background-effects"><div v-for="n in 8" :key="n" class="effect-circle"></div></div>

        <aside class="sidebar-glass" :style="{ backgroundColor: currentStyle.sidebarBg, borderColor: currentStyle.border }">
            <div class="brand-zone">
                <div class="logo-icon"><span class="icon"><img src="../assets/logo.svg" alt="logo" width="48" height="48"></span></div>
                <div class="brand-info">
                    <h2>Money MMA</h2>
                    <span class="badge" :style="{ background: currentStyle.primary }">ADMIN PANEL</span>
                </div>
            </div>
            <nav class="nav-menu">
                <button v-for="t in tabs" :key="t.id" class="nav-link" :class="{ 'is-active': activeTab === t.id }"
                    :style="activeTab === t.id ? { background: currentStyle.primary + '20', color: currentStyle.primary } : {}"
                    @click="activeTab = t.id"><span class="icon">{{ t.icon }}</span> {{ t.label }}</button>
            </nav>
            <div class="sidebar-bottom"><button class="btn-logout" @click="handleLogout">登出系統</button></div>
        </aside>

        <main class="main-content">
            <header class="main-header">
                <div class="breadcrumb">控制中心 / <span :style="{ color: currentStyle.primary }">{{ tabs.find(t => t.id === activeTab).label }}</span></div>
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
                                <div class="table-wrapper">
                                    <table class="mma-table mini-mode">
                                        <thead><tr><th>排名</th><th>項目</th><th class="text-right">累積金額</th></tr></thead>
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
                            <div class="sub-rank-box">
                                <div class="section-header"><h4>✍️ 勤勞小蜜蜂獎 <small>(記帳次數)</small></h4></div>
                                <div class="table-wrapper">
                                    <table class="mma-table mini-mode">
                                        <thead><tr><th>排名</th><th>暱稱</th><th class="text-right">次數</th></tr></thead>
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
                            <div class="sub-rank-box">
                                <div class="section-header"><h4>🛡️ 金庫大總管 <small>(帳戶總額)</small></h4></div>
                                <div class="table-wrapper">
                                    <table class="mma-table mini-mode">
                                        <thead><tr><th>排名</th><th>暱稱</th><th class="text-right">總餘額</th></tr></thead>
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
                            <div class="sub-rank-box">
                                <div class="section-header"><h4>🆙 修仙進度表 <small>(XP 等級)</small></h4></div>
                                <div class="table-wrapper">
                                    <table class="mma-table mini-mode">
                                        <thead><tr><th>排名</th><th>暱稱</th><th>等級</th><th class="text-right">經驗值</th></tr></thead>
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
                    </section>

                    <section v-if="activeTab === 'users'" class="tab-content">
                        <div class="search-box"><input v-model="searchQuery" placeholder="🔍 搜尋..." class="mma-input" /></div>
                        <div class="user-group-div admin-section">
                            <div class="group-title">🛡️ 管理權限組 ({{ adminFiltered.length }})</div>
                            <div class="table-wrapper">
                                <table class="mma-table">
                                    <thead><tr><th>顯示編號</th><th>帳號</th><th>姓名</th><th>電子郵件</th><th>職位勳章</th><th>操作</th></tr></thead>
                                    <tbody>
                                        <tr v-for="u in adminFiltered" :key="u.username">
                                            <td><span class="uid-tag admin-uid">{{ u.displayUid }}</span></td>
                                            <td class="font-bold">{{ u.username }}</td>
                                            <td>{{ u.name }}</td>
                                            <td class="email-cell">{{ u.email }}</td>
                                            <td><span class="job-badge">{{ u.job || '管理者' }}</span></td>
                                            <td><button class="btn-mma-action" :class="{ 'is-disabled': u.username !== currentLoginAdmin.username }" @click="openEditModal(u)">{{ u.username === currentLoginAdmin.username ? '修改資訊' : '不可修改' }}</button></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div class="user-group-div" style="margin-top: 50px;">
                            <div class="group-title">👤 一般用戶組 ({{ normalUsersFiltered.length }})</div>
                            <div class="table-wrapper">
                                <table class="mma-table">
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
                                </table>
                            </div>
                        </div>
                    </section>

                    <section v-if="activeTab === 'api'" class="tab-content"><div class="section-header"><h3>🤖 模型控制中心</h3></div></section>
                    <section v-if="activeTab === 'feedback'" class="tab-content"><AdminsComments /></section>
                    <section v-if="activeTab === 'system'" class="tab-content">
                        <div class="section-header"><h3>🎨 視覺主題設定</h3></div>
                        <div class="theme-picker">
                            <div v-for="(style, id) in themes" :key="id" class="theme-item" :class="{ 'is-selected': currentTheme === id }" @click="setTheme(id)">
                                <div class="theme-preview" :style="{ background: style.bgGradient }"><div class="preview-sidebar" :style="{ background: style.sidebarBg }"></div><div class="preview-accent" :style="{ background: style.primary }"></div></div>
                                <span>{{ style.name }}</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>

        <Transition name="fade">
            <div v-if="isEditModalOpen" class="modal-overlay" @click.self="isEditModalOpen = false">
                <div class="modal-card">
                    <div class="modal-head"><h3>修改個人資訊</h3><p>UID: A-{{ editForm.uid }}</p></div>
                    <div class="modal-body">
                        <div class="m-field"><label>帳號名稱</label><input v-model="editForm.username" /></div>
                        <div class="m-field"><label>真實姓名</label><input v-model="editForm.name" /></div>
                        <div class="m-field"><label>電子郵件</label><input v-model="editForm.email" /></div>
                        <div class="m-field"><label>職位名稱</label><input v-model="editForm.job" /></div>
                    </div>
                    <div class="modal-foot"><button class="btn-cancel" @click="isEditModalOpen = false">取消</button><button class="btn-save" @click="saveAdmin" :style="{ background: currentStyle.primary }">確認更新</button></div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* 此處保留您提供的所有 CSS，不進行任何位置調整 */
.admin-layout {
    display: flex;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
}

.background-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.effect-circle {
    position: absolute;
    border-radius: 50%;
    opacity: 0.12;
    animation: floating 20s infinite linear;
}

@keyframes floating {
    0% {
        transform: translate(0, 0) scale(1);
    }

    50% {
        transform: translate(40px, -40px) scale(1.1);
    }

    100% {
        transform: translate(0, 0) scale(1);
    }
}

.effect-circle:nth-child(odd) {
    background: #3b82f6;
    width: 400px;
    height: 400px;
}

.effect-circle:nth-child(even) {
    background: #10b981;
    width: 300px;
    height: 300px;
}

.sidebar-glass {
    width: 260px;
    backdrop-filter: blur(20px);
    border-right: 1px solid;
    display: flex;
    flex-direction: column;
    padding: 40px 0;
    z-index: 10;
}

.brand-zone {
    padding: 0 30px;
    margin-bottom: 40px;
    display: flex;
    align-items: center;
    gap: 15px;
}

.logo-box {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #b1e7eb, #c1cadf);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.nav-menu {
    flex: 1;
    padding: 0 15px;
}

.nav-link {
    width: 100%;
    border: none;
    padding: 14px 20px;
    border-radius: 12px;
    text-align: left;
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: 0.3s;
    background: transparent;
    color: inherit;
}

.nav-link.is-active {
    font-weight: 800;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.1);
}

.sidebar-bottom {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 0 20px;
    margin-top: auto;
}

.btn-logout {
    width: 100%;
    padding: 12px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1.5px solid rgba(239, 68, 68, 0.2);
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
    transition: 0.3s;
}

.btn-logout:hover {
    background: #ef4444;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.main-header {
    height: 70px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 40px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
}

.scroll-view {
    flex: 1;
    overflow-y: auto;
    padding: 35px 40px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    margin-bottom: 30px;
}

.stat-glass-card {
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: 22px 25px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.5);
}

.stat-value {
    font-size: 24px;
    font-weight: 800;
}

.stat-icon-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.table-wrapper {
    width: 100%;
    overflow-x: auto;
    border-radius: 12px;
    padding-bottom: 8px;
}

.mma-table {
    width: 100%;
    min-width: 1000px;
    border-collapse: collapse;
}

.mma-table th {
    text-align: left;
    padding: 20px 15px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.05);
    color: #64748b;
    font-size: 14px;
}

.mma-table td {
    padding: 20px 15px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.02);
    vertical-align: middle;
}

.uid-tag {
    padding: 5px 15px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    background: white;
    border: 1.5px solid;
    white-space: nowrap;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.admin-uid {
    border-color: #cbd5e1;
    color: #475569;
}

.user-uid {
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
}

.rank-badge {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    color: white;
    font-weight: 900;
    font-size: 12px;
}

.rank-1 {
    background: #fbbf24;
    box-shadow: 0 0 15px rgba(251, 191, 36, 0.6);
}

.rank-2 {
    background: #94a3b8;
}

.rank-3 {
    background: #b45309;
}

.btn-mma-action {
    background: white;
    border: 1.5px solid #3b82f6;
    color: #3b82f6;
    padding: 6px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 500;
    transition: 0.2s;
    white-space: nowrap;
}

.btn-mma-action:hover:not(.is-disabled) {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
}

.btn-mma-action.delete {
    border-color: #ef4444;
    color: #ef4444;
    margin-left: 8px;
}

.btn-mma-action.delete:hover {
    background: #ef4444;
    color: white;
}

.is-disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: #cbd5e1;
    color: #94a3b8;
    filter: grayscale(1);
}

.theme-picker {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-top: 25px;
}

.theme-item {
    cursor: pointer;
    text-align: center;
    transition: 0.3s;
}

.theme-preview {
    width: 140px;
    height: 90px;
    border-radius: 15px;
    position: relative;
    overflow: hidden;
    border: 3px solid transparent;
    transition: 0.3s;
}

.preview-sidebar {
    width: 35px;
    height: 100%;
    position: absolute;
    left: 0;
    opacity: 0.5;
}

.preview-accent {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    position: absolute;
    bottom: 10px;
    right: 10px;
}

.theme-item.is-selected .theme-preview {
    border-color: #3b82f6;
    transform: scale(1.08);
    box-shadow: 0 12px 25px rgba(59, 130, 246, 0.3);
}

.content-glass-card {
    border-radius: 24px;
    padding: 40px;
    border: 1px solid;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.05);
    min-height: 650px;
}

.group-title {
    font-size: 19px;
    font-weight: 700;
    margin-bottom: 25px;
    padding-left: 12px;
    border-left: 6px solid #3b82f6;
}

.mma-input {
    width: 400px;
    padding: 14px 22px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    outline: none;
    transition: 0.3s;
    margin-bottom: 35px;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-card {
    width: 440px;
    background: white;
    padding: 40px;
    border-radius: 28px;
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
}

.m-field {
    margin-bottom: 25px;
}

.m-field label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 10px;
    color: #475569;
}

.m-field input {
    width: 100%;
    padding: 12px 18px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    outline: none;
}

.modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 35px;
}

.btn-save {
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
}

.btn-cancel {
    color: rgb(255, 255, 255);
    border: none;
    padding: 12px 25px;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 700;
    background: #78d5f1;
    /* transform: translateY(-2px); */
    /* box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); */


}

.job-badge {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    white-space: nowrap;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* 💡 新排行榜專用 CSS (維持玻璃擬態風格) */
.admin-charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    margin-top: 50px;
}

.stat-card-mini {
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(15px);
    border-radius: 20px;
    padding: 25px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.stat-card-mini h4 {
    margin-top: 0;
    margin-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 10px;
    font-size: 1.1rem;
}

.rank-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    font-size: 0.95rem;
}

.rank-row strong {
    color: v-bind('currentStyle.primary');
}

.rankings-sub-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    margin-top: 50px;
}

.sub-rank-box {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.sub-rank-box .section-header h4 {
    font-size: 1.1rem;
    font-weight: 800;
    margin-bottom: 15px;
}

.mma-table.mini-mode {
    min-width: 100%;
}

.mma-table.mini-mode th,
.mma-table.mini-mode td {
    padding: 12px 10px;
    font-size: 13px;
}

.mini-rank {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(100, 116, 139, 0.1);
    border-radius: 50%;
    font-size: 11px;
    font-weight: 800;
}

.text-right {
    text-align: right !important;
}

.level-tag {
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11px;
}

.no-data {
    padding: 20px;
    text-align: center;
    opacity: 0.5;
    font-size: 14px;
}
/* 修改 job-badge：讓字體變大更酷炫 */
.job-badge {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 6px 14px;      /* 增加內距 */
    border-radius: 8px;
    font-size: 14px;        /* 字體放大 */
    font-weight: 800;       /* 字體加粗 */
    white-space: nowrap;
    border: 1px solid rgba(29, 78, 216, 0.2); /* 增加細微邊框增加質感 */
}

/* 修改 btn-mma-action：讓它縮小一點不搶戲 */
.btn-mma-action {
    background: white;
    border: 1.5px solid #3b82f6;
    color: #3b82f6;
    padding: 5px 12px;      /* 縮小按鈕尺寸 */
    border-radius: 8px;     /* 改為稍微方正一點點 */
    cursor: pointer;
    font-weight: 600;
    font-size: 11px;        /* 縮小文字，讓它變輔助性質 */
    transition: 0.2s;
    white-space: nowrap;
}


</style>