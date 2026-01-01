<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios' // 記得先執行 npm install axios

const router = useRouter()

// API 基本路徑 (請根據你之後 API 專案的實際位址修改，例如 http://localhost:3000)
const API_BASE_URL = 'http://localhost:3000/api'

// 狀態管理
const loading = ref(false)
const errorMessage = ref('')
const isEmailChecked = ref(false)  // 是否已發送驗證碼
const isOtpVerified = ref(false)   // 驗證碼是否通過

// 表單資料
const email = ref('')
const otp = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

/**
 * 功能 1：發送驗證碼 (連接 API)
 */
const sendVerifyCode = async () => {
    if (!email.value) {
        errorMessage.value = '請先輸入電子郵件'
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        // 發送 POST 請求到後端，後端應檢查 email 是否存在並寄信
        const response = await axios.post(`${API_BASE_URL}/forgot-password/send-otp`, {
            email: email.value
        })

        // 假設後端回傳成功時狀態碼為 200
        isEmailChecked.value = true
        alert('驗證碼已發送至您的信箱，請於 5 分鐘內輸入')
    } catch (err) {
        // 抓取後端回傳的錯誤訊息 (例如: "此信箱尚未註冊")
        errorMessage.value = err.response?.data?.message || '發送失敗，請稍後再試'
    } finally {
        loading.value = false
    }
}

/**
 * 功能 2：檢查驗證碼 (連接 API)
 */
const checkOtp = async () => {
    if (otp.value.length !== 6) {
        errorMessage.value = '請輸入 6 位數驗證碼'
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        // 將 email 與 otp 送交後端比對
        const response = await axios.post(`${API_BASE_URL}/forgot-password/verify-otp`, {
            email: email.value,
            otp: otp.value
        })

        // 比對成功
        isOtpVerified.value = true
        alert('驗證成功，請設定新密碼')
    } catch (err) {
        errorMessage.value = err.response?.data?.message || '驗證碼錯誤或已過期'
    } finally {
        loading.value = false
    }
}

/**
 * 功能 3：最終修改密碼 (連接 API)
 */
const resetPassword = async () => {
    if (!canSubmit.value) return

    loading.value = true
    errorMessage.value = ''

    try {
        // 送出新密碼。注意：為了安全，通常會再次附帶 email 與 otp 以供後端最後確認
        await axios.post(`${API_BASE_URL}/forgot-password/reset`, {
            email: email.value,
            otp: otp.value,
            newPassword: newPassword.value
        })

        alert('密碼重設成功！請使用新密碼登入')
        router.push('/') // 重導向回登入頁
    } catch (err) {
        errorMessage.value = err.response?.data?.message || '修改失敗，請稍後再試'
    } finally {
        loading.value = false
    }
}

const canSubmit = computed(() => {
    return isOtpVerified.value &&
        newPassword.value &&
        confirmPassword.value &&
        newPassword.value === confirmPassword.value &&
        newPassword.value.length >= 8 // 增加基本長度檢查
})

const goToLogin = () => router.push('/')
</script>

