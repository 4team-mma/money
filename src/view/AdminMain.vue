<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import AdminsComments from './AdminsComments.vue'
import AdminModel from './AdminModel.vue'
import AdminData from './AdminData.vue'

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
   分頁邏輯
   ======================== */
const currentPage = ref(1)
const perPage = 20

const changePage = async (page) => {
    currentPage.value = page
    const skipVal = (page - 1) * perPage
    await userStore.fetchUsers(skipVal, perPage)
}

/* ========================
   初始載入
   ======================== */
onMounted(async () => {
    await userStore.fetchUsers(0, perPage)
})

/* ========================
   數據計算與過濾
   ======================== */
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { 
    style: 'currency', currency: 'TWD', minimumFractionDigits: 0 
}).format(val || 0)

const isUserActive = (status) => {
    if (!status) return false;
    return String(status).trim().toLowerCase() === 'active';
}

const totalTransactionAmount = computed(() => {
    if (!userStore.users) return 0
    return userStore.users.filter(u => u.role === 'user').reduce((sum, u) => sum + (Number(u.totalSpent) || 0), 0)
})

const adminFiltered = computed(() => userStore.formattedAdmins.filter(a => (a.name || '').includes(searchQuery.value) || (a.username || '').includes(searchQuery.value)))
const normalUsersFiltered = computed(() => userStore.formattedNormalUsers.filter(u => {
    const s = searchQuery.value.toLowerCase();
    return (u.username || '').toLowerCase().includes(s) || (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
}))
const testUsersFiltered = computed(() => userStore.formattedTestUsers.filter(u => u.username?.toLowerCase().includes(searchQuery.value.toLowerCase())))

// 格式化最後登入時間
const formatLastLogin = (dateStr) => {
    if (!dateStr || dateStr === '從未登入') return '從未登入';
    const now = new Date();
    const loginDate = new Date(dateStr);
    const diff = Math.floor((now - loginDate) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
    return loginDate.toLocaleDateString(); 
};

// 彈窗狀態...
const showCreateModal = ref(false);
const testForm = ref({ username: 'test', email: 'test@mail.com', password: 'password123' });
const handleCreateTest = async () => {
    const success = await userStore.createTestAccount(testForm.value);
    if (success) showCreateModal.value = false;
};

const showAdminModal = ref(false);
const adminForm = ref({ name: '', username: '', email: '', password: '' });
const handleCreateAdmin = async () => {
    const success = await userStore.createAdmin(adminForm.value);
    if (success) showAdminModal.value = false;
};
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
                    <div class="stat-info"><span class="stat-label">總註冊用戶</span><div class="stat-value">{{ userStore.users?.length || 0 }}</div></div>
                    <div class="stat-icon-circle" style="background: #3b82f620; color: #3b82f6;">👥</div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-info"><span class="stat-label">總用戶消費總額</span><div class="stat-value">{{ formatCurrency(totalTransactionAmount) }}</div></div>
                    <div class="stat-icon-circle" style="background: #10b98120; color: #10b981;">💰</div>
                </div>
                <div class="stat-glass-card">
                    <div class="stat-info"><span class="stat-label">系統反應</span><div class="stat-value">28ms</div></div>
                    <div class="stat-icon-circle" style="background: #f59e0b20; color: #f59e0b;">⚡</div>
                </div>
            </div>

            <div class="content-glass-card" :style="{ backgroundColor: currentStyle.cardBg, borderColor: currentStyle.border }">
                
                <section v-if="activeTab === 'analytics'" class="tab-content">
                    <AdminData :currentStyle="currentStyle" />
                </section>

                <section v-if="activeTab === 'users'" class="tab-content">
                    <div class="search-box"><input v-model="searchQuery" placeholder="🔍 搜尋帳號、姓名或 Email..." class="mma-input" /></div>

                    <div class="user-group-div admin-section">
                        <div class="group-title flex-header">🛡️ 管理權限組 ({{ adminFiltered.length }}) <button class="btn-mma-action" @click="showAdminModal = true">+ 新增管理員</button></div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead><tr><th>編號</th><th>帳號</th><th>姓名</th><th>職位</th><th class="text-center">操作</th></tr></thead>
                                <tbody>
                                    <tr v-for="u in adminFiltered" :key="u.uid">
                                        <td><span class="uid-tag admin-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td><td>{{ u.name }}</td><td><span class="job-badge">{{ u.job || '管理者' }}</span></td>
                                        <td class="action-btns"><button class="btn-mma-action" :disabled="u.username !== currentLoginAdmin.username" :class="{ 'is-disabled': u.username !== currentLoginAdmin.username }" @click="emit('open-edit', u)">修改資訊</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="user-group-div test-section" style="margin-top: 50px;">
                        <div class="group-title flex-header">
                            🧪 測試模擬組 ({{ testUsersFiltered.length }})
                            <div class="header-btns">
                                <button class="btn-mma-action" @click="showCreateModal = true">+ 建立帳號</button>
                                <button class="btn-mma-action" @click="userStore.generateTestData()">🎲 注入數據</button>
                                <button class="btn-mma-action" @click="userStore.resetTestAccounts()">♻️ 一鍵重置</button>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead><tr><th>編號</th><th>帳號</th><th>姓名</th><th>帳號狀態</th><th>最後登入</th><th class="text-center">操作</th></tr></thead>
                                <tbody>
                                    <tr v-for="u in testUsersFiltered" :key="u.uid">
                                        <td><span class="uid-tag test-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td><td>{{ u.name }}</td>
                                        <td>{{ isUserActive(u.status) ? '使用中' : '已停用' }}</td>
                                        <td>{{ formatLastLogin(u.lastLogin) }}</td>
                                        <td class="action-btns">
                                            <button class="btn-mma-action" @click="userStore.showUserDetails(u.uid)">詳情</button>
                                            <button class="btn-mma-action delete" @click="userStore.deleteUser(u.uid)">註銷</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="user-group-div" style="margin-top: 50px;">
                        <div class="group-title">👤 一般用戶組 ({{ normalUsersFiltered.length }})</div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead><tr><th>編號</th><th>帳號</th><th>姓名</th><th>電子郵件</th><th>帳號狀態</th><th>最後登入</th><th class="text-center">操作</th></tr></thead>
                                <tbody>
                                    <tr v-for="u in normalUsersFiltered" :key="u.uid">
                                        <td><span class="uid-tag user-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td><td>{{ u.name }}</td><td>{{ u.email }}</td>
                                        <td>{{ isUserActive(u.status) ? '使用中' : '已停用' }}</td>
                                        <td>{{ formatLastLogin(u.lastLogin) }}</td>
                                        <td class="action-btns">
                                            <button class="btn-mma-action" @click="userStore.showUserDetails(u.uid)">詳情</button>
                                            <button class="btn-mma-action" :class="isUserActive(u.status) ? 'btn-warn' : 'btn-success'" @click="userStore.toggleUserStatus(u.uid)">{{ isUserActive(u.status) ? '停用' : '恢復' }}</button>
                                            <button class="btn-mma-action delete" @click="userStore.deleteUser(u.uid)">註銷</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="pagination-footer">
                                <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)" class="btn-mma-action pag-btn">上一頁</button>
                                <span class="page-info">第 <strong>{{ currentPage }}</strong> 頁</span>
                                <button :disabled="normalUsersFiltered.length < perPage" @click="changePage(currentPage + 1)" class="btn-mma-action pag-btn">下一頁</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-if="activeTab === 'api'" class="tab-content animate-fade-in"><AdminModel :currentStyle="currentStyle" /></section>
                <section v-if="activeTab === 'feedback'" class="tab-content"><AdminsComments /></section>
            </div>
        </div>
    </main>
</template>

<style scoped>
@import "../assets/css/admin.css";
td { text-align: center !important; }
th { text-align: center !important; }
.action-btns { display: flex !important; justify-content: center !important; align-items: center !important; gap: 6px !important; padding: 5px !important; }
.group-title.flex-header { display: flex; align-items: center; justify-content: flex-start; }
.header-btns { display: flex; gap: 12px; padding: 10px; }
.pagination-footer { margin-top: 40px; display: flex; justify-content: center; align-items: center; gap: 30px; }
.pag-btn { min-width: 90px; }

.btn-mma-action{
    margin: 10px;
}
</style>