<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)

//  Google Client ID (請確認這是您最新的 ID)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// 頁面載入後，直接呼叫 window.google 產生按鈕
const initGoogleSDK = () => {
    if (window.google) {
        // 初始化 Google ID
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback
        });
        
        // 渲染按鈕到 id 為 "google-btn-container" 的 div 裡
        window.google.accounts.id.renderButton(
            document.getElementById("google-btn-container"),
            { 
                theme: "outline", 
                size: "large",
                width: "300", // 按鈕寬度，配合您的設計
                text: "signup_with", // 顯示 "使用 Google 註冊"
                shape: "rectangular",
                logo_alignment: "left"
            }
        );
    } else {
        // 若 SDK 尚未載入，延遲 500ms 重試
        setTimeout(initGoogleSDK, 500);
    }
}

onMounted(() => {
    initGoogleSDK();
});

// 處理 Google 回傳的 credential
const handleGoogleCallback = async (response) => {
    const credential = response.credential;
    loading.value = true;
    try {
        const res = await api.post('/auth/google', { token: credential });
        
        if (res.access_token) {
            // 🌟 1. 確保 Token 寫入 LocalStorage
            localStorage.setItem('user_token', res.access_token);
            // 🌟 2. 重要：同時更新 axios 的預設 header，確保下一次請求馬上帶上
            // 假設您的 api 實例是從 @/api 引入的，這裡可以手動補強
            api.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;

            ElMessage.success('Google 登入成功！');
            
            // 🌟 3. 短暫延遲 100ms 再跳轉，確保儲存完畢 (這是最保險的做法)
        setTimeout(() => {
                router.push('/loading');
            }, 100);
        }
    } catch (err) {
        console.error('Google 驗證失敗:', err);
        ElMessage.error('登入失敗，請稍後再試');
    } finally {
        loading.value = false;
    }
};

// --- 以下維持您原本的表單邏輯 ---
const formData = reactive({
    username: '', name: '', email: '', password: '', confirmPassword: '', agreeTerms: false
})

const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
        ElMessage.warning('密碼不一致')
        return
    }
    if (!formData.agreeTerms) {
        ElMessage.warning('請勾選同意條款')
        return
    }
    loading.value = true
    try {
        await api.post('/auth/register', {
            username: formData.username,
            name: formData.name,
            email: formData.email,
            password: formData.password,
            confirm_password: formData.confirmPassword
        })
        ElMessage.success('註冊成功！')
        router.push('/')
    } catch (err) {
        console.error('註冊流程中斷：', err)
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
                            <img src="../assets/logo.svg" alt="logo" width="68" height="68">
                        </div>
                        <h1 class="brand-name">Money MMA</h1>
                    </div>
                    <div class="header-text">
                        <h2 style="padding-bottom: 5px;">創建新帳戶</h2>
                    </div>

                    <form @submit.prevent="handleRegister" class="register-form">
                        <div class="form-group">
                            <label>帳號</label>
                            <input v-model="formData.username" type="text" placeholder="設定登入帳號" required />
                        </div>
                        <div class="form-group">
                            <label>暱稱</label>
                            <input v-model="formData.name" type="text" placeholder="您的稱呼" required />
                        </div>
                        <div class="form-group">
                            <label>電子郵件</label>
                            <input v-model="formData.email" type="email" placeholder="your@email.com" required />
                        </div>
                        <div class="password-row">
                            <div class="form-group">
                                <label>密碼</label>
                                <input v-model="formData.password" type="password" placeholder="••••••••" required />
                            </div>
                            <div class="form-group">
                                <label>確認密碼</label>
                                <input v-model="formData.confirmPassword" type="password" placeholder="••••••••" required />
                            </div>
                        </div>
                        <div class="checkbox-group">
                            <input v-model="formData.agreeTerms" type="checkbox" id="terms" required />
                            <label for="terms">我同意服務條款和隱私政策</label>
                        </div>
                        <button type="submit" class="submit-button" :disabled="loading">
                            立即註冊 <span class="arrow">→</span>
                        </button>
                    </form>

                    <div class="divider">
                        <span>或使用</span>
                    </div>

                    <div class="social-actions" style="display: flex; justify-content: center; margin-top: 15px;">
                        <div id="google-btn-container"></div>
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
                        <div v-for="(f, i) in [
                            {icon:'📊', t:'圖表分析', d:'視覺化數據洞察'},
                            {icon:'📆', t:'行事曆', d:'時間軸收支管理'},
                            {icon:'⛺', t:'記帳功能', d:'管理所有資產'},
                            {icon:'📈', t:'趨勢預測', d:'AI智能財務建議'}
                        ]" :key="i" class="feature-card">
                            <div class="feature-icon">{{f.icon}}</div>
                            <h3>{{f.t}}</h3>
                            <p>{{f.d}}</p>
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
/* 確保 Google 按鈕容器有高度，避免閃爍 */
#google-btn-container {
    min-height: 40px;
}
</style>