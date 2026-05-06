<script setup>
import { ref, onMounted } from 'vue' 
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'
import liff from '@line/liff'

const router = useRouter()

// Google Client ID 與 LIFF ID (改用 import.meta.env.VITE_LIFF_ID)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const LIFF_ID = import.meta.env.VITE_LIFF_ID

// 用來存放 LINE 的資訊
const lineUserId = ref(null)

const formData = ref({
    email: '',
    password: ''
})

// --- 初始化邏輯 (修正為 async) ---
onMounted(async () => {
    // 🌟 兩件事並行，互不等待
    const liffTask = initLiff()
    const googleTask = initGoogle()
    await Promise.allSettled([liffTask, googleTask])
})

// LIFF 初始化獨立出去
const initLiff = async () => {
    try {
        if (!LIFF_ID) return
        await liff.init({ liffId: LIFF_ID })
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile()
            lineUserId.value = profile.userId
        }
    } catch (err) {
        console.log("非 LINE 環境", err)
    }
}

// Google 按鈕初始化，帶載入守衛
const initGoogle = () => {
    return new Promise((resolve) => {
        const render = () => {
            if (!window.google) return
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback,
            })
            window.google.accounts.id.renderButton(
                document.getElementById("google-login-btn"),
                { theme: "outline", size: "large", width: "320",
                text: "signin_with", shape: "rectangular", logo_alignment: "left" }
            )
            resolve()
        }

        // 如果 Google script 已載入就直接跑，否則監聽載入事件
        if (window.google) {
            render()
        } else {
            // 找到 index.html 裡的 Google script tag，監聽它載入完成
            const script = document.querySelector('script[src*="accounts.google.com"]')
            if (script) {
                script.addEventListener('load', render, { once: true })
            } else {
                // 保底 polling，每 100ms 檢查一次，最多等 5 秒
                let attempts = 0
                const poll = setInterval(() => {
                    if (window.google || ++attempts > 50) {
                        clearInterval(poll)
                        render()
                    }
                }, 100)
            }
        }
    })
}

// --- Google 登入回調 (同步支援 LINE 綁定) ---
const handleGoogleCallback = async (response) => {
    const credential = response.credential;
    try {
        // 🌟 補上 line_user_id，讓 Google 登入也能一併綁定
        const res = await api.post('/auth/google', { 
            token: credential,
            line_user_id: lineUserId.value 
        });
        
        if (res.access_token) {
            saveUserSession(res);
            ElMessage.success('Google 登入成功！');
            postLoginRedirect();
        }
    } catch (err) {
        console.error('Google 登入失敗:', err);
        ElMessage.error('Google 登入失敗，請稍後再試');
    }
};

// --- 手動登入邏輯 ---
const handleLogin = async () => {
    const { email: loginIdentifier, password } = formData.value
    try {
        const res = await api.post('/auth/login', {
            identifier: loginIdentifier,
            password: password,
            line_user_id: lineUserId.value 
        });

        if (res && res.access_token) {
            saveUserSession(res);
            
            const msg = lineUserId.value ? '登入並綁定 LINE 成功！' : '登入成功！';
            ElMessage.success(msg);
            
            postLoginRedirect();
        }
    } catch (err) {
        console.log('登入失敗');
    }
}

// --- 封裝重複邏輯：儲存 Session ---
const saveUserSession = (res) => {
    localStorage.setItem('currentUser', JSON.stringify(res.user));
    localStorage.setItem('user_token', res.access_token); 
    api.defaults.headers.common['Authorization'] = `Bearer ${res.access_token}`;
}

// --- 封裝重複邏輯：跳轉判斷 ---
const postLoginRedirect = () => {
    // 如果在 LINE 內開啟，1.5 秒後關閉視窗，讓用戶回到聊天室
    // 這個 LINE 專用的關閉視窗邏輯，只有在 LINE 裡面打開網頁才會執行
    if (liff.isInClient() && lineUserId.value) {
        setTimeout(() => {
            liff.closeWindow();
        }, 1500);
    } else {
        //  當你在本機地端使用 Chrome 打開時，liff.isInClient() 是 false
        // 它會執行這行，正常跳轉到你的 /loading 頁面，完全不影響！
        router.push('/loading');
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