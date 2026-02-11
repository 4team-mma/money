<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios';

const activeTab = ref('profile')
const fileInput = ref(null); // 對應 HTML 的 ref="fileInput"

// =========================
// 文字欄位設定
// =========================

onMounted(async () => {
    // 確保有 username 才能抓資料
    if (username.value) {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/setting/setting_profile/get-profile/${username.value}`
            );
            // 在 onMounted 的 response.data.success 裡面修改如下：
            if (response.data.success) {
                const d = response.data.data;

                // 整理一份乾淨的資料物件
                const fetchedData = {
                    name: d.name || '',
                    email: d.email || '',
                    birthday: d.birthday || '',
                    about: d.about || ''
                };

                // 同步給「編輯組」與「對照組」
                profile.value = { ...fetchedData };
                originalProfile.value = { ...fetchedData };

                // 頭像路徑獨立處理
                avatarUrl.value = d.avatar_url || null;
            }

        } catch (error) {
            console.error("初始化載入失敗:", error);
        }
    }
});

// =========================
// 🗑️ 頭像相關設定
// =========================

// --- 1. 變數宣告區 (只寫一次) ---
const userStore = useUserStore();

// 💡 補上 profile 變數，否則 v-model 會報錯
const profile = ref({
    name: '',
    email: '',
    birthday: '',
    about: ''
});
const originalProfile = ref({ name: '', email: '', birthday: '', about: '' });// 用來存「沒改過」的版本

// 計算資料是否動過
const isDirty = computed(() => {
    // 將兩個物件轉為 JSON 字串進行快速比對
    return JSON.stringify(profile.value) !== JSON.stringify(originalProfile.value);
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

// =========================
// 按鈕設定
// =========================

// 取消按鈕邏輯：將資料還原回上一次儲存的狀態
const resetForm = () => {
    if (confirm("確定要捨棄目前的修改嗎？")) {
        // 使用展開運算子複製資料，確保響應式物件被正確更新
        profile.value = { ...originalProfile.value };
    }
};

// 儲存變更按鈕
const saveProfile = async () => {
    // 檢查是否有登入帳號
    if (!username.value) {
        alert("請先登入帳號");
        return;
    }

    // 準備要送給後端的 JSON 資料
    const updateData = {
        name: profile.value.name,
        email: profile.value.email,
        birthday: profile.value.birthday,
        about: profile.value.about
    };

    try {
        console.log("正在送出更新請求...", updateData);

        const response = await axios.put(
            `http://localhost:8000/api/setting/setting_profile/update-profile/${username.value}`,
            updateData
        );

        if (response.data.success) {
            alert("✨ 個人資料更新成功！");
            // ✅ 關鍵改動：儲存成功後，將當前資料備份回 originalProfile
            // 這樣 isDirty 會重新計算為 false，按鈕會自動變回禁用狀態
            originalProfile.value = { ...profile.value };
        } else {
            alert("❌ 更新失敗：" + response.data.message);
        }
    } catch (error) {
        console.error("儲存失敗：", error);
        alert("連線伺服器時發生錯誤，請稍後再試");
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
                <textarea v-model="profile.about" placeholder="介紹一下自己..." rows="4"></textarea>
            </div>

            <div class="form-actions">
                <button type="button" class="btn-secondary" :disabled="!isDirty" @click="resetForm">取消</button>
                <button class="btn-primary" @click="saveProfile">儲存變更</button>
            </div>
        </div>
    </div>

</template>


<style scoped>
@import '../assets/css/setting.css';

/* 1. 當按鈕處於 disabled 狀態時的基礎樣式 */
button:disabled {
    background-color: #ccc !important;
    /* 灰掉的顏色 */
    color: #666 !important;
    /* 文字顏色 */
    cursor: not-allowed !important;
    /* 顯示禁用圖示 */
    opacity: 0.6 !important;
    /* 半透明感 */
    border: none !important;

    /* 核心：讓滑鼠事件失效，這樣滑過去就不會觸發 hover 變色 */
    pointer-events: none !important;
}

/* 2. 為了保險起見，明確定義禁用時的 hover 狀態與原樣相同 */
button:disabled:hover {
    background-color: #ccc !important;
    opacity: 0.6 !important;
    box-shadow: none !important;
    transform: none !important;
    /* 如果你有寫縮放效果也要移除 */
}
</style>
