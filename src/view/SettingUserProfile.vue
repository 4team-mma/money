<script setup>
import { ref } from 'vue'
import axios from 'axios';



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

// 照片上傳與移除設定
// 1. 定義變數
const fileInput = ref(null);
// 記得確保後端有這張預設圖，或者先清空
const avatarUrl = ref(null);
const userId = 1;

// 2. 上傳處理
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        // 發送上傳請求
        const response = await axios.post(
            `http://localhost:8000/api/setting/setting_profile/upload-avatar/${userId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.status === 200) {
            // 重點：加上時間戳 (?t=...)
            // 這是為了告訴瀏覽器：「這是一張新圖，不要用舊的快取！」
            avatarUrl.value = response.data.avatar_url;
            alert('上傳成功！');
        }
    } catch (error) {
        console.error('上傳失敗:', error);
    }
};

// 3. 移除處理
const removePhoto = async () => {
    // ... 呼叫後端成功後
    avatarUrl.value = null; // 變回 null，藍色圓圈就會出現

}




</script>


<template>

    <!-- 個人資料 -->
    <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="settings-section">
            <h2>個人資料</h2>

            <div class="avatar-section">
                <div v-if="avatarUrl" class="avatar-container">
                    <img :src="`http://localhost:8000${avatarUrl}`" class="user-avatar" alt="個人頭像"
                        @error="avatarUrl = null">
                </div>

                <div v-else class="avatar">
                    <span class="avatar-text">{{ getInitials(profile.name) }}</span>
                </div>

                <div class="avatar-actions">
                    <input type="file" ref="fileInput" style="display: none" accept="image/*"
                        @change="handleFileUpload">
                    <button class="btn-secondary" @click="fileInput.click()">上傳照片</button>
                    <button class="btn-text" @click="removePhoto">移除</button>
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
