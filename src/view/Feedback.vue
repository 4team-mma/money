<script setup>
    import Nav from '@/components/Nav.vue';
    import { reactive, ref ,onMounted} from 'vue';
    import axios from 'axios';
    import api from '@/api';
    import { submitFeedbackApi } from '@/api/feedback';
    import profile from './Settings.vue';
    import { getProfile } from '@/api/user';


// 給一個空值(form)，建立按鈕函數[ 把東西放在裡面並命名(postData)，呼叫 API，清空 ]
    const success = ref(false)
    const errorMessage = ref('')


    const form = reactive({
    name : '',
    type: '',
    page: '',
    message: '',

    })

// 💡 新增：從後端獲取使用者名稱的函數
const fetchUserData = async () => {
    try {
        // 這裡調用你後端獲取個人資料的 API
        // 假設回傳格式是 { data: { username: "你的名字" } }
        const response = await getProfile(); 
        
        if (response && response.username) {
            form.name = response.username;
        } else if (response.data && response.data.username) {
            form.name = response.data.username;
        }
    } catch (error) {
        console.error("抓取使用者資料失敗：", error);
        // 如果 API 失敗，可以嘗試從 localStorage 拿當作備案
        form.name = localStorage.getItem('username') || '';
    }
};

// 💡 關鍵：頁面一打開就去執行
onMounted(() => {
    fetchUserData();
});


const handleFormSubmit = async () => {
    // 每次送出前先初始化狀態
    success.value = false;
    errorMessage.value = '';
    
    try {
        const postData = {
            feedback_name: form.name,
            question_type: form.type,
            use_page: form.page,
            content: form.message
        };
        console.log("準備送出的資料：", postData);

        // 呼叫 API
        await submitFeedbackApi(postData);
        
        // 顯示成功訊息
        alert("送出成功");
        success.value = true;

        // 💡 清空表格內容
        form.type = '';
        form.page = '';
        form.message = '';

    } catch (error) {
        console.error("錯誤：", error);
        // 💡 發生錯誤時，也可以給使用者提示
        errorMessage.value = error.response?.data?.detail || "送出失敗，請稍後再試";
    }
};

    </script>

    <template>
        <Nav>
        <div class="card">
            <h1 class="page-title">問題回饋</h1>

            <div class="feedback-container">
            

            <form @submit.prevent="handleFormSubmit">

            <label>
                帳戶名稱 
                <input 
            type="text" 
            v-model="form.name" 
            required 
            readonly 
            placeholder="正在載入帳戶名稱..."
            class="textarea readonly-input">
            </label>

            <label>
                問題類型
                <select v-model="form.type" required class="textarea">
                <option disabled value="">請選擇</option>
                <option>Bug 回報</option>
                <option>功能建議</option>
                <option>操作問題</option>
                <option>其他</option>
                </select>
            </label>

            <label>
                使用頁面
                <select v-model="form.page" placeholder="請選擇" required class="textarea">
                <option disabled value="">請選擇</option>
                <option>行事曆</option>
                <option>儀表板</option>
                <option>帳戶管理</option>
                <option>記一筆</option>
                <option>圖表分析</option>
                <option>成就系統</option>
                <option>問題回饋</option>
                <option>設定</option>
                <option>其他</option>
                </select>
            </label>

            <label>
                問題內容
                <textarea
                v-model="form.message"
                placeholder="請詳細描述你遇到的問題或建議(最多200字)"
                maxlength="200"
                required
                class="textarea"
                ></textarea>
            </label>

            <br>
            <br>
            <button type="submit" class="submit_button">送出回饋</button>
            </form>

            <p v-if="success" class="success">感謝你的回饋！我們會持續改善 🙌</p>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            </div>
        </div>
        </Nav>
    </template>

    <style scoped>

    .textarea {
        min-height: 20px;
        padding: 12px;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        resize: vertical;
    }

    .page-title {
        font-size: 32px;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 8px 0;
        }

    .feedback-container {
    max-width: 420px;
    margin: auto;
    padding: 20px;
    }

    h2 {
    text-align: center;
    }

    label {
    display: block;
    margin-bottom: 12px;
    font-size: 14px;
    }

    input,
    select,
    textarea {
    width: 100%;
    margin-top: 4px;
    padding: 8px;
    box-sizing: border-box;
    }

    textarea {
    min-height: 80px;
    resize: vertical;
    }

    button {
    width: 100%;
    margin-top: 16px;
    padding: 10px;
    }

    .success {
    margin-top: 12px;
    color: green;
    text-align: center;
    }

    .submit_button {
        background-color: #2563eb;
        color: white;
        padding: 10px 20px;
        border: 0px;
        margin-top: 10px;
        border-radius: 10px;
        font-weight: 600;
    }

    .readonly-input {
    background-color: #f8fafc; /* 淺灰色背景 */
    color: #64748b;           /* 灰字 */
    cursor: not-allowed;      /* 滑鼠變成禁止符號 */
    border: 2px solid #e2e8f0;
}

.card{
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
    max-width: 550px;
    margin: 40px auto;
}
    </style>