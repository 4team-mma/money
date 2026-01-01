<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const formData = reactive({
    username: '', // 
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
})

const handleRegister = () => {
    // 1. 驗證密碼一致性
    if (formData.password !== formData.confirmPassword) {
        alert('密碼不一致，請重新輸入')
        return
    }

    // 2. 取得現有列表
    const savedUsers = JSON.parse(localStorage.getItem('mma_users') || '[]');

    // 3. 檢查重複性 (檢查 Email 或 帳號 是否已存在)
    const isDuplicate = savedUsers.find(u =>
        u.email === formData.email || u.username === formData.username
    );

    if (isDuplicate) {
        alert('此帳號或 Email 已被註冊');
        return;
    }

    // 4. 建立新用戶 (確保欄位與 Store 對齊)
    const newUser = {
        uid: String(savedUsers.length + 2).padStart(4, "0"), // 生成 U-000x 格式的編號
        username: formData.username, //  儲存帳號
        name: formData.name,         // 儲存顯示名稱
        email: formData.email,       // 儲存信箱
        password: formData.password,
        role: 'user',                // 預設為一般用戶
        totalSpent: 0,
        transactions: 0,
        registeredDate: new Date().toLocaleDateString(),
        status: 'active',
        statusText: '正常'
    };

    // 5. 儲存並跳轉
    savedUsers.push(newUser);
    localStorage.setItem('mma_users', JSON.stringify(savedUsers));

    alert('註冊成功，請使用帳號或信箱登入！');
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
/* 保持你原本的所有 CSS 樣式 ... */
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

.background-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
}

.effect-circle {
    position: absolute;
    border-radius: 50%;
    mix-blend-mode: multiply;
    filter: blur(4px);
    animation: floating infinite linear;
}

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

.effect-circle:nth-child(1) {
    width: 400px;
    height: 400px;
    background: rgba(59, 130, 246, 0.12);
    top: -10%;
    left: -10%;
    animation-duration: 25s;
}

.effect-circle:nth-child(2) {
    width: 300px;
    height: 300px;
    background: rgba(12, 165, 226, 0.15);
    top: 20%;
    right: -5%;
    animation-duration: 30s;
}

.effect-circle:nth-child(3) {
    width: 150px;
    height: 150px;
    background: rgba(30, 64, 175, 0.1);
    bottom: 15%;
    left: 10%;
    animation-duration: 20s;
}

.effect-circle:nth-child(4) {
    width: 350px;
    height: 350px;
    background: rgba(167, 243, 208, 0.15);
    bottom: -10%;
    right: 25%;
    animation-duration: 35s;
}

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

.brand-name {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1E293B;
}

.header-text h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 4px;
}

.header-text p {
    color: #64748B;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
}

.register-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1E293B;
}

.password-row {
    display: flex;
    gap: 1rem;
}

input[type="text"],
input[type="email"],
input[type="password"] {
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

.checkbox-group input {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

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

.divider::before,
.divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: #E2E8F0;
}

.divider span {
    padding: 0 10px;
}

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

.login-link {
    text-align: center;
    margin-top: 1.2rem;
    font-size: 0.875rem;
    color: #64748B;
}

.login-link a {
    color: #3B82F6;
    font-weight: 600;
    text-decoration: none;
}

.showcase-section {
    flex: 0.9;
    background: rgba(248, 250, 252, 0.5);
    padding: 2.5rem;
    display: flex;
    align-items: center;
}

.showcase-header h3 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 0.5rem;
}

.showcase-header p {
    color: #64748B;
    margin-bottom: 2rem;
}

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

.feature-card:hover {
    border-color: #3B82F6;
    transform: translateY(-3px);
}

@media (max-width: 900px) {
    .card-wrapper {
        flex-direction: column;
    }

    .showcase-section {
        display: none;
    }

    .password-row {
        flex-direction: column;
    }
}
</style>