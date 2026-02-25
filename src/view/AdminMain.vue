<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import AdminsComments from './AdminsComments.vue'
import AdminModel from './AdminModel.vue'

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
const skip = computed(() => (currentPage.value - 1) * perPage)

const changePage = async (page) => {
    currentPage.value = page
    const skipVal = (page - 1) * perPage
    await userStore.fetchUsers(skipVal, perPage)
}

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



/* ========================
   初始載入
   ======================== */
onMounted(async () => {
    await userStore.fetchUsers(0, perPage)
    await categoryStore.fetchAllRankings() // 確保排行榜數據有抓取
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

const xpAmount = ref(100);
const nextLevelXP = ref(100);

const xpPercentage = computed(() => {
    const current = userStore.selectedUser?.xp || 0;
    // 這裡建議與後端 GameService.get_required_xp 公式同步
    const level = userStore.selectedUser?.level || 1;
    let required = 100; 
    if (level < 10) required = 100 + (level * 20);
    else if (level < 20) required = 300 + (level * 30);
    // ...以此類推
    nextLevelXP.value = required;
    return Math.min((current / required) * 100, 100);
});

const confirmXP = async () => {
    await userStore.adjustXP(userStore.selectedUser.uid, xpAmount.value);
    alert("✨ 經驗值發放成功！");
};

const msgTitle = ref('📢 系統重要通知');
const msgDesc = ref('');
const isSending = ref(false);

const handleSend = async () => {
    if (!msgDesc.value) return alert("請輸入內容");
    isSending.value = true;
    
    try {
        await userStore.sendNotification(
            userStore.selectedUser.uid, 
            msgTitle.value, 
            msgDesc.value
        );
        alert("發送成功！");
        msgDesc.value = ''; // 清空內容
    } finally {
        isSending.value = false;
    }
};

// 格式化最後登入時間
const formatLastLogin = (dateStr) => {
    if (!dateStr || dateStr === '從未登入') return '從未登入';
    
    const now = new Date();
    const loginDate = new Date(dateStr);
    const diffInSeconds = Math.floor((now - loginDate) / 1000);

    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分鐘前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小時前`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} 天前`;
    
    return loginDate.toLocaleDateString(); // 超過一個月顯示具體日期
};

const showCreateModal = ref(false);
const testForm = ref({ username: 'test', email: 'test@mail.com', password: 'password123' });

const handleCreateTest = async () => {
    // 🛡️ 必填欄位檢查
    if (!testForm.value.username.trim()) return alert("請輸入帳號");
    if (!testForm.value.email.trim()) return alert("請輸入 Email");
    if (!testForm.value.password) return alert("請輸入密碼");

    // 📧 簡單的 Email 格式檢查
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testForm.value.email)) {
        return alert("請輸入有效的 Email 格式");
    }
    const success = await userStore.createTestAccount(testForm.value);
    if (success) {
        showCreateModal.value = false;
        // 清空表單
        testForm.value = { username: 'test', email: 'test@mail.com', password: 'password123' };
        searchQuery.value = ''; 
        showCreateModal.value = false;
        alert("帳號建立成功！現在可以用此帳號登入模擬測試。");
    }
};

const showAdminModal = ref(false);
const adminForm = ref({ name: '', username: '', email: '', password: '' });

const handleCreateAdmin = async () => {
    if (!adminForm.value.username || !adminForm.value.email || !adminForm.value.name) {
        return alert("請填寫所有必填欄位");
    }
    
    const success = await userStore.createAdmin(adminForm.value);
    if (success) {
        showAdminModal.value = false;
        adminForm.value = { name: '', username: '', email: '', password: '' };
        alert("管理員建立成功！");
    }
};
</script>

