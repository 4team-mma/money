<script setup>
import { ref } from 'vue'

// 安全性
const security = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
    loginHistory: [
        {
            id: 1,
            device: 'Chrome on Windows',
            location: '台北市, 台灣',
            time: '2 小時前',
            status: 'current',
            statusText: '目前裝置'
        },
        {
            id: 2,
            device: 'Safari on iPhone',
            location: '台北市, 台灣',
            time: '昨天 14:30',
            status: 'success',
            statusText: '成功'
        },
        {
            id: 3,
            device: 'Chrome on Android',
            location: '台中市, 台灣',
            time: '3 天前',
            status: 'success',
            statusText: '成功'
        }
    ]
})

// 變更密碼
const changePassword = () => {
    if (!security.value.currentPassword || !security.value.newPassword || !security.value.confirmPassword) {
        alert('請填寫所有欄位')
        return
    }
    if (security.value.newPassword !== security.value.confirmPassword) {
        alert('新密碼不一致')
        return
    }
    alert('密碼已變更！')
    security.value.currentPassword = ''
    security.value.newPassword = ''
    security.value.confirmPassword = ''
}

</script>

<template>
    <div class="tab-content">
        <div class="settings-section">
            <h2>密碼</h2>
            <div class="form-group">
                <label>目前密碼</label>
                <input type="password" v-model="security.currentPassword" placeholder="輸入目前密碼">
            </div>
            <div class="form-group">
                <label>新密碼</label>
                <input type="password" v-model="security.newPassword" placeholder="輸入新密碼">
            </div>
            <div class="form-group">
                <label>確認新密碼</label>
                <input type="password" v-model="security.confirmPassword" placeholder="再次輸入新密碼">
            </div>
            <button class="btn-primary" @click="changePassword">變更密碼</button>
        </div>

        <div class="settings-section danger-zone">
            <h2>危險區域</h2>
            <div class="danger-item">
                <div class="danger-info">
                    <h3>刪除帳戶</h3>
                    <p>永久刪除您的帳戶和所有資料</p>
                </div>
                <button class="btn-danger">刪除帳戶</button>
            </div>
        </div>
    </div>
</template>


<style scoped>
@import '../assets/css/setting.css';
</style>
