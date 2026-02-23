<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios';

// 變數定義
const avatarUrl = ref(null); //存放後端回傳的路徑
const activeTab = ref('profile')
const fileInput = ref(null); // 對應 HTML 的 ref="fileInput"
const selectedFile = ref(null); // 用來存放準備上傳的檔案
const originalAvatarUrl = ref(null);
const isPendingDelete = ref(false); // 新增一個變數來追蹤是否點了「移除」

// 在 script 區塊加入
const displayAvatarUrl = computed(() => {
    if (!avatarUrl.value) return null;

    // 如果是剛剛選的檔案 (blob 開頭)，直接回傳預覽網址
    if (avatarUrl.value.startsWith('blob:')) {
        return avatarUrl.value;
    }

    // ✅ 關鍵：在路徑後面加上時間戳記 t=...
    // 這樣網址會變成 /static/ProfilePicture/user_6.png?t=1707897600
    const timestamp = Date.now();
    return `http://localhost:8000${avatarUrl.value}?t=${timestamp}`;
});

// 圖面大小設定
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file && file.size > 2 * 1024 * 1024) {
    alert("照片不能超過 2MB 喔！");
    e.target.value = ""; // 清空選擇
    return;
  }
  }; 

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
                originalAvatarUrl.value = d.avatar_url || null;
            }

        } catch (error) {
            console.error("初始化載入失敗:", error);
        }
    }
});

// 取消按鈕邏輯：將資料還原回上一次儲存的狀態
const resetForm = () => {
    if (confirm("確定要捨棄目前的修改嗎？")) {
        // 使用展開運算子複製資料，確保響應式物件被正確更新
        profile.value = { ...originalProfile.value };
        avatarUrl.value = originalAvatarUrl.value; // ✅ 還原成原始照片
        selectedFile.value = null; // ✅ 清空暫存檔案，讓 isDirty 回歸 false
    }
};


// 📤 修正後的選擇檔案 (只做預覽)
const onFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        // ✅ 額外優化：如果之前已經有一個預覽網址，先釋放它省記憶體
        if (avatarUrl.value && avatarUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(avatarUrl.value);
        }

        selectedFile.value = file;     // 存入待上傳變數
        isPendingDelete.value = false; // 取消刪除標記

        // 產生本地預覽網址 (這行是你的預覽心臟，絕對要留著)
        avatarUrl.value = URL.createObjectURL(file);
    }
};

// ✅ 修改後的移除邏輯：只改預覽，不跑 API
const removePhoto = () => {
    if (confirm("確定要移除頭像嗎？(需按下儲存後生效)")) {
        avatarUrl.value = null;         // 讓前端畫面變回預設文字頭像
        selectedFile.value = null;      // 清空可能剛剛選但還沒傳的照片
        isPendingDelete.value = true;   // 💡 重要：立起「待刪除」旗標
    }
};

const saveProfile = async () => {
    if (!username.value) {
        alert("請先登入帳號");
        return;
    }

    try {
        console.log("正在執行同步更新...");

        // --- 1. 先處理文字資料更新 ---
        const updateData = {
            name: profile.value.name,
            email: profile.value.email,
            birthday: profile.value.birthday,
            about: profile.value.about
        };

        const textResponse = await axios.put(
            `http://localhost:8000/api/setting/setting_profile/update-profile/${username.value}`,
            updateData
        );

        if (!textResponse.data.success) {
            alert("❌ 文字資料更新失敗：" + textResponse.data.message);
            return;
        }

        // --- 2. 處理頭像動作 (移除或上傳) ---

        // A. 如果使用者點了「移除」
        if (typeof isPendingDelete !== 'undefined' && isPendingDelete.value) {
            await axios.post(`http://localhost:8000/api/setting/setting_profile/remove-avatar/${username.value}`);
            isPendingDelete.value = false;
            originalAvatarUrl.value = null; // 同步備份狀態
        }

        // B. 如果使用者選了「新照片」
        if (selectedFile.value) {
            const formData = new FormData();
            formData.append('file', selectedFile.value);

            const imgResponse = await axios.post(
                `http://localhost:8000/api/setting/setting_profile/upload-avatar/${username.value}`,
                formData
            );

            if (imgResponse.data.success) {
                // 加上時間戳記確保畫面更新
                const newUrl = imgResponse.data.avatar_url + '?t=' + Date.now();
                avatarUrl.value = newUrl;

                // 更新備份路徑
                if (typeof originalAvatarUrl !== 'undefined') {
                    originalAvatarUrl.value = imgResponse.data.avatar_url;
                }
                selectedFile.value = null;
            } else {
                alert("⚠ 文字更新成功，但頭像上傳失敗：" + imgResponse.data.message);
            }
        }

        // --- 3. 全部成功後的狀態同步 ---
        alert("個人資料已更新！");
        originalProfile.value = { ...profile.value }; // 讓按鈕熄滅

    } catch (error) {
        console.error("儲存失敗：", error);
        alert("連線伺服器時發生錯誤，請檢查網路連線");
    }
};



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
    const textChanged = JSON.stringify(profile.value) !== JSON.stringify(originalProfile.value);
    const fileChanged = selectedFile.value !== null; // 有選檔案也算 dirty
    const deletePending = isPendingDelete.value === true;
    return textChanged || fileChanged || deletePending;
});

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



