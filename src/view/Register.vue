
<script setup>
import { reactive } from 'vue'

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
        alert('此 Email 已被註冊'); return;
    }

    // 建立新用戶 (預設角色為一般用戶)
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
</script>


<template>
    <div class="login-container">
        <div class="login-card">
            <!-- Left Side - Registration Form -->
            <div class="login-left">
                <div class="logo-section">
                    <div class="logo">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <line x1="12" y1="2" x2="12" y2="22"></line>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                    </div>
                    <h1>MMA</h1>
                </div>

                <div class="form-section">
                    <h2>創建新帳戶</h2>
                    <p class="subtitle">開始您的財務管理之旅</p>

                    <form @submit.prevent="handleRegister" class="form">
                        <div class="form-group">
                            <label>姓名</label>
                            <input v-model="formData.name" type="text" placeholder="請輸入您的姓名" required />
                        </div>

                        <div class="form-group">
                            <label>電子郵件</label>
                            <input v-model="formData.email" type="email" placeholder="your@email.com" required />
                        </div>

                        <div class="form-group">
                            <label>密碼</label>
                            <input v-model="formData.password" type="password" placeholder="至少 8 個字元" required />
                        </div>

                        <div class="form-group">
                            <label>確認密碼</label>
                            <input v-model="formData.confirmPassword" type="password" placeholder="再次輸入密碼" required />
                        </div>

                        <div class="checkbox-group">
                            <input v-model="formData.agreeTerms" type="checkbox" id="terms" required />
                            <label for="terms">我同意服務條款和隱私政策</label>
                        </div>

                        <button type="submit" class="btn-primary">註冊</button>
                    </form>

                    <div class="divider">
                        <span>或使用以下方式註冊</span>
                    </div>

                    <div class="social-buttons">
                        <button class="btn-social">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button class="btn-social">
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor"
                                    d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                    <p class="register-link">
                        已經有帳戶了？
                        <a href="/" @click.prevent="goToLogin">登入</a>
                    </p>
                </div>
            </div>

            <!-- Right Side - Features -->
            <div class="login-right">
                <div class="feature-content">
                    <h2>開始智能理財</h2>
                    <p>加入 FinanceFlow，體驗專業的財務管理工具</p>

                    <div class="features">
                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>
                            <div>
                                <h3>智能記帳</h3>
                                <p>快速記錄每筆收支，自動分類管理</p>
                            </div>
                        </div>

                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                </svg>
                            </div>
                            <div>
                                <h3>數據分析</h3>
                                <p>視覺化圖表，洞察財務趨勢</p>
                            </div>
                        </div>

                        <div class="feature-item">
                            <div class="feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div>
                                <h3>安全可靠</h3>
                                <p>銀行級加密，保護您的資料安全</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

/* 背景顏色 */
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #182e91 0%, #0fd2f5 100%);
    position: relative;
    overflow: hidden;
}

.login-container::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    top: -200px;
    left: -200px;
    animation: float 6s ease-in-out infinite;
}

.login-container::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    bottom: -150px;
    right: -150px;
    animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(20px);
    }
}

.login-card {
    display: flex;
    width: 100%;
    max-width: 1100px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    position: relative;
    z-index: 1;
}

.login-left {
    flex: 1;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    overflow-y: auto;
}

.logo-section {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
}

.logo {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #3c75f1 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.logo svg {
    width: 28px;
    height: 28px;
}

.logo-section h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.form-section h2 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.subtitle {
    color: #64748b;
    margin-bottom: 2rem;
    font-size: 0.95rem;
}

.form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #334155;
}

.form-group input {
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 0.95rem;
    transition: all 0.2s;
    background: #f8fafc;
}

.form-group input:focus {
    outline: none;
    border-color: #54b3f3;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
}

.checkbox-group label {
    font-size: 0.875rem;
    color: #64748b;
    cursor: pointer;
}

.btn-primary {
    padding: 1rem;
    background: linear-gradient(135deg, #4b8ce0 0%, #1e7bf5 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    margin-top: 0.5rem;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.divider {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    color: #94a3b8;
    font-size: 0.875rem;
}

.divider::before,
.divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
}

.divider span {
    padding: 0 1rem;
}

.social-buttons {
    display: flex;
    gap: 1rem;
}

.btn-social {
    flex: 1;
    padding: 0.875rem;
    border: 2px solid #e2e8f0;
    background: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-weight: 600;
    color: #475569;
}

.btn-social:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
}

.btn-social svg {
    width: 20px;
    height: 20px;
}

.register-link {
    text-align: center;
    margin-top: 1.5rem;
    color: #64748b;
    font-size: 0.95rem;
}

.register-link a {
    color: #2f51eb;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
}

.register-link a:hover {
    text-decoration: underline;
}

.login-right {
    flex: 1;
    background: linear-gradient(135deg, #4ba2db 0%, #060c5f 100%);
    padding: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.feature-content h2 {
    font-size: 2.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
}

.feature-content>p {
    font-size: 1.125rem;
    opacity: 0.9;
    margin-bottom: 3rem;
}

.features {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.feature-item {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
}

.feature-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.feature-icon svg {
    width: 24px;
    height: 24px;
}

.feature-item h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.feature-item p {
    opacity: 0.9;
    font-size: 0.95rem;
    line-height: 1.5;
}

@media (max-width: 968px) {
    .login-card {
        flex-direction: column;
    }

    .login-right {
        order: -1;
    }
}
</style>
