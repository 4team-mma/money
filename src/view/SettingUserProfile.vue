<script setup>
import { ref } from 'vue'

// 標籤頁
const activeTab = ref('profile')
const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'preferences', label: '偏好設定', icon: '⚙️' },
    { id: 'security', label: '帳號設置', icon: '🔒' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'output', label: '輸出', icon: '📂' },
]

// 個人資料
const profile = ref({
    name: '王小明',
    email: 'wang@example.com',
    phone: '0912-345-678',
    birthday: '1990-01-15',
    bio: '熱愛理財，追求財務自由的上班族'
})




// 取得姓名縮寫
const getInitials = (name) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// 儲存個人資料
const saveProfile = () => {
    alert('個人資料已儲存！')
}


</script>


<template>

        <!-- 個人資料 -->
            <div v-if="activeTab === 'profile'" class="tab-content">
                <div class="settings-section">
                    <h2>個人資料</h2>

                    <div class="avatar-section">
                        <div class="avatar">
                            <span class="avatar-text">{{ getInitials(profile.name) }}</span>
                        </div>
                        <div class="avatar-actions">
                            <button class="btn-secondary">上傳照片</button>
                            <button class="btn-text">移除</button>
                        </div>
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>暱稱</label>
                            <input type="text" v-model="profile.name" placeholder="輸入姓名">
                        </div>

                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" v-model="profile.email" placeholder="輸入 Email">
                        </div>


                        <div class="form-group">
                            <label>生日</label>
                            <input type="date" v-model="profile.birthday">
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label>關於我</label>
                        <textarea v-model="profile.bio" placeholder="介紹一下自己..." rows="4"></textarea>
                    </div>

                    <div class="form-actions">
                        <button class="btn-secondary">取消</button>
                        <button class="btn-primary" @click="saveProfile">儲存變更</button>
                    </div>
                </div>
            </div>

</template>


<style scoped>
@import '../assets/css/setting.css';
</style>
