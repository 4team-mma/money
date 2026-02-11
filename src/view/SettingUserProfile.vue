<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios';

const activeTab = ref('profile')
const fileInput = ref(null); // 對應 HTML 的 ref="fileInput"

// --- 1. 變數宣告區 (只寫一次) ---
const userStore = useUserStore();

// 💡 補上 profile 變數，否則 v-model 會報錯
const profile = ref({
    name: '',
    email: '',
    birthday: '',
    bio: ''
});

// 💡 補上 avatarUrl，用來存放後端回傳的路徑
const avatarUrl = ref(null);

// 使用 computed 確保它是動態的
const username = computed(() => {
    return userStore.currentUser?.username ||
        JSON.parse(localStorage.getItem('currentUser') || '{}').username ||
        "";
});

// --- 2. 函式定義區 ---

// 取得名字首字母 (預防頭像沒顯示時的備案)
const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
};

// 📤 上傳頭像
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 檢查是否有 username
    if (!username.value) {
        alert("請先登入再上傳照片");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(
            `http://localhost:8000/api/setting/setting_profile/upload-avatar/${username.value}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data.success) {
            // 更新圖片並加上時間戳記防快取
            avatarUrl.value = response.data.avatar_url + '?t=' + Date.now();
            alert("上傳成功！");
        }
    } catch (error) {
        console.error("上傳失敗:", error);
    }
};

// 🗑️ 移除頭像 (這裡只保留一個版本)
const removePhoto = async () => {
    if (!confirm("確定要移除頭像嗎？")) return;

    if (!username.value) {
        alert("請先登入");
        return;
    }

    try {
        const response = await axios.post(
            `http://localhost:8000/api/setting/setting_profile/remove-avatar/${username.value}`
        );
        if (response.data.success) {
            avatarUrl.value = null; // 清空前端顯示
            alert("移除成功");
        }
    } catch (error) {
        console.error("移除失敗:", error);
        alert("移除失敗，請稍後再試");
    }
};


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
