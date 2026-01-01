<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const formData = ref({
    email: '',
    password: ''
})

const handleLogin = () => {
    const { email: loginIdentifier, password } = formData.value
    // 這裡 email 其實是登入識別碼

    // 1. 定義測試帳號 
    const defaultAccount = [
        { username: 'admin', email: 'lee611014007@gmail.com', password: '123', role: 'admin' },
        { username: 'peiqing_mma', email: 'peiqing@example.com', password: '123', role: 'admin' },
        { username: 'yuyu_mma', email: 'yuyu@example.com', password: '123', role: 'admin' },
        { username: 'julia_mma', email: 'julia@example.com', password: '123', role: 'admin' },
        { username: 'user', email: 'mma.save.money@gmail.com', password: '123', role: 'user' } // 使用者測試帳號
    ];

    // 2. 讀取註冊用戶
    const registeredUser = JSON.parse(localStorage.getItem('mma_users')) || [];

    // 3. 合併所有用戶
    const allUsers = [...defaultAccount, ...registeredUser];

    // 4. 比對：識別碼可以是 username 或 email
    const user = allUsers.find(u =>
        (u.email === loginIdentifier || u.username === loginIdentifier) &&
        u.password === password
    );

    if (user) {
        // 🌟 關鍵修正：確保存入 localStorage 的 email 是資料中的「真實信箱」
        localStorage.setItem('currentUser', JSON.stringify({
            username: user.username,
            email: user.email, // 這裡會存入 lee6110... 或 mma.save...
            role: user.role
        }));

        if (user.role === 'admin') {
            router.push('/admins');
        } else {
            router.push('/book');
        }
    } else {
        alert('登入失敗，請檢查您的帳號/信箱或密碼。');
    }
}

const handleRegister = () => {
    router.push('/Register')
}
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
                                <img src="../assets/logo.svg" alt="logo" width="48" height="48">
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
                            <input id="email" v-model="formData.email" type="text" placeholder="your@email.com"
                                required />
                        </div>

                        <div class="form-group">
                            <label for="password">密碼</label>
                            <input id="password" v-model="formData.password" type="password" placeholder="••••••••"
                                required />
                        </div>

                        <button type="submit" class="login-button">
                            登入
                            <span class="arrow">→</span>
                        </button>
                    </form>

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
                        <span>邁向財富自由ＧＯ！</span><br>
                        <p></p>
                    </div>

                    <div class="feature-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3>圖表分析</h3>
                            <p>視覺化數據洞察</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">🗓</div>
                            <h3>行事曆</h3>
                            <p>時間軸收支管理</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">⛺</div>
                            <h3>記帳功能</h3>
                            <p>管理所有資產</p>
                        </div>
                        <div class="feature-card">
                            <div class="feature-icon">📈</div>
                            <h3>趨勢預測</h3>
                            <p>AI智能財務建議</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <router-view />
</template>


<style scoped>
.login-page {
    min-height: 100vh;
    /* 調整背景漸層，讓它稍微亮一點，對比動態元素 */
    background: linear-gradient(135deg, #E3F2FD 0%, #F0F9FF 100%);
    position: relative;
    overflow: hidden;
}

.background-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    /* 確保圓圈不會跑出畫面 */
}

/* --- 新增的動態圓圈 CSS --- */
.effect-circle {
    position: absolute;
    border-radius: 50%;
    /* 使用 mix-blend-mode 可以讓重疊的顏色更漂亮，類似水彩效果 */
    mix-blend-mode: multiply;
    /* 稍微模糊邊緣，看起來更柔和 */
    filter: blur(4px);
    /* 應用浮動動畫 */
    animation: floating infinite linear;
}

/* 定義一個緩慢飄移的動畫路徑 */
@keyframes floating {
    0% {
        transform: translate(0, 0) rotate(0deg);
    }

    33% {
        transform: translate(40px, -60px) rotate(120deg);
    }

    66% {
        transform: translate(-30px, 30px) rotate(240deg);
    }

    100% {
        transform: translate(0, 0) rotate(360deg);
    }
}

/* --- 透過 nth-child 為每個圓圈製造隨機性 (大小、位置、顏色、速度) --- */

/* 圓圈 1 (大，藍色) */
.effect-circle:nth-child(1) {
    width: 400px;
    height: 400px;
    background: rgba(59, 130, 246, 0.12);
    /* 主藍色 */
    top: -10%;
    left: -10%;
    animation-duration: 25s;
    animation-delay: -5s;
}

/* 圓圈 2 (中，青色) */
.effect-circle:nth-child(2) {
    width: 300px;
    height: 300px;
    background: rgba(12, 165, 226, 0.15);
    /* 青藍色 */
    top: 20%;
    right: -5%;
    animation-duration: 30s;
    animation-delay: -12s;
    animation-direction: reverse;
    /* 反向移動增加變化 */
}

