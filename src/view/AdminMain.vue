<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import AdminsComments from './AdminsComments.vue'
import AdminModel from './AdminModel.vue'
import AdminData from './AdminData.vue'

const props = defineProps({
    activeTab: String,
    tabs: Array,
    currentStyle: Object,
    currentLoginAdmin: Object,
    themes: Object,
    currentTheme: String
})

const emit = defineEmits(['open-edit', 'set-theme'])
const userStore = useUserStore()
const searchQuery = ref('')
const currentPage = ref(1)
const perPage = 20

const changePage = async (page) => {
    currentPage.value = page
    await userStore.fetchUsers((page - 1) * perPage, perPage)
}

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val || 0)

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

const formatLastLogin = (dateStr) => {
    if (!dateStr || dateStr === '從未登入') return '從未登入';
    const loginDate = new Date(dateStr);
    return isNaN(loginDate) ? '從未登入' : loginDate.toLocaleDateString();
};

/* ========================
   🛠️ 聰明建立邏輯：自動遞增帳號
   ======================== */
const showCreateModal = ref(false);
const testForm = ref({ username: '', email: '', password: '123' });

// 監聽彈窗打開動作，自動算號
watch(showCreateModal, (val) => {
    if (val) {
        const usernames = userStore.users.map(u => u.username.toLowerCase());
        if (!usernames.includes('test')) {
            testForm.value = { username: 'test', email: 'test@gmail.com', password: '123' };
        } else {
            let i = 1;
            while (usernames.includes(`test${i}`)) { i++; }
            testForm.value = { username: `test${i}`, email: `test${i}@gmail.com`, password: '123' };
        }
    }
});

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