<template>
    <main class="main-content">
        <!-- 頂部 Header -->
        <header class="main-header">
            <div class="breadcrumb">
                控制中心 / 
                <span :style="{ color: currentStyle.primary }">
                    {{ tabs.find(t => t.id === activeTab)?.label }}
                </span>
            </div>
            <div class="user-status">
                <span class="dot-online"></span> 
                登入者：<strong>{{ currentLoginAdmin.username }}</strong>
            </div>
        </header>

        <div class="scroll-view">
            <!-- 統計卡片 -->
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
                        <div class="stat-value" >
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

            <div class="content-glass-card" :style="{ backgroundColor: currentStyle.cardBg, borderColor: currentStyle.border }">
                <!-- 1. 數據分析 Tab -->
                <section v-if="activeTab === 'analytics'" class="tab-content">
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
                                        <th>排名</th>
                                        <th>帳號</th>
                                        <th>暱稱</th>
                                        <th>累積金額</th>
                                        <th>次數</th>
                                        <th>單筆平均</th>
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
                                        <th>排名</th>
                                        <th>項目類別</th>
                                        <th class="text-right">累積總金額</th>
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
                                        <th>排名</th>
                                        <th>用戶暱稱</th>
                                        <th class="text-right">記帳頻率</th>
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
                                        <th>排名</th>
                                        <th>用戶暱稱</th>
                                        <th class="text-right">目前總餘額</th>
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
                                        <th>排名</th>
                                        <th>用戶暱稱</th>
                                        <th>目前稱號</th>
                                        <th class="text-right">總經驗值</th>
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
                </section>

                <!-- 2. 用戶管理 Tab -->
                <section v-if="activeTab === 'users'" class="tab-content">
                    <div class="search-box">
                        <input v-model="searchQuery" placeholder="🔍 搜尋帳號、姓名或 Email..." class="mma-input" />
                    </div>

                    <!-- 管理員組 -->
                    <div class="user-group-div admin-section">
                        <div class="group-title">
                            🛡️ 管理權限組 ({{ adminFiltered.length }})
                            <button class="btn-mma-action" @click="showAdminModal = true">+ 新增管理員</button>
                        </div>

                        <!-- 建立管理員彈窗 -->
                        <div v-if="showAdminModal" class="modal-overlay" @click.self="showAdminModal = false">
                            <div class="modal-glass-card">
                                <h3>🛡️ 建立新管理權限</h3>
                                <div class="form-item">
                                    <label><span class="required">*</span> 管理員姓名</label>
                                    <input v-model="adminForm.name" placeholder="請輸入姓名" class="mma-input" />
                                </div>
                                <div class="form-item">
                                    <label><span class="required">*</span> 登入帳號</label>
                                    <input v-model="adminForm.username" placeholder="admin_user" class="mma-input" />
                                </div>
                                <div class="form-item">
                                    <label><span class="required">*</span> Email</label>
                                    <input v-model="adminForm.email" type="email" class="mma-input" />
                                </div>
                                <div class="form-item">
                                    <label><span class="required">*</span> 初始密碼</label>
                                    <input type="password" v-model="adminForm.password" class="mma-input" />
                                </div>
                                <div class="modal-footer">
                                    <button class="btn-mma-action" @click="showAdminModal = false">取消</button>
                                    <button class="btn-mma-action" @click="handleCreateAdmin">確認建立</button>
                                </div>
                            </div>
                        </div>

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
                                        <td>
                                            <button class="btn-mma-action"
                                                :disabled="u.username !== currentLoginAdmin.username"
                                                :class="{ 'is-disabled': u.username !== currentLoginAdmin.username }"
                                                @click="emit('open-edit', u)">
                                                {{ u.username === currentLoginAdmin.username ? '修改資訊' : '不可修改' }}
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 🧪 測試帳號群組 -->
                    <div class="user-group-div test-section" style="margin-top: 50px;">
                        <div class="group-title">
                            🧪 測試模擬組 ({{ testUsersFiltered.length }})
                            <button class="btn-mma-action" @click="showCreateModal = true">+ 建立測試帳號</button>
                            <button class="btn-mma-action" @click="userStore.generateTestData()">
                                🎲 注入測試數據
                            </button>
                            <button class="btn-mma-action" @click="userStore.resetTestAccounts()">
                                ♻️ 一鍵重置數據
                            </button>
                        </div>

                        <!-- 建立測試帳號的小彈窗 -->
                        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
                            <div class="modal-glass-card mini">
                                <h3>🧪 快速建立測試帳號</h3>
                                <div class="form-item">
                                    <label>帳號</label>
                                    <input v-model="testForm.username" placeholder="test_user" class="mma-input" />
                                </div>
                                <div class="form-item">
                                    <label>Email</label>
                                    <input v-model="testForm.email" placeholder="test@example.com" class="mma-input" />
                                </div>
                                <div class="form-item">
                                    <label>密碼</label>
                                    <input type="password" v-model="testForm.password" class="mma-input" />
                                </div>
                                <div class="modal-footer">
                                    <button class="btn-mma-action" @click="showCreateModal = false">取消</button>
                                    <button class="btn-mma-action" @click="handleCreateTest">確認建立</button>
                                </div>
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
                                        <td>{{ u.status === 'active' ? '使用中' : '已停用' }}</td>
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

                    <!-- 一般用戶組 -->
                    <div class="user-group-div" style="margin-top: 50px;">
                        <div class="group-title">
                            👤 一般用戶組 ({{ normalUsersFiltered.length }})
                        </div>
                        <div class="table-wrapper">
                            <table class="mma-table">
                                <thead>
                                    <tr>
                                        <th>編號</th>
                                        <th>帳號</th>
                                        <th>姓名</th>
                                        <th>電子郵件</th>
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
                                        <td>{{ u.status === 'active' ? '使用中' : '已停用' }}</td>
                                        <td>{{ formatLastLogin(u.lastLogin) }}</td>
                                        <td class="action-btns">
                                            <button class="btn-mma-action" 
                                                @click="userStore.showUserDetails(u.uid)"
                                            >詳情</button>
                                            <!-- 停用/啟用按鈕：根據狀態變換顏色與文字 -->
                                            <button 
                                                class="btn-mma-action" 
                                                :class="u.status === 'active' ? 'btn-warn' : 'btn-success'"
                                                @click="userStore.toggleUserStatus(u.uid)"
                                            >
                                                {{ u.status === 'active' ? '停用' : '恢復' }}
                                            </button>
                                            <button class="btn-mma-action delete" @click="userStore.deleteUser(u.uid)">註銷</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <!-- 分頁控制 -->
                            <div class="pagination-controls">
                                <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)" class="btn-mma-action"> 上一頁 </button>
                                <span class="page-info">第 {{ currentPage }} 頁</span>
                                <button :disabled="normalUsersFiltered.length < perPage" @click="changePage(currentPage + 1)" class="btn-mma-action"> 下一頁 </button>
                            </div>
                        </div>
                    </div>
                </section>
