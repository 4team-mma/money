<script setup>
import { ref, onMounted } from 'vue'
import { changePassword, deleteMe } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { settingApi } from '@/api/setting'

// 🌟 引入 Siri 圖示 (解決破圖)
import logoSiri from '@/assets/logo_siri.png'

const security = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

const loginActivities = ref([])
const isLoading = ref(true)

// --- 🌟 Siri 捷徑綁定邏輯 ---

const siriShortcutUrl = "https://www.icloud.com/shortcuts/a6202362a34a4f1fadbf3c275aa7f236"
const userToken = ref('')

const fetchLoginActivities = async () => {
    isLoading.value = true
    try {
        const response = await settingApi.getLoginActivities()
        const actualData = response.data || response; 
        if (actualData && Array.isArray(actualData)) {
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
    fetchLoginActivities();
    
    // 🌟 修正：根據截圖，你的 Key 是 'user_token'
    const token = localStorage.getItem('user_token');
    if (token) {
        userToken.value = token;
    }
})

const copyToken = () => {
    if (!userToken.value) {
        ElMessage.error('找不到憑證，請確保已登入喵！')
        return
    }
    navigator.clipboard.writeText(userToken.value).then(() => {
        ElMessage.success('憑證已複製！請去捷徑貼上喵~')
    }).catch(() => {
        ElMessage.error('複製失敗，請手動複製')
    })
}

const goToShortcut = () => {
    window.open(siriShortcutUrl, '_blank')
}

// --- 其餘原本的功能 (密碼、刪除帳號、格式化) ---
const getRealOS = (item) => {
    let os = item.device_info || '未知裝置'
    if (os.includes("Windows") && os.includes("10")) return "Windows 11/10"
    return os
}

const formatDate = (dateStr) => {
    if (!dateStr) return '未知時間'
    try {
        const date = new Date(dateStr)
        return date.toLocaleString('zh-TW', { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', hour12: false 
        })
    } catch (e) { return dateStr }
}

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
        ElMessage.success('密碼已成功變更')
        security.value.currentPassword = ''; security.value.newPassword = ''; security.value.confirmPassword = '';
    } catch (error) {
        ElMessage.error(error.response?.data?.detail || '變更失敗')
    }
}

const handleDeleteAccount = () => {
    ElMessageBox.confirm(
        '此動作無法復原！您的所有財務資料都將永久刪除。確定要繼續嗎？',
        '警告：刪除帳戶',
        { confirmButtonText: '確定刪除', cancelButtonText: '我再想想', type: 'warning', confirmButtonClass: 'el-button--danger' }
    ).then(async () => {
        try {
            await deleteMe()
            ElMessage.success('資料已全數清空。')
            localStorage.clear(); window.location.href = '/';
        } catch (error) { ElMessage.error('刪除發生錯誤') }
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

        <div class="settings-section siri-integration">
            <div class="siri-header">
                <div class="siri-title">
                
                    <h2>Siri 語音助手 (喵喵助手)</h2>
                </div>
                <span class="status-badge">Beta</span>
            </div>
            
            <div class="siri-content">
                <p>透過「嘿 Siri」喚醒喵喵，直接語音記帳。請先複製憑證後再加入捷徑。</p>
                
                <div class="token-box">
                    <code class="token-text">
                        {{ userToken ? '••••••••' + userToken.slice(-8) : '未登入 (請檢查連線)' }}
                    </code>
                    <button class="btn-copy" @click="copyToken">複製憑證</button>
                </div>

                <div class="siri-steps">
                    <ol>
                        <li>點擊下方按鈕加入捷徑。</li>
                        <li>在安裝畫面的 <strong>Token</strong> 欄位貼上憑證。</li>
                        <li>對手機說：「嘿 Siri，喵喵記帳」。</li>
                    </ol>
                </div>

                <button class="btn-siri" @click="goToShortcut">
                    <img :src="logoSiri" alt="Siri" width="22">
                    加入 Siri 捷徑
                </button>
            </div>
        </div>

        <div class="settings-section">
            <h2>登入活動</h2>
            <div class="login-history">
                <p v-if="isLoading" class="loading-text">載入中...</p>
                <p v-else-if="loginActivities.length === 0" class="empty-text">暫無登入紀錄</p>
                <template v-else>
                    <div v-for="item in loginActivities.filter(a => a.is_current)" :key="'cur-'+item.activity_id" class="login-item current-session">
                        <div class="login-icon active-icon">🖥️</div>
                        <div class="login-info">
                            <h4>{{ getRealOS(item) }} (目前)</h4>
                            <p>{{ item.browser }} • {{ item.ip_address }}</p>
                        </div>
                        <span class="login-status current">使用中</span>
                    </div>
                    <div class="activity-divider"><span>最近紀錄</span></div>
                    <div v-for="item in loginActivities.filter(a => !a.is_current).slice(0, 3)" :key="item.activity_id" class="login-item history-item">
                        <div class="login-info">
                            <h4>{{ getRealOS(item) }}</h4>
                            <p>{{ formatDate(item.login_at) }} • {{ item.location }}</p>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <div class="settings-section danger-zone">
            <h2>危險區域</h2>
            <div class="danger-item">
                <div class="danger-info">
                    <h3>註銷您的帳戶</h3>
                    <p>這會永久刪除所有財務資料且無法復原。</p>
                </div>
                <button class="btn-danger" @click="handleDeleteAccount">刪除帳戶</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../assets/css/setting.css';


@keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
}

.siri-integration {
    border: 1px solid var(--border-color);
    background: linear-gradient(145deg, var(--bg-card), #fbfaff);
}
.siri-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.siri-title { display: flex; align-items: center; gap: 10px; }
.token-box { display: flex; align-items: center; justify-content: space-between; background: #f0f2f5; padding: 10px 15px; border-radius: 8px; margin: 15px 0; border: 1px dashed #dcdfe6; }
.token-text { font-family: 'Courier New', Courier, monospace; font-size: 13px; color: #475569; }
.siri-steps { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.8; }
.btn-siri { display: flex; align-items: center; justify-content: center; gap: 12px; width: 100%; padding: 12px; background: #000; color: #fff; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; }
.btn-siri:hover { background: #333; transform: translateY(-2px); }
.status-badge { font-size: 10px; background: #5856D6; color: white; padding: 2px 8px; border-radius: 20px; font-weight: bold; }

.btn-copy {
    background-color: #f0f7ff; /* 淺藍色背景 */
    color: #409eff; /* Element Plus 主色 */
    border: 1px solid #b3d8ff;
    padding: 6px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-copy:hover {
    background-color: #409eff;
    color: #ffffff;
    border-color: #409eff;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

.btn-copy:active {
    transform: scale(0.95);
}


</style>