<script setup>
import { reactive,ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false) // 防止重複點擊

const formData = reactive({
    username: '', // 
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
})

const handleRegister = async () => {
    // 1. 驗證密碼一致性
    if (formData.password !== formData.confirmPassword) {
        ElMessage.warning('密碼不一致，請重新輸入')
        return
    }
    if (!formData.agreeTerms) {
            ElMessage.warning('請勾選同意條款')
            return
    }
    loading.value = true

try {
        // 🌟 2. 呼叫後端 API 註冊接口
        // 最終發出：POST http://localhost:8000/api/auth/register
        const res =await api.post('/auth/register', {
            username: formData.username,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirm_password: formData.confirmPassword // 這裡必須用下底線
        });
        console.log('註冊成功回傳：', res);

        // 🌟 3. 因為攔截器已經處理過 .data，所以這裡直接判斷回傳訊息
        // 你的 auth.py 回傳的是 {"msg": "註冊成功"}
        ElMessage.success('註冊成功！歡迎加入 Money MMA');
        
        // 清除舊的本地離線資料（選做，為了確保之後讀取都是資料庫的資料）
        localStorage.removeItem('mma_users');

        router.push('/'); // 跳轉回登入頁
    } catch (err) {
        // 🌟 4. 錯誤處理：如果 Email 已被註冊，後端會拋出 400 錯誤
        // 攔截器 interceptors.js 會自動彈出 ElMessage.error(detail)
        console.error('註冊流程中斷：', err);
    } finally {
        loading.value = false
    }
}

const goToLogin = () => router.push('/')

</script>

<template>
    <div class="register-page">
        <div class="background-effects">
            <div v-for="n in 10" :key="n" class="effect-circle"></div>
        </div>

        <div class="main-container">
            <div class="card-wrapper">

                <div class="form-section">
                    <div class="logo-area">
                        <div class="logo-icon">
                            <span class="icon">
                                <img src="../assets/logo.svg" alt="logo" width="48" height="48">
                            </span>
                        </div>
                        <h1 class="brand-name">Money MMA</h1>
                    </div>

                    <div class="header-text">
                        <h2 style="padding-bottom: 5px;">創建新帳戶</h2>

                    </div>

                    <form @submit.prevent="handleRegister" class="register-form">
                        <div class="form-group">
                            <label>登入帳號 (Username)</label>
                            <input v-model="formData.username" type="text" placeholder="設定登入帳號" required />
                        </div>

                        <div class="form-group">
                            <label>使用者名稱 (暱稱)</label>
                            <input v-model="formData.name" type="text" placeholder="您的稱呼" required />
                        </div>

                        <div class="form-group">
                            <label>電子郵件 (Email)</label>
                            <input v-model="formData.email" type="email" placeholder="your@email.com" required />
                        </div>

                        <div class="password-row">
                            <div class="form-group">
                                <label>密碼</label>
                                <input v-model="formData.password" type="password" placeholder="••••••••" required />
                            </div>
                            <div class="form-group">
                                <label>確認密碼</label>
                                <input v-model="formData.confirmPassword" type="password" placeholder="••••••••"
                                    required />
                            </div>
                        </div>

                        <div class="checkbox-group">
                            <input v-model="formData.agreeTerms" type="checkbox" id="terms" required />
                            <label for="terms">我同意服務條款和隱私政策</label>
                        </div>

                        <button type="submit" class="submit-button">
                            立即註冊
                            <span class="arrow">→</span>
                        </button>
                    </form>

                    <div class="divider">
                        <span>或使用</span>
                    </div>

                    <div class="social-actions">
                        <button class="btn-social">
                            <img src="https://www.google.com/favicon.ico" width="18" alt="google" />
                            使用 Google 註冊
                        </button>
                    </div>

                    <p class="login-link">
                        已經有帳戶了？ <a href="#" @click.prevent="goToLogin">登入</a>
                    </p>
                </div>

                <div class="showcase-section">
                    <div class="showcase-content">
                        <div class="showcase-header">
                            <h3>加入智能理財</h3>
                            <p>體驗專業的財務管理工具</p>
                        </div>

                        <div class="feature-grid">
                            <div class="feature-card">
                                <div class="feature-icon">💰</div>
                                <h3>智能記帳</h3>
                                <p>自動分類管理收支</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">📈</div>
                                <h3>趨勢洞察</h3>
                                <p>視覺化您的財富增長</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">🛡️</div>
                                <h3>安全加密</h3>
                                <p>銀行級資料保護</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">🚀</div>
                                <h3>財富自由</h3>
                                <p>邁向理想生活目標</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../assets/css/register.css';


</style>