onMounted(() => userStore.fetchUsers(0, perPage));
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

                <section v-if="activeTab === 'api'" class="tab-content animate-fade-in">
                    <AdminModel :currentStyle="currentStyle" />
                </section>

                <section v-if="activeTab === 'users'" class="tab-content">
                    <div class="search-box"><input v-model="searchQuery" placeholder="🔍 搜尋帳號、姓名或 Email..." class="mma-input" /></div>

                    <div class="user-group-div admin-section">
                        <div class="group-title flex-header">🛡️ 管理權限組 <button class="btn-mma-action" @click="showAdminModal = true">+ 新增管理員</button></div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead><tr><th>編號</th><th>帳號</th><th>姓名</th><th>職位</th><th>操作</th></tr></thead>
                                <tbody>
                                    <tr v-for="u in adminFiltered" :key="u.uid">
                                        <td><span class="uid-tag admin-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td><td>{{ u.name }}</td><td><span class="job-badge">{{ u.job || '管理者' }}</span></td>
                                        <td class="action-btns"><button class="btn-mma-action" :disabled="u.username !== currentLoginAdmin.username" @click="emit('open-edit', u)">修改資訊</button></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="user-group-div test-section" style="margin-top: 50px;">
                        <div class="group-title flex-header">
                            <span>🧪 測試模擬組 ({{ testUsersFiltered.length }})</span>
                            <div class="header-btns">
                                <button class="btn-mma-action" @click="showCreateModal = true">+ 建立測試帳號</button>
                                <button class="btn-mma-action" @click="userStore.generateTestData()">🎲 注入數據</button>
                                <button class="btn-mma-action" @click="userStore.resetTestAccounts()">♻️ 一鍵重置</button>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead><tr><th>編號</th><th>帳號</th><th>姓名</th><th>帳號狀態</th><th>最後登入</th><th>操作</th></tr></thead>
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
                                <thead><tr><th>編號</th><th>帳號</th><th>姓名</th><th>電子郵件</th><th>帳號狀態</th><th>最後登入</th><th>操作</th></tr></thead>
                                <tbody>
                                    <tr v-for="u in normalUsersFiltered" :key="u.uid">
                                        <td><span class="uid-tag user-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td><td>{{ u.name }}</td><td>{{ u.email }}</td>
                                        <td>{{ isUserActive(u.status) ? '使用中' : '已停用' }}</td>
                                        <td>{{ formatLastLogin(u.lastLogin) }}</td>
                                        <td class="action-btns">
                                            <button class="btn-mma-action" @click="userStore.showUserDetails(u.uid)">詳情</button>
                                            <button class="btn-mma-action" :class="isUserActive(u.status) ? 'btn-warn' : 'btn-success'" @click="userStore.toggleUserStatus(u.uid)">
                                                {{ isUserActive(u.status) ? '停用' : '恢復' }}
                                            </button>
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

                <section v-if="activeTab === 'feedback'" class="tab-content"><AdminsComments /></section>

                <section v-if="activeTab === 'system'" class="tab-content">
                    <div class="section-header"><h3>🎨 視覺主題設定</h3></div>
                    <div class="theme-picker">
                        <div v-for="(style, id) in themes" :key="id" class="theme-item"
                            :class="{ 'is-selected': currentTheme === id }" @click="emit('set-theme', id)">
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

        <div v-if="showAdminModal" class="modal-overlay" @click.self="showAdminModal = false">
            <div class="modal-glass-card">
                <div class="modal-header"><h3>🛡️ 建立管理帳限</h3></div>
                <div class="m-field"><label>姓名</label><input v-model="adminForm.name" class="m-input" /></div>
                <div class="m-field"><label>帳號</label><input v-model="adminForm.username" class="m-input" /></div>
                <div class="m-field"><label>Email</label><input v-model="adminForm.email" class="m-input" /></div>
                <div class="m-field"><label>初始密碼</label><input type="password" v-model="adminForm.password" class="m-input" /></div>
                <div class="modal-foot-btns">
                    <button class="btn-cancel" @click="showAdminModal = false">取消</button>
                    <button class="btn-save" :style="{ background: currentStyle.primary }" @click="handleCreateAdmin">建立</button>
                </div>
            </div>
        </div>

        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
            <div class="modal-glass-card">
                <div class="modal-header"><h3>🧪 建立測試帳號</h3></div>
                <div class="m-field"><label>帳號</label><input v-model="testForm.username" class="m-input" /></div>
                <div class="m-field"><label>Email</label><input v-model="testForm.email" class="m-input" /></div>
                <div class="m-field"><label>密碼</label><input type="password" v-model="testForm.password" class="m-input" /></div>
                <div class="modal-foot-btns">
                    <button class="btn-cancel" @click="showCreateModal = false">取消</button>
                    <button class="btn-save" :style="{ background: currentStyle.primary }" @click="handleCreateTest">建立</button>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
@import "../assets/css/admin.css";
td, th { text-align: center !important; }
.action-btns { display: flex !important; justify-content: center !important; align-items: center !important; gap: 12px !important; padding: 10px !important; }
.group-title.flex-header { display: flex; align-items: center; gap: 20px; }
.header-btns { display: flex; gap: 12px; }
.pagination-footer { margin-top: 40px; display: flex; justify-content: center; align-items: center; gap: 30px; padding: 20px; }
.pag-btn { min-width: 90px; }

/* 🛠️ 彈窗 UI 修復：解決 image_7fbafc 按鈕太開問題 */
.modal-glass-card {
    background: white; padding: 35px; border-radius: 28px; width: 440px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.modal-header h3 { margin: 0 0 25px 0; font-size: 1.5rem; color: #1e293b; }
.m-field { margin-bottom: 20px; text-align: left; }
.m-field label { display: block; font-size: 13px; font-weight: 800; color: #64748b; margin-bottom: 6px; }
.m-input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; outline: none; }
.modal-foot-btns { display: flex; justify-content: flex-end; gap: 12px; margin-top: 30px; }
.btn-save, .btn-cancel { padding: 10px 22px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; }
.btn-cancel { background: #f1f5f9; color: #64748b; }
.btn-save { color: white; }
.mma-input { width: 100%; margin-bottom: 25px; padding: 12px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
</style>