<!-- 模型區塊 -->
                <section v-if="activeTab === 'api'" class="tab-content animate-fade-in">
                <AdminModel :currentStyle="currentStyle" />
                </section>
<!-- 模型區塊結尾 -->


<!-- 回饋區塊 -->
                <section v-if="activeTab === 'feedback'" class="tab-content">
                    <AdminsComments />
                </section>
<!-- 回饋區塊結尾 -->

                <section v-if="activeTab === 'system'" class="tab-content">
                    <div class="section-header">
                        <h3>🎨 視覺主題設定</h3>
                    </div>
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
    </main>

        <!-- 🚀 用戶管理 詳情彈窗 (Modal) -->
        <div v-if="userStore.selectedUser" class="modal-overlay" @click.self="userStore.clearSelectedUser()">
            <div class="modal-glass-card animate-zoom-in">
                <div class="modal-header">
                    <h3>👤 用戶詳細資訊</h3>
                    <button class="btn-close" @click="userStore.clearSelectedUser()">✕</button>
                </div>
                <div class="modal-body" v-if="!userStore.loadingDetail">
                    <!-- 第一區：基本頭像與狀態 -->
                    <div class="user-profile-header">
                        <div class="avatar-circle">{{ userStore.selectedUser.name?.charAt(0) }}</div>
                        <div class="header-info">
                            <h4>{{ userStore.selectedUser.name }} 
                            <span class="status-badge" :class="'status-' + userStore.selectedUser.status">
                                {{ userStore.selectedUser.status === 'active' ? '● 正常' : '● 停用中' }}
                            </span>
                            </h4>
                            <p class="text-secondary">{{ userStore.selectedUser.job || '未設定職業' }}</p>
                        </div>
                    </div>

                    <hr class="modal-divider"/>

                    <!-- 第二區：詳細帳戶資料 -->
                    <div class="detail-grid">
                        <div class="detail-item"><span class="label">帳號：</span><span class="val">{{ userStore.selectedUser.username }}</span></div>
                        <div class="detail-item"><span class="label">Email：</span><span class="val">{{ userStore.selectedUser.email }}</span></div>
                        <div class="detail-item">
                            <span class="label">註冊日期：</span>
                            <span class="val">
                                {{ userStore.selectedUser.created_at ? new Date(userStore.selectedUser.created_at).toLocaleDateString() : '無資料' }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="label">最後登入：</span>
                            <span class="val" :class="{'text-active': userStore.selectedUser.lastLogin}">
                                {{ formatLastLogin(userStore.selectedUser.lastLogin) }}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="label">等級稱號：</span>
                            <span class="val level-tag">Lv.{{ userStore.selectedUser.level }} (XP: {{ userStore.selectedUser.xp }})</span>
                        </div>
                    </div>

                    <!-- XP經驗條 -->
                    <div class="xp-section">
                        <div class="xp-header">
                            <span class="label">等級成長</span>
                            <span class="val">Lv.{{ userStore.selectedUser.level }}</span>
                        </div>
                        <!-- 進度條視覺化 -->
                        <div class="xp-progress-container">
                            <div class="xp-bar" :style="{ width: xpPercentage + '%' }"></div>                                </div>
                        <div class="xp-text">
                            {{ userStore.selectedUser.xp }} / {{ nextLevelXP }} XP
                        </div>

                        <!-- 手動調整工具 -->
                        <div class="xp-action-row">
                            <input type="number" v-model="xpAmount" class="mma-input-sm" placeholder="數值" />XP
                            <button class="btn-xp-give" @click="confirmXP">發放獎勵</button>
                        </div>
                    </div>

                    <!-- 第三區：消費數據統計 -->
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

                    <!-- 第四區：快速管理操作 -->
                    <div class="modal-footer-actions">
                        <button 
                            class="btn-action-outline" 
                            :class="userStore.selectedUser.status === 'active' ? 'warn' : 'success'"
                            @click="userStore.toggleUserStatus(userStore.selectedUser.uid)"
                        >
                            {{ userStore.selectedUser.status === 'active' ? '🚫 停用帳號' : '✅ 恢復帳號' }}
                        </button>
                        <button class="btn-action-outline delete" @click="userStore.deleteUser(userStore.selectedUser.uid)">
                            🗑️ 註銷用戶
                        </button>
                    </div>
                </div>
                <div v-else class="modal-loading">讀取中...</div>
            </div>
        </div>
</template>

<style scoped>
@import "../assets/css/admin.css";
</style>