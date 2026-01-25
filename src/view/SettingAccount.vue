<script setup>
import { ref } from 'vue'
import { changePassword, deleteMe } from '@/api/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const security = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})
// --- 執行變更密碼 ---
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
        // 清空欄位
        security.value.currentPassword = ''
        security.value.newPassword = ''
        security.value.confirmPassword = ''
    } catch (error) {
        ElMessage.error(error.response?.data?.detail || '變更失敗')
    }
}

// --- 執行刪除帳戶 (帶確認視窗) ---
const handleDeleteAccount = () => {
    ElMessageBox.confirm(
        '此動作無法復原！您的所有財務資料、報表與設定都將永久刪除。確定要繼續嗎？',
        '警告危險：刪除帳戶',
        {
            confirmButtonText: '確定刪除',
            cancelButtonText: '我再想想',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
        }
    ).then(async () => {
        try {
            await deleteMe()
            ElMessage.success('帳號已成功刪除')
            
            //  1. 清除登入狀態
            localStorage.removeItem('token')
            
            //  2. 跳轉回首頁 (home.vue 對應的路由通常是 '/')
            router.push('/') 
        } catch (error) {
            console.error(error)
            ElMessage.error('刪除過程發生錯誤')
        }
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
</style>
