    <script setup>
    import Nav from '@/components/Nav.vue';
    import { reactive, ref } from 'vue'

    const success = ref(false)

    const form = reactive({
    name : '',
    type: '',
    page: '',
    message: '',

    })

    const submitFeedback = () => {
    console.log('回饋資料：', { ...form })

    success.value = true

    // 提交後重置表單Reset
    form.name = ''
    form.type = ''
    form.page = ''
    form.message = ''
    
    }
    </script>

    <template>
        <Nav>

        <h1 class="page-title">問題回饋</h1>

        <div class="feedback-container">
        

        <form @submit.prevent="submitFeedback">

        <label>
            帳戶名稱
            <input 
            type="text" 
            v-model="form.name" 
            required 
            placeholder="暱稱"
            class="textarea">
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
    </div>









        </Nav>
    </template>

    <style scoped>

    .textarea {
        min-height: 10px;
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
    </style>