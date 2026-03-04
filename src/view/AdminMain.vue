<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import api from "@/api";

// 接收父組件狀態
const props = defineProps({
    activeTab: String,
    tabs: Array,
    currentStyle: Object,
    currentLoginAdmin: Object,

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
    await categoryStore.fetchAllRankings()
})

/* ========================
   數據計算與過濾
   ======================== */
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0
}).format(val || 0)

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

const testUsersFiltered = computed(() => {
    return userStore.formattedTestUsers.filter(u => {
        const s = searchQuery.value.toLowerCase();
        return u.username?.toLowerCase().includes(s) || u.name?.toLowerCase().includes(s);
    });
});

const isUserActive = (status) => {
    if (!status) return false;
    return String(status).trim().toLowerCase() === 'active';
}

const xpAmount = ref(100);
const nextLevelXP = ref(100);

const xpPercentage = computed(() => {
    const current = userStore.selectedUser?.xp || 0;
    const level = userStore.selectedUser?.level || 1;
    let required = 10000; // 預設為 level >= 100 的值

    if (level < 10) required = 100 + (level * 20);
    else if (level < 20) required = 300 + (level * 30);
    else if (level < 50) required = 1000 + (level * 50);
    else if (level < 100) required = 3000 + (level * 100);

    nextLevelXP.value = required;
    return Math.min((current / required) * 100, 100);
});