/* 圓圈 3 (小，深藍) */
.effect-circle:nth-child(3) {
    width: 150px;
    height: 150px;
    background: rgba(30, 64, 175, 0.1);
    /* 深藍色 */
    bottom: 15%;
    left: 10%;
    animation-duration: 20s;
    animation-delay: -2s;
}

/* 圓圈 4 (大，淡青) */
.effect-circle:nth-child(4) {
    width: 350px;
    height: 350px;
    background: rgba(167, 243, 208, 0.15);
    /* 淡青綠色，增加色調變化 */
    bottom: -10%;
    right: 25%;
    animation-duration: 35s;
    animation-delay: -18s;
}

/* 圓圈 5 (中，藍色) */
.effect-circle:nth-child(5) {
    width: 200px;
    height: 200px;
    background: rgba(59, 130, 246, 0.1);
    top: 40%;
    left: 30%;
    animation-duration: 28s;
    animation-delay: -8s;
    animation-direction: reverse;
}

/* 圓圈 6-10 (較小的填充元素) */
.effect-circle:nth-child(6) {
    width: 80px;
    height: 80px;
    background: rgba(12, 165, 226, 0.2);
    top: 10%;
    left: 50%;
    animation-duration: 18s;
}

.effect-circle:nth-child(7) {
    width: 120px;
    height: 120px;
    background: rgba(59, 130, 246, 0.1);
    bottom: 30%;
    right: 40%;
    animation-duration: 22s;
    animation-delay: -10s;
}

.effect-circle:nth-child(8) {
    width: 60px;
    height: 60px;
    background: rgba(167, 243, 208, 0.2);
    top: 60%;
    right: 10%;
    animation-duration: 15s;
    animation-delay: -3s;
}

.effect-circle:nth-child(9) {
    width: 90px;
    height: 90px;
    background: rgba(30, 64, 175, 0.08);
    bottom: 5%;
    left: 40%;
    animation-duration: 26s;
    animation-direction: reverse;
}

.effect-circle:nth-child(10) {
    width: 180px;
    height: 180px;
    background: rgba(12, 165, 226, 0.1);
    top: -5%;
    right: 30%;
    animation-duration: 32s;
    animation-delay: -15s;
}

/* --- 原有樣式保持不變 (省略部分未修改的樣式以節省空間，請保留您原本的樣式) --- */

.login-container {
    position: relative;
    z-index: 10;
    display: flex;
    min-height: 100vh;
}

.login-form-section {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.form-card {
    width: 100%;
    max-width: 448px;
    padding: 2rem;
    /* 增加一點背景模糊的透明度，讓動態背景透出來 */
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    /* 增加一個細微的邊框 */
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* ... (其餘 .logo-section, .welcome-text, .login-form 等樣式保持您原本的代碼) ... */
.logo-section {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 24px;
}

.logo-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #b1e7eb, #c1cadf);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-icon .icon {
    font-size: 28px;
    /* 臨時樣式，用於文字替代圖片時 */
    color: #1E293B;
    font-weight: bold;
}

.brand-name {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1E293B;
}

.welcome-text {
    text-align: center;
    margin-bottom: 1.5rem;
}

.welcome-text h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 0.5rem;
}

.welcome-text p {
    color: #64748B;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1E293B;
}

.form-group input {
    height: 48px;
    padding: 0 1rem;
    border: 2px solid #E2E8F0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
    /* 讓輸入框背景稍微透明一點 */
    background: rgba(255, 255, 255, 0.8);
}

.form-group input:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #fff;
}

.login-button {
    height: 48px;
    margin-top: 0.5rem;
    background: linear-gradient(135deg, #0ca5e2, #4896fc);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.login-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.login-button .arrow {
    transition: transform 0.2s;
}

.login-button:hover .arrow {
    transform: translateX(4px);
}

.register-link {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: #64748B;
}

.register-link a {
    color: #3B82F6;
    font-weight: 500;
    text-decoration: none;
}

.register-link a:hover {
    text-decoration: underline;
}

.showcase-section {
    flex: 1;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

@media (min-width: 1024px) {
    .showcase-section {
        display: flex;
    }
}

.showcase-content {
    max-width: 512px;
}

.showcase-title h2 {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1.2;
    color: #1E293B;
    margin-bottom: 1rem;
}

.showcase-title p {
    font-size: 1.125rem;
    color: #64748B;
    line-height: 1.75;
    margin-bottom: 2rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.feature-card {
    padding: 1.5rem;
    background: rgba(255, 255, 255, 0.8);
    /* 讓右側卡片也稍微透明 */
    backdrop-filter: blur(10px);
    border: 2px solid #E2E8F0;
    border-radius: 12px;
    transition: all 0.2s;
}

.feature-card:hover {
    border-color: #3B82F6;
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    background: #fff;
}

.feature-icon {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
}

.feature-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 0.25rem;
}

.feature-card p {
    font-size: 0.875rem;
    color: #64748B;
}
</style>