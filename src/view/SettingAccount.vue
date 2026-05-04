<!-- SettingAccount.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { changePassword, deleteMe,getProfile } from '@/api/user'
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

// 🌟 從環境變數讀取網址 (更專業、更安全)
const SHORTCUT_CONFIG = {
    user: import.meta.env.VITE_SIRI_URL_USER,
    test: import.meta.env.VITE_SIRI_URL_TEST
}

// --- 🌟 Siri 捷徑綁定邏輯 (分權限) ---

const userToken = ref('')
const userRole = ref('') // 🌟 新增：儲存使用者角色

// 1. 動態計算網址：role 為 test 就給測試版，其餘給使用者版
const siriShortcutUrl = computed(() => {
    return userRole.value === 'test' ? SHORTCUT_CONFIG.test : SHORTCUT_CONFIG.user
})

// 2. 動態計算標題
const siriTitle = computed(() => {
    return userRole.value === 'test' ? "Siri 語音助手 (開發者測試版)" : "Siri 語音助手 (喵喵助手)"
})



// 🌟 Notion 狀態管理
const isNotionBound = ref(false)
const isEditingNotion = ref(false)
const notionConfig = ref({ apiKey: '', pageId: '' })

/// 🌟 同步身分邏輯
const syncUserIdentity = async () => {
    try {
        const res = await getProfile()
        const userData = res.data || res
        
        userRole.value = userData.role  // ✅ 補上這行
        
        if (userData.notion_page_id) {
            isNotionBound.value = true
            isEditingNotion.value = false
            notionConfig.value.apiKey = '********'
            notionConfig.value.pageId = userData.notion_page_id
        } else {
            isNotionBound.value = false
            isEditingNotion.value = true
        }
    } catch (e) { console.error(e) }
}

const handleNotionSave = async () => {
    try {
        await settingApi.updateNotionConfig({
            notion_api_key: notionConfig.value.apiKey === '********' 
                ? undefined 
                : notionConfig.value.apiKey,
            notion_page_id: notionConfig.value.pageId
        })
        ElMessage.success('Notion 設定已儲存喵！')
        await syncUserIdentity()
    } catch (e) { ElMessage.error('儲存失敗') }
}

const handleUnbindNotion = async () => {
    ElMessageBox.confirm('確定要解除 Notion 綁定嗎？', '解除綁定', { type: 'warning' })
    .then(async () => {
        await settingApi.updateNotionConfig({
            notion_api_key: null,
            notion_page_id: null
        })
        notionConfig.value = { apiKey: '', pageId: '' }
        isNotionBound.value = false
        isEditingNotion.value = true
        ElMessage.success('已解除綁定喵！')
    })
}

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

onMounted(async () => {

    // 1. 先抓 Token
    fetchLoginActivities();
    
    // 2. 抓取 Token
    const token = localStorage.getItem('user_token');
    if (token) userToken.value = token;

    // 3. 🌟 向後端同步身分 (解決你截圖中顯示錯誤的問題)
    await syncUserIdentity();
    

    
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
    // 🌟 使用 computed 算出來的動態網址
    window.open(siriShortcutUrl.value, '_blank')
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


<div class="settings-section notion-integration">

        <div class="siri-header">
            <h2>Notion 財務同步</h2>
            <span v-if="isNotionBound" class="status-badge success">已綁定</span>
            <span v-else class="status-badge info">未連線</span>
        </div>
        <div v-if="isEditingNotion" class="siri-steps notion-steps">
                <p><strong>🔗 如何取得綁定資訊？</strong></p>
                <ol>
                    <li><strong>API Key：</strong>請至 <a href="https://www.notion.so/my-integrations" target="_blank" class="notion-link">Notion 開發者後台</a> 建立或複製你的機器人整合授權碼。</li>
                    <li><strong>目標 Page ID：</strong>打開你的 Notion 目標頁面，複製網址。網址中 <code>-</code> 後面的 32 位數代碼即為 Page ID（例如：<code>.../user-3537efad061f80cb...</code> 中的 <code>3537...</code>）。</li>
                    <li class="highlight-step"><strong>⚠️ 最重要的一步 (授權機器人)：</strong>在你的 Notion 目標頁面右上角點擊 <code>...</code> 圖示，選擇 <code>Connections (連線)</code> -> <code>Connect to (新增連線)</code>，搜尋並加入你的 <strong>MoneyMMA-MCP</strong> 機器人，否則喵喵會被擋在門外喔！</li>
                    <li><strong>詢問範例：</strong>喵喵，請幫我寫一段『上個月飲食花費』的財務摘要，並寫入我的 Notion。</li>
                </ol>
            </div>

        <div class="form-group">
            <label>Notion API Key</label>
            <input type="password" v-model="notionConfig.apiKey" :disabled="!isEditingNotion" placeholder="secret_xxxx...">
        </div>
        <div class="form-group">
            <label>目標 Page ID</label>
            <input type="text" v-model="notionConfig.pageId" :disabled="!isEditingNotion" placeholder="從網址中複製 32 位元代碼">
        </div>

        <div class="btn-group">
            <button v-if="!isEditingNotion" class="btn-secondary" @click="isEditingNotion = true">修改設定</button>
            <button v-if="isEditingNotion" class="btn-primary" @click="handleNotionSave">確認儲存</button>
            <button v-if="isNotionBound" class="btn-outline-danger" @click="handleUnbindNotion">解除綁定</button>
        </div>

    </div>


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
                    <h2>{{ siriTitle }}</h2>
                </div>
                <span v-if="userRole === 'test'" class="status-badge dev-badge">Tester</span>
                <span v-else class="status-badge">Beta</span>
            </div>
            
            <div class="siri-content">
                <p v-if="userRole === 'test'">
                    <strong>偵測到測試員權限：</strong>此版本捷徑包含環境切換開關，請務必在安裝時貼上開發憑證。
                </p>
                <p v-else>
                    透過「嘿 Siri」喚醒喵喵，直接語音記帳。請先複製憑證後再加入捷徑。
                </p>
                
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
                        <li v-if="userRole === 'test'">選擇連線環境 (Mac/Win(要檢查電腦名稱，點選開始案右鍵選系統，因為開發者電腦名稱不同)/雲端)。</li>
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
.notion-integration {
    margin-top: 20px;
    border: 1px solid #e2e8f0;
    background: linear-gradient(145deg, #ffffff, #f8fafc);
}
.notion-badge { background: #37352f !important; } /* Notion 招牌黑 */
.btn-notion {
    width: 100%;
    padding: 12px;
    background: #37352f;
    color: #fff;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: 0.3s;
    margin-top: 10px;
}
.btn-notion:hover { background: #000; transform: translateY(-2px); }
.btn-group { display: flex; gap: 10px; margin-top: 15px; }
.btn-outline-danger { background: none; border: 1px solid #f56c6c; color: #f56c6c; border-radius: 8px; cursor: pointer; padding: 8px 15px; }
.btn-outline-danger:hover { background: #fef0f0; }
</style>