</script>


<template>

    <!-- 個人資料 -->
    <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="settings-section">
            <h2>個人資料</h2>

            <div class="avatar-section">
                <div v-if="avatarUrl" class="avatar-container">
                    <img :src="displayAvatarUrl" class="user-avatar" alt="個人頭像">
                </div>

                <div v-else class="avatar">
                    <span class="avatar-text">{{ getInitials(profile.name) }}</span>
                </div>

                <div class="avatar-actions">
                    <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="onFileChange">
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
                    <input
                    type="date"
                    v-model="profile.birthday"
                    class="your-input-style"
                    :class="{ 'date-placeholder': !profile.birthday }"
                    >
                </div>
            </div>

            <div class="form-group full-width">
                <label>關於我</label>
                <textarea v-model="profile.about" placeholder="介紹一下自己..." rows="4"></textarea>
            </div>

            <div class="form-actions">
                <button type="button" class="btn-secondary" :disabled="!isDirty" @click="resetForm">取消</button>
                <button class="btn-primary" :disabled="!isDirty" @click="saveProfile">
                    儲存變更
                </button>
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

.user-avatar {
    width: 150px;
    /* 固定的顯示寬度 */
    height: 150px;
    /* 固定的顯示高度 */
    border-radius: 50%;
    /* 變成圓形，更有質感 */
    object-fit: cover;
    /* 關鍵！這會自動裁切並填滿容器，防止圖片被壓扁或拉長 */
    border: 2px solid #ddd;
}

/* 讓 date input 在沒選日期時呈現灰色 */
input[type="date"] {
  color: #333; /* 選取日期後的顏色 */
}

/* 針對 webkit 瀏覽器（Chrome, Safari, Edge）的內建文字進行顏色調整 */
input[type="date"]::-webkit-datetime-edit {
  /* 使用條件：如果 profile.birthday 是空的，就顯示灰色 */
  /* 我們可以透過前端的 class 來控制 */
  color: inherit; 
}

/* 針對 Webkit 瀏覽器內部的欄位調整間距 */
input[type="date"]::-webkit-datetime-edit-fields-wrapper {
  padding: 0; /* 移除包裹層的內距 */
}

/* 當沒有值時，強制讓裡面的編輯區域變灰色 */
.date-placeholder::-webkit-datetime-edit {
  color: #a0aec0; /* 這是淺灰色，你可以根據設計調整 */
}

/* 針對每一個小欄位（年、月、日）調整左右間距 */
input[type="date"]::-webkit-datetime-edit-year-field,
input[type="date"]::-webkit-datetime-edit-month-field,
input[type="date"]::-webkit-datetime-edit-day-field {
  padding: 0 1px; /* 縮小左右間距，原本預設可能較大 */
}

/* 針對中間的斜線 (/) 調整間距 */
input[type="date"]::-webkit-datetime-edit-text {
  padding: 0 2px;
  color: #666; /* 確保斜線顏色也一致 */
}

/* 當 v-model 為空時，套用灰色 */
.date-placeholder::-webkit-datetime-edit-year-field,
.date-placeholder::-webkit-datetime-edit-month-field,
.date-placeholder::-webkit-datetime-edit-day-field,
.date-placeholder::-webkit-datetime-edit-text {
  color: #666 !important; /* 強制變灰 */
}

/* 為了確保萬一，如果上面失效，直接針對整個編輯區域 */
.date-placeholder::-webkit-datetime-edit {
  color: #666 !important;
}

</style>
