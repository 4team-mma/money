<script setup>
import { ref, onMounted } from 'vue'
import { changePassword, deleteMe } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { settingApi } from '@/api/setting'

const router = useRouter()
const security = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const loginActivities = ref([])
const isLoading = ref(true)

// --- 🌟 修正 Windows 11 偵測的補丁 ---
const getRealOS = (item) => {
    let os = item.device_info || '未知裝置'
    // 瀏覽器通常把 Win11 報成 Win10，這裡做顯示上的優化
    if (os.includes("Windows") && os.includes("10")) {
        return "Windows 11/10"
    }
    return os
}

const fetchLoginActivities = async () => {
    isLoading.value = true
    try {
        const response = await settingApi.getLoginActivities()
        const actualData = response.data || response; 
        if (actualData && Array.isArray(actualData)) {
            // 我們按日期排序，確保最新在最上面
            loginActivities.value = actualData.sort((a, b) => new Date(b.login_at) - new Date(a.login_at))
        }
    } catch (error) {
        console.error('無法獲取登入紀錄:', error)
        loginActivities.value = []
    } finally {
        isLoading.value = false
    }
}

onMounted(() => {
    fetchLoginActivities()
})

const formatDate = (dateStr) => {
    if (!dateStr) return '未知時間'
    try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-TW', { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', hour12: false 
        })
    } catch (e) {
        return dateStr
    }
}

// --- 執行變更密碼 (保留你原本的功能) ---
const handlePasswordChange = async () => {
    if (!security.value.currentPassword || !security.value.newPassword) {
        ElMessage.warning('請填寫完整欄位')
        return
    }
    if (security.value.newPassword !== security.value.confirmPassword) {
        ElMessage.error('新密碼與確認密碼不符')
        return
    }
    try {
        await changePassword({
            current_password: security.value.currentPassword,
            new_password: security.value.newPassword
        })
        ElMessage.success('密碼已成功變更，下次請使用新密碼登入')
        security.value.currentPassword = ''
        security.value.newPassword = ''
        security.value.confirmPassword = ''
    } catch (error) {
        ElMessage.error(error.response?.data?.detail || '變更失敗')
    }
}

// --- 執行刪除帳戶 (保留你原本的功能) ---
const handleDeleteAccount = () => {
    ElMessageBox.confirm(
        '此動作無法復原！您的所有財務資料、報表與設定都將永久刪除。確定要繼續嗎？',
        '警告危險：刪除帳戶',
        {
            confirmButtonText: '確定刪除',
            cancelButtonText: '我再想想',
            type: 'warning',
            confirmButtonClass: 'el-button--danger',
            distinguishCancelAndClose: true,
        }
    ).then(async () => {
        try {
            await deleteMe()
            ElMessage.success('您的帳號與資料已全數清空。')
            localStorage.clear() 
            window.location.href = '/'
        } catch (error) {
            console.error(error)
            ElMessage.error('刪除過程發生錯誤')
        }
    }).catch(() => {
        console.log('使用者取消刪除操作')
    })
}
</script>

<template>
    <div class="tab-content">
        <div class="settings-section">
            <h2>密碼安全</h2>
            <div class="form-group">
                <label>目前密碼</label>
                <input type="password" v-model="security.currentPassword" placeholder="請輸入目前的密碼">
            </div>
            <div class="form-group">
                <label>新密碼</label>
                <input type="password" v-model="security.newPassword" placeholder="至少 3 個字元">
            </div>
            <div class="form-group">
                <label>確認新密碼</label>
                <input type="password" v-model="security.confirmPassword" placeholder="再次輸入新密碼">
            </div>
            <button class="btn-primary" @click="handlePasswordChange">確認變更</button>
        </div>

        <div class="settings-section">
            <h2>登入活動</h2>
            <div class="login-history">
                <p v-if="isLoading" class="loading-text">載入中...</p>
                <p v-else-if="loginActivities.length === 0" class="empty-text">暫無最近登入紀錄</p>
                
                <template v-else>
                    <div v-for="item in loginActivities.filter(a => a.is_current)" :key="'current-'+item.activity_id" class="login-item current-session">
                        <div class="login-icon active-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
                            </svg>
                        </div>
                        <div class="login-info">
                            <h4>{{ getRealOS(item) }} (目前作業階段)</h4>
                            <p>{{ item.browser }} • {{ item.ip_address }} • {{ item.location }}</p>
                        </div>
                        <span class="login-status current">使用中</span>
                    </div>

                    <div v-if="loginActivities.some(a => !a.is_current)" class="activity-divider">
                        <span>最近登入紀錄</span>
                    </div>

                    <div v-for="item in loginActivities.filter(a => !a.is_current).slice(0, 3)" :key="item.activity_id" class="login-item history-item">
                        <div class="login-info">
                            <h4>{{ getRealOS(item) }}</h4>
                            <p>{{ formatDate(item.login_at) }} • {{ item.location }}</p>
                        </div>
                        <span class="login-status success">登入成功</span>
                    </div>
                </template>
            </div>
        </div>

        <div class="settings-section danger-zone">
            <h2>危險區域</h2>
            <div class="danger-item">
                <div class="danger-info">
                    <h3>註銷您的帳戶</h3>
                    <p>這會永久刪除您在 Money MMA 的所有紀錄且無法復原。</p>
                </div>
                <button class="btn-danger" @click="handleDeleteAccount">刪除帳戶</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../assets/css/setting.css';

/* 強化目前作業階段的視覺 */
.current-session {
    border-left: 4px solid var(--color-success) !important;
    background: color-mix(in srgb, var(--color-success), transparent 96%) !important;
}

.active-icon {
    background: color-mix(in srgb, var(--color-success), transparent 85%) !important;
}

.active-icon svg {
    color: var(--color-success) !important;
}

/* 分隔線樣式 */
.activity-divider {
    text-align: center;
    border-bottom: 1px solid var(--border-color);
    line-height: 0.1em;
    margin: 30px 0 20px;
}

.activity-divider span {
    background: var(--bg-card);
    padding: 0 15px;
    color: var(--text-secondary);
    font-size: 13px;
}

.history-item {
    opacity: 0.8;
}

.loading-text, .empty-text {
    font-size: 14px;
    color: var(--text-secondary);
    padding: 10px 0;
}

.login-icon svg {
    width: 20px;
    height: 20px;
}
</style>