// 🕒 【一字不漏】隊友要求的最後登入格式化邏輯
const formatLastLogin = (dateStr) => {
    if (!dateStr || dateStr === '從未登入') return '從未登入';

    const now = new Date();
    const loginDate = new Date(dateStr);
    const diffInSeconds = Math.floor((now - loginDate) / 1000);

    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分鐘前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小時前`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;

    return loginDate.toLocaleDateString();
};

/* ========================
   🛠️ 建立邏輯：補回「聰明自動算號」功能
   ======================== */
const showCreateModal = ref(false);
const testForm = ref({ username: '', email: '', password: '123' });

// 監聽彈窗打開動作，自動檢查現有帳號並遞增編號
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
    if (!testForm.value.username.trim() || !testForm.value.email.trim()) return alert("請填寫必填欄位");
    const success = await userStore.createTestAccount(testForm.value);
    if (success) {
        showCreateModal.value = false;
        alert("帳號建立成功！");
    }
};

const showAdminModal = ref(false);
const adminForm = ref({ name: '', username: '', email: '', password: '' });

const handleCreateAdmin = async () => {
    if (!adminForm.value.username || !adminForm.value.email || !adminForm.value.name) return alert("請填寫所有必填欄位");
    const success = await userStore.createAdmin(adminForm.value);
    if (success) {
        showAdminModal.value = false;
        adminForm.value = { name: '', username: '', email: '', password: '' };
        alert("管理員建立成功！");
    }
};

/* ========================
   🛠️ 修復：執行操作後自動關閉視窗
   ======================== */
const handleToggleStatus = async (uid) => {
    await userStore.toggleUserStatus(uid);
    // 執行停用/恢復後，自動清空並關閉小視窗
    userStore.clearSelectedUser();
};

const handleDeleteUser = async (uid) => {
    const confirmed = await userStore.deleteUser(uid);
    // 如果註銷成功（或確認刪除），自動清空並關閉小視窗
    userStore.clearSelectedUser();
};

const confirmXP = async () => {
    await userStore.adjustXP(userStore.selectedUser.uid, xpAmount.value);
    alert("✨ 經驗值發放成功！");
};
// === 5. 個人資料修改 (移回主頁面統一管理) ===
const isEditModalOpen = ref(false)
const editForm = ref({ uid: '', username: '', name: '', email: '', job: '' })
const openEditModal = (u) => {
    editForm.value = { ...u }
    isEditModalOpen.value = true
}
const saveAdmin = async () => {
    try {
        await api.put(`/users/${editForm.value.uid}`, editForm.value)
        await userStore.loadUsers()
        isEditModalOpen.value = false
        alert('個人資料已更新！')
    } catch (err) { alert('更新失敗') }
}
const msgTitle = ref('📢 系統重要通知');
const msgDesc = ref('');
const isSending = ref(false);

const handleSend = async () => {
    if (!msgDesc.value) return alert("請輸入內容");
    isSending.value = true;
    try {
        await userStore.sendNotification(userStore.selectedUser.uid, msgTitle.value, msgDesc.value);
        alert("發送成功！");
        msgDesc.value = '';
    } finally {
        isSending.value = false;
    }
};

</script>
<template>
    <main class="main-content">
        <div class="scroll-view">


            <div class="content-glass-card"
                :style="{ backgroundColor: currentStyle.cardBg, borderColor: currentStyle.border }">



                <section class="tab-content">
                    <div class="search-box"><input v-model="searchQuery" placeholder="🔍 搜尋帳號、姓名或 Email..."
                            class="mma-input" /></div>

                    <div class="user-group-div admin-section">
                        <div class="group-title flex-header">🛡️ 管理權限組 ({{ adminFiltered.length }}) <button
                                class="btn-mma-action" @click="showAdminModal = true">+ 新增管理員</button></div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead>
                                    <tr>
                                        <th>編號</th>
                                        <th>帳號</th>
                                        <th>姓名</th>
                                        <th>職位</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="u in adminFiltered" :key="u.uid">
                                        <td><span class="uid-tag admin-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td>
                                        <td>{{ u.name }}</td>
                                        <td><span class="job-badge">{{ u.job || '管理者' }}</span></td>

                                        <td class="action-btns">
                                            <button class="btn-mma-action"
                                                :disabled="u.username !== currentLoginAdmin.username"
                                                :class="{ 'is-disabled': u.username !== currentLoginAdmin.username }"
                                                @click="openEditModal(u)"> {{ u.username === currentLoginAdmin.username
                                                ? '修改資訊' : '不可修改' }}
                                            </button>
                                        </td>
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
                                <button class="btn-mma-action" @click="userStore.resetTestAccounts()">♻️ 數據一鍵重置</button>
                            </div>
                        </div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead>
                                    <tr>
                                        <th>編號</th>
                                        <th>帳號</th>
                                        <th>姓名</th>
                                        <th>帳號狀態</th>
                                        <th>最後登入</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="u in testUsersFiltered" :key="u.uid">
                                        <td><span class="uid-tag test-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td>
                                        <td>{{ u.name }}</td>
                                        <td>{{ isUserActive(u.status) ? '使用中' : '已停用' }}</td>
                                        <td>{{ formatLastLogin(u.lastLogin) }}</td>
                                        <td class="action-btns">
                                            <button class="btn-mma-action"
                                                @click="userStore.showUserDetails(u.uid)">詳情</button>
                                            <button class="btn-mma-action delete"
                                                @click="userStore.deleteUser(u.uid)">註銷</button>
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
                                <thead>
                                    <tr>
                                        <th>編號</th>
                                        <th>帳號</th>
                                        <th>姓名</th>
                                        <th>Email</th>
                                        <th>帳號狀態</th>
                                        <th>最後登入</th>
                                        <th>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="u in normalUsersFiltered" :key="u.uid">
                                        <td><span class="uid-tag user-uid">{{ u.displayUid }}</span></td>
                                        <td class="font-bold">{{ u.username }}</td>
                                        <td>{{ u.name }}</td>
                                        <td>{{ u.email }}</td>
                                        <td>{{ isUserActive(u.status) ? '使用中' : '已停用' }}</td>
                                        <td>{{ formatLastLogin(u.lastLogin) }}</td>
                                        <td class="action-btns">
                                            <button class="btn-mma-action"
                                                @click="userStore.showUserDetails(u.uid)">詳情</button>
                                            <button class="btn-mma-action"
                                                :class="isUserActive(u.status) ? 'btn-warn' : 'btn-success'"
                                                @click="userStore.toggleUserStatus(u.uid)">{{ isUserActive(u.status) ?
                                                '停用' : '恢復' }}</button>
                                            <button class="btn-mma-action delete"
                                                @click="userStore.deleteUser(u.uid)">註銷</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div class="pagination-controls">
                                <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)"
                                    class="btn-mma-action"> 上一頁 </button>
                                <span class="page-info">第 {{ currentPage }} 頁</span>
                                <button :disabled="normalUsersFiltered.length < perPage"
                                    @click="changePage(currentPage + 1)" class="btn-mma-action"> 下一頁 </button>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>

        <div v-if="userStore.selectedUser" class="modal-overlay" @click.self="userStore.clearSelectedUser()">
            <div class="modal-glass-card animate-zoom-in">
                <div class="modal-header">
                    <h3>👤 用戶詳細資訊</h3><button class="btn-close" @click="userStore.clearSelectedUser()">✕</button>
                </div>
                <div class="modal-body" v-if="!userStore.loadingDetail">
                    <div class="user-profile-header">
                        <div class="avatar-circle">{{ userStore.selectedUser.name?.charAt(0) }}</div>
                        <div class="header-info">
                            <h4>{{ userStore.selectedUser.name }} <span class="status-badge"
                                    :class="'status-' + userStore.selectedUser.status">{{
                                        isUserActive(userStore.selectedUser.status) ? '使用中' : '已停用' }}</span></h4>
                            <p class="text-secondary">{{ userStore.selectedUser.job || '未設定職業' }}</p>
                        </div>
                    </div>
                    <hr class="modal-divider" />
                    <div class="detail-grid">
                        <div class="detail-item"><span class="label">帳號：</span><span class="val">{{
                                userStore.selectedUser.username }}</span></div>
                        <div class="detail-item"><span class="label">Email：</span><span class="val">{{
                                userStore.selectedUser.email }}</span></div>
                        <div class="detail-item">
                            <span class="label">註冊日期：</span>
                            <span class="val">
                                {{ userStore.selectedUser.created_at ? new
                                    Date(userStore.selectedUser.created_at).toLocaleDateString() : '無資料' }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="label">最後登入：</span>
                            <span class="val" :class="{ 'text-active': userStore.selectedUser.lastLogin }">{{
                                formatLastLogin(userStore.selectedUser.lastLogin) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">等級稱號：</span>
                            <span class="val level-tag">Lv.{{ userStore.selectedUser.level }} (XP: {{
                                userStore.selectedUser.xp }})</span>
                        </div>
                    </div>
                    <div class="xp-section">
                        <div class="xp-header"><span class="label">等級成長</span><span class="val">Lv.{{
                                userStore.selectedUser.level }}</span></div>
                        <div class="xp-progress-container">
                            <div class="xp-bar" :style="{ width: xpPercentage + '%' }"></div>
                        </div>
                        <div class="xp-text">{{ userStore.selectedUser.xp }} / {{ nextLevelXP }} XP</div>
                        <div class="xp-action-row"><input type="number" v-model="xpAmount" class="mma-input-sm"
                                placeholder="數值" />XP <button class="btn-xp-give" @click="confirmXP">發放獎勵</button></div>
                    </div>
                    <div class="detail-stats">
                        <div class="stat-box">
                            <small>💰 累積消費</small>
                            <div class="primary-text">{{ formatCurrency(userStore.selectedUser.totalSpent) }}</div>
                        </div>
                        <div class="stat-box">
                            <small>📝 記帳次數</small>
                            <div class="val-bold">{{ userStore.selectedUser.transactions }} 次</div>
                        </div>
                        <div class="stat-box">
                            <small>💎 剩餘點數</small>
                            <div class="val-bold">{{ userStore.selectedUser.points || 0 }} P</div>
                        </div>
                    </div>
                    <div class="notify-section">
                        <div class="section-title">✉️ 發送系統訊息</div>
                        <div class="notify-form">
                            <input v-model="msgTitle" placeholder="訊息主旨 (例如: 系統獎勵通知)" class="mma-input" />
                            <textarea v-model="msgDesc" placeholder="輸入詳細內容..." class="mma-textarea"></textarea>
                            <button class="btn-send" @click="handleSend">確認發送</button>
                        </div>
                    </div>
                    <div class="modal-footer-actions">
                        <button class="btn-action-outline"
                            :class="isUserActive(userStore.selectedUser.status) ? 'warn' : 'success'"
                            @click="handleToggleStatus(userStore.selectedUser.uid)">{{
                                isUserActive(userStore.selectedUser.status) ? '🚫 停用帳號' : '✅ 恢復帳號' }}</button>
                        <button class="btn-action-outline delete"
                            @click="handleDeleteUser(userStore.selectedUser.uid)">🗑️ 註銷用戶</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showAdminModal" class="modal-overlay" @click.self="showAdminModal = false">
            <div class="modal-glass-card">
                <div class="modal-header">
                    <h3>🛡️建立管理者帳戶(欄位為必填!)</h3>
                </div>
                <div class="m-field"><label>姓名</label><input v-model="adminForm.name" class="m-input"
                        placeholder="請輸入姓名" /></div>
                <div class="m-field"><label>帳號</label><input v-model="adminForm.username" class="m-input"
                        placeholder="admin_test" /></div>
                <div class="m-field"><label>Email</label><input v-model="adminForm.email" class="m-input"
                        placeholder="admin_test@example.com" /></div>
                <div class="m-field"><label>初始密碼</label><input type="password" v-model="adminForm.password"
                        class="m-input" placeholder="至少3位數" /></div>
                <div class="modal-foot-btns">
                    <button class="btn-cancel" @click="showAdminModal = false">取消</button>
                    <button class="btn-save" :style="{ background: currentStyle.primary }"
                        @click="handleCreateAdmin">建立</button>
                </div>
            </div>
        </div>

        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
            <div class="modal-glass-card">
                <div class="modal-header">
                    <h3>🧪 建立測試帳號</h3>
                </div>
                <div class="m-field"><label>帳號</label><input v-model="testForm.username" class="m-input" /></div>
                <div class="m-field"><label>Email</label><input v-model="testForm.email" class="m-input" /></div>
                <div class="m-field"><label>密碼</label><input type="password" v-model="testForm.password"
                        class="m-input" /></div>
                <div class="modal-foot-btns">
                    <button class="btn-cancel" @click="showCreateModal = false">取消</button>
                    <button class="btn-save" :style="{ background: currentStyle.primary }"
                        @click="handleCreateTest">建立</button>
                </div>
            </div>
        </div>
    </main>
    <Transition name="fade">
        <div v-if="isEditModalOpen" class="modal-overlay" @click.self="isEditModalOpen = false">
            <div class="modal-card">
                <div class="modal-head">
                    <h3>修改個人資訊</h3>
                    <p>UID: A-{{ editForm.uid }}</p>
                </div>
                <div class="modal-body">
                    <div class="m-field"><label>帳號名稱</label><input v-model="editForm.username" /></div>
                    <div class="m-field"><label>暱稱</label><input v-model="editForm.name" /></div>
                    <div class="m-field"><label>電子郵件</label><input v-model="editForm.email" /></div>
                    <div class="m-field"><label>職位名稱</label><input v-model="editForm.job" /></div>
                </div>
                <div class="modal-foot">
                    <button class="btn-cancel" @click="isEditModalOpen = false">取消</button>
                    <button class="btn-save" @click="saveAdmin"
                        :style="{ background: currentStyle.primary }">確認更新</button>
                </div>
            </div>
        </div>
    </Transition>
</template>


<style scoped>
@import "../assets/css/admin.css";

/* --- 表格與基礎佈局 --- */
td,
th {
    text-align: center !important;
}

.action-btns {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    gap: 12px !important;
    padding: 10px !important;
}

.group-title.flex-header {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-btns {
    display: flex;
    gap: 12px;
}

.pagination-footer {
    margin-top: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 30px;
    padding: 20px;
}

.pag-btn {
    min-width: 90px;
}

/* --- 彈窗 UI 修正 (Modal) --- */
.modal-glass-card {
    background: white;
    padding: 35px;
    border-radius: 28px;
    width: 440px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header h3 {
    margin: 0 0 25px 0;
    font-size: 1.5rem;
    color: #1e293b;
}

.m-field {
    margin-bottom: 20px;
    text-align: left;
}

.m-field label {
    display: block;
    font-size: 13px;
    font-weight: 800;
    color: #64748b;
    margin-bottom: 6px;
}

.m-input {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    outline: none;
}

.modal-foot-btns {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 30px;
}

.btn-save,
.btn-cancel {
    padding: 10px 22px;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    border: none;
}

.btn-cancel {
    background: #f1f5f9;
    color: #64748b;
}

.btn-save {
    color: white;
}

.mma-input {
    width: 100%;
    margin-bottom: 25px;
    padding: 12px 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
}

/* --- 🔒 權限限制樣式 --- */
.is-disabled {
    opacity: 0.5;
    cursor: not-allowed !important;
    background: #e2e8f0 !important;
    color: #94a3b8 !important;
    border-color: #cbd5e1 !important;
}

.pagination-controls {
    display: flex;
    /* 使用 Flexbox 佈局 */
    justify-content: center;
    /* 水平居中 */
    align-items: center;
    /* 垂直居中（確保按鈕與文字高度對齊） */
    gap: 20px;
    /* 控制按鈕與文字之間的間距 */
    margin-top: 30px;
    /* 與上方表格保持距離 */
    padding: 20px 0;
    /* 增加上下內距，讓視覺不擁擠 */
    width: 100%;
    /* 確保佔滿容器寬度以利置中 */
}

/* 針對分頁文字的微調 */
.page-info {
    font-weight: 600;
    color: inherit;
    /* 跟隨主題文字顏色 */
    min-width: 80px;
    /* 給予最小寬度，避免頁碼跳動時影響兩側按鈕位置 */
    text-align: center;
}
</style>