<template>
    <div class="forget-password-page">
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
                        <h2>找回密碼 : </h2>
                        <p></p>
                    </div>

                    <div v-if="errorMessage" class="error-box">{{ errorMessage }}</div>

                    <div class="input-block">
                        <label>電子郵件</label>
                        <div class="input-row">
                            <input v-model="email" type="email" placeholder="your@email.com"
                                :disabled="isEmailChecked" />
                            <button @click="sendVerifyCode" :disabled="loading || isEmailChecked"
                                class="btn-gradient-small">
                                {{ isEmailChecked ? '已寄送' : '發送驗證碼' }}
                            </button>
                        </div>
                    </div>

                    <div class="input-block" :class="{ 'is-locked': !isEmailChecked }">
                        <label>驗證碼</label>
                        <div class="input-row">
                            <div class="relative-field">
                                <input v-model="otp" type="text" maxlength="6" placeholder="6 位數字"
                                    :disabled="!isEmailChecked || isOtpVerified" />
                                <span v-if="isOtpVerified" class="verified-tick">✔</span>
                            </div>
                            <button @click="checkOtp" :disabled="!isEmailChecked || isOtpVerified || loading"
                                class="btn-gradient-small">
                                驗證
                            </button>
                        </div>
                    </div>

                    <div class="password-group" :class="{ 'is-locked': !isOtpVerified }">
                        <div class="input-block">
                            <label>新密碼</label>
                            <input v-model="newPassword" type="password" placeholder="••••••••"
                                :disabled="!isOtpVerified" />
                        </div>
                        <div class="input-block">
                            <label>確認新密碼</label>
                            <input v-model="confirmPassword" type="password" placeholder="••••••••"
                                :disabled="!isOtpVerified" />
                        </div>
                    </div>

                    <button @click="resetPassword" class="login-button" :disabled="!canSubmit || loading"
                        :class="{ 'btn-disabled': !canSubmit }">
                        確認修改
                        <span class="arrow">→</span>
                    </button>

                    <div class="footer-link">
                        想起密碼了？ <a href="#" @click.prevent="goToLogin">返回登入</a>
                    </div>
                </div>

                <div class="showcase-section">
                    <div class="showcase-content">
                        <h3>安全重設指南</h3>
                        <p>邁向財富自由的第一步是保護帳戶安全。</p>

                        <div class="feature-grid">
                            <div class="feature-card" :class="{ 'active-card': !isEmailChecked }">
                                <div class="feature-icon">🔍</div>
                                <h3>身份識別</h3>
                                <p>確認您的註冊帳號</p>
                            </div>
                            <div class="feature-card" :class="{ 'active-card': isEmailChecked && !isOtpVerified }">
                                <div class="feature-icon">🛡️</div>
                                <h3>即時驗證</h3>
                                <p>輸入信箱驗證代碼</p>
                            </div>
                            <div class="feature-card" :class="{ 'active-card': isOtpVerified }">
                                <div class="feature-icon">🔐</div>
                                <h3>密碼更新</h3>
                                <p>設定全新高強度密碼</p>
                            </div>
                            <div class="feature-card">
                                <div class="feature-icon">📈</div>
                                <h3>安全找回</h3>
                                <p>恢復所有管理功能</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 頁面基礎設定 - 同步登入頁 */
.forget-password-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* 動態背景效果 */
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

/* 卡片容器 - 增加毛玻璃質感 */
.main-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 1000px;
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

/* 左側表單區域樣式 */
.form-section {
    flex: 1;
    padding: 2.5rem;
}

.logo-area {
    display: flex;
    align-items: center;
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
    font-size: 28px;
}

.brand-name {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1E293B;
}

.header-text h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 0.5rem;
}

.header-text p {
    color: #64748B;
    margin-bottom: 1.5rem;
}

/* 輸入框樣式 */
.input-block {
    margin-bottom: 1rem;
}

.input-block label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #1E293B;
    margin-bottom: 0.5rem;
}

.input-row {
    display: flex;
    gap: 10px;
}

.input-block input {
    width: 100%;
    height: 48px;
    padding: 0 1rem;
    border: 2px solid #E2E8F0;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s;
}

.input-block input:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 小按鈕樣式 - 使用漸層 */
.btn-gradient-small {
    height: 48px;
    padding: 0 1.2rem;
    background: linear-gradient(135deg, #0ca5e2, #4896fc);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
}

/* 主提交按鈕樣式 - 同步登入按鈕 */
.login-button {
    width: 100%;
    height: 48px;
    margin-top: 1.5rem;
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

.login-button:hover:not(.btn-disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);
}

.btn-disabled {
    background: #cbd5e1;
    cursor: not-allowed;
}

/* 右側展示區域 - 改為淺色系 */
.showcase-section {
    flex: 1;
    background: rgba(248, 250, 252, 0.5);
    /* 輕微偏灰的背景 */
    padding: 2.5rem;
    display: flex;
    align-items: center;
}

.showcase-content h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #1E293B;
    margin-bottom: 1rem;
}

.showcase-content p {
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

.active-card {
    border-color: #3B82F6;
    background: #eff6ff;
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.feature-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.feature-card h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1E293B;
    margin-bottom: 4px;
}

.feature-card p {
    font-size: 0.8rem;
    color: #64748B;
    margin-bottom: 0;
}

/* 鎖定邏輯 */
.is-locked {
    opacity: 0.4;
    pointer-events: none;
    filter: grayscale(0.5);
}

.relative-field {
    position: relative;
    flex: 1;
}

.verified-tick {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #10b981;
    font-weight: bold;
}

.error-box {
    background: #fef2f2;
    color: #dc2626;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    border: 1px solid #fee2e2;
}

.footer-link {
    text-align: center;
    margin-top: 1.5rem;
    font-size: 0.875rem;
    color: #64748B;
}

.footer-link a {
    color: #3B82F6;
    font-weight: 500;
    text-decoration: none;
}

@media (max-width: 900px) {
    .card-wrapper {
        flex-direction: column;
    }

    .showcase-section {
        display: none;
    }
}
</style>