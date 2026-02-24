<script setup>
import { ref, onMounted } from 'vue' // 🌟 記得引入 onMounted
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'
const router = useRouter()


const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
//  Google Client ID (與註冊頁一致)


const formData = ref({
    email: '',
    password: ''
})

// --- Google 登入邏輯 (新增) ---
onMounted(() => {
    // 渲染 Google 按鈕
    if (window.google) {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback,
            
        });
        
        window.google.accounts.id.renderButton(
            document.getElementById("google-login-btn"),
            { 
                theme: "outline", 
                size: "large",
                width: "320", // 配合下方 CSS 的寬度
                text: "signin_with", // 顯示 "使用 Google 登入"
                shape: "rectangular",
                logo_alignment: "left"
            }
        );
    }
});

const handleGoogleCallback = async (response) => {
    const credential = response.credential;
    try {
        const res = await api.post('/auth/google', { token: credential });
        
        // 🌟 統一儲存邏輯 (跟您原本的手動登入保持一致)
        if (res.access_token) {
            localStorage.setItem('currentUser', JSON.stringify(res.user));
            localStorage.setItem('user_token', res.access_token); // 統一叫 user_token
            
            // 更新 Axios 預設 Header
            api.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;

            ElMessage.success('Google 登入成功！');
            
            // 延遲跳轉確保寫入
            setTimeout(() => {
                // 如果後端回傳 user.role，可在此判斷跳轉
                if (res.user && res.user.role === 'admin') {
                    router.push('/loading');
                } else {
                    router.push('/loading');
                }
            }, 100);
        }
    } catch (err) {
        console.error('Google 登入失敗:', err);
        ElMessage.error('Google 登入失敗，請稍後再試');
    }
};

// --- 手動登入邏輯 (維持不變) ---
const handleLogin = async () => {
    const { email: loginIdentifier, password } = formData.value
    
    try {
        const res = await api.post('/auth/login', {
            identifier: loginIdentifier,
            password: password
        });

        if (res && res.access_token) {
            const user = res.user;
            const token = res.access_token;

            // 存入 localStorage
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('user_token', token); 
            
            // 🌟 建議補上這行：讓後續 API 請求能立刻帶上 Token
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            ElMessage.success('登入成功！');

            if (user.role === 'admin') {
                router.push('/loading');
            } else {
                router.push('/loading');
            }
        }
    } catch (err) {
        console.log('登入失敗，攔截器已處理彈窗');
    }
}

const handleRegister = () => router.push('/Register')
</script>

<template>
    <div class="login-page">
        <div class="background-effects">
            <div v-for="n in 10" :key="n" class="effect-circle"></div>
        </div>

        <div class="login-container">
            <div class="login-form-section">
                <div class="form-card">
                    <div class="logo-section">
                        <div class="logo-icon">
                            <span class="icon">
                                <img src="../assets/logo.svg" alt="logo" width="72" height="72">
                            </span>
                        </div>
                        <h1 class="brand-name">Money MMA</h1>
                    </div>

                    <div class="welcome-text">
                        <h2>歡迎來到</h2>
                        <p>財務管理系統</p>
                    </div>

                    <form @submit.prevent="handleLogin" class="login-form">
                        <div class="form-group">
                            <label for="email">帳號 / 電子郵件</label>
                            <input id="email" v-model="formData.email" type="text" placeholder="your@email.com" required 
                            autocomplete="username"
                            />
                        </div>

                        <div class="form-group">
                            <label for="password">密碼</label>
                            <input id="password" v-model="formData.password" type="password" placeholder="••••••••" required
                            autocomplete="current-password"
                            />
                        </div>

                        <button type="submit" class="login-button">
                            登入 <span class="arrow">→</span>
                        </button>
                    </form>

                    <div class="divider">
                        <span>or</span>
                    </div>

                    <div class="social-login">
                        <div id="google-login-btn"></div>
                    </div>

                    <div class="register-link">
                        還沒有帳號？ <a href="#" @click.prevent="handleRegister">立即註冊 </a>or
                        <RouterLink to="/ForgetPassword">忘記密碼?</RouterLink>
                    </div>
                </div>
            </div>

            <div class="showcase-section">
                <div class="showcase-content">
                    <div class="showcase-title">
                        <h2>數位財務管理系統</h2><br>
                        <span>邁向財富自由ＧＯ！</span>
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
    <router-view />
</template>

<style scoped>
@import '../assets/css/home.css';



/*  新增樣式：分隔線與 Google 按鈕容器 */
.divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
    color: #666;
    font-size: 14px;
}
.divider::before,
.divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e0e0e0;
}
.divider span {
    padding: 0 10px;
    color: #999;
    text-transform: uppercase;
    font-size: 12px;
}

.social-login {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    min-height: 40px; /* 避免閃爍 */
}
</style>