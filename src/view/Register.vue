<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router' 

const router = useRouter() 
const formData = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
})

const handleRegister = () => {
    if (formData.password !== formData.confirmPassword) {
        alert('密碼不一致，請重新輸入')
        return
    }
    
    // 取得現有列表
    const savedUsers = JSON.parse(localStorage.getItem('mma_users') || '[]');

    // 檢查重複
    if (savedUsers.find(u => u.email === formData.email)) {
        alert('此 Email 已被註冊'); 
        return;
    }

    // 建立新用戶
    const newUser = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        registeredDate: new Date().toLocaleDateString(),
        status: 'active',
        statusText: '正常',
        role: 'user'
    };

    savedUsers.push(newUser);
    localStorage.setItem('mma_users', JSON.stringify(savedUsers));

    alert('註冊成功，請重新登入！');
    router.push('/'); // 回登入頁
}

const goToLogin = () => {
    router.push('/')
}
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
                        <h2>創建新帳戶</h2>
                        <p>開始您的智能理財之旅</p>
                    </div>

                    <form @submit.prevent="handleRegister" class="register-form">
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
/* 頁面基礎設定 - 同步主頁配色 */
.register-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'PingFang TC', 'Microsoft JhengHei', sans-serif;
}

/* 動態背景效果 */.background-effects {
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
/* 容器與卡片 */
.main-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1050px;
    padding: 2rem;
}

.card-wrapper {
    display: flex;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
}

/* 左側表單 */
.form-section {
    flex: 1.1;
    padding: 2.5rem;
}

.logo-area {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.logo-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #b1e7eb, #c1cadf);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.brand-name { font-size: 1.75rem; font-weight: 700; color: #1E293B; }

.header-text h2 { font-size: 1.5rem; font-weight: 600; color: #1E293B; margin-bottom: 4px; }
.header-text p { color: #64748B; margin-bottom: 1.5rem; font-size: 0.95rem; }

/* 表單控制 */
.register-form { display: flex; flex-direction: column; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.form-group label { font-size: 0.875rem; font-weight: 500; color: #1E293B; }

.password-row { display: flex; gap: 1rem; }

input[type="text"], input[type="email"], input[type="password"] {
    height: 44px;
    padding: 0 1rem;
    border: 2px solid #E2E8F0;
    border-radius: 8px;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.8);
}

input:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: #fff;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    color: #64748B;
}

.checkbox-group input { width: 16px; height: 16px; cursor: pointer; }

/* 按鈕 - 同步漸層配色 */
.submit-button {
    height: 46px;
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
    margin-top: 5px;
}

.submit-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.divider {
    display: flex;
    align-items: center;
    margin: 1.2rem 0;
    color: #CBD5E1;
    font-size: 0.8rem;
}
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E2E8F0; }
.divider span { padding: 0 10px; }

.btn-social {
    width: 100%;
    height: 42px;
    background: white;
    border: 2px solid #E2E8F0;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s;
}
.btn-social:hover { background: #F8FAF6; border-color: #CBD5E1; }

.login-link { text-align: center; margin-top: 1.2rem; font-size: 0.875rem; color: #64748B; }
.login-link a { color: #3B82F6; font-weight: 600; text-decoration: none; }

/* 右側 Showcase */
.showcase-section {
    flex: 0.9;
    background: rgba(248, 250, 252, 0.5);
    padding: 2.5rem;
    display: flex;
    align-items: center;
}

.showcase-header h3 { font-size: 1.75rem; font-weight: 700; color: #1E293B; margin-bottom: 0.5rem; }
.showcase-header p { color: #64748B; margin-bottom: 2rem; }

.feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.feature-card {
    padding: 1.2rem;
    background: white;
    border: 2px solid #E2E8F0;
    border-radius: 12px;
    transition: all 0.3s;
}
.feature-card:hover { border-color: #3B82F6; transform: translateY(-3px); box-shadow: 0 8px 12px rgba(0,0,0,0.05); }

.feature-icon { font-size: 1.5rem; margin-bottom: 0.5rem; }
.feature-card h3 { font-size: 0.95rem; font-weight: 600; color: #1E293B; margin-bottom: 4px; }
.feature-card p { font-size: 0.75rem; color: #64748B; line-height: 1.4; }

/* 手機適應 */
@media (max-width: 900px) {
    .card-wrapper { flex-direction: column; max-height: 90vh; overflow-y: auto; }
    .showcase-section { display: none; }
    .password-row { flex-direction: column; }
}
</style>