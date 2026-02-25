<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api' 
import.meta.env.VITE_RECAPTCHA_SITE_KEY
import { ElMessage } from 'element-plus'
const router = useRouter()



// 狀態管理
const loading = ref(false)
const errorMessage = ref('')
const isEmailChecked = ref(false) 
const isOtpVerified = ref(false) 
const countdown = ref(0) //倒數計時器
let timer = null //倒數計時器

// 表單資料
const email = ref('')
const otp = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// --- 0. 設定倒數函式 ---
const startCountdown = () => {
    countdown.value = 60 // 設定 60 秒
    timer = setInterval(() => {
        if (countdown.value > 0) {
            countdown.value--
        } else {
            clearInterval(timer)
        }
    }, 1000)
}

// 在組件銷毀時清除計時器，防止記憶體洩漏
import { onUnmounted } from 'vue'
onUnmounted(() => {
    if (timer) clearInterval(timer)
})

/**
 * 功能 1：發送驗證碼
 */
const sendVerifyCode = async () => {
    if (!window.grecaptcha) {
        errorMessage.value = '驗證系統尚未就緒，請重整頁面'
        return
    }

    if (!email.value || countdown.value > 0) return 
    // 如果正在倒數則不執行

    loading.value = true
    errorMessage.value = ''

    try {
        // 執行 reCAPTCHA
        const token = await new Promise((resolve, reject) => {
            window.grecaptcha.ready(() => {
                // 這裡引用 .env 變數
                window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'forgot_password' })
                    .then(resolve)
                    .catch(reject);
            });
        });

        // 對應路徑 /forgot-password/send-otp
        await api.post('/auth/forgot-password/send-otp', {
            email: email.value,
            recaptcha_token: token
        })

        isEmailChecked.value = true
        startCountdown() // 成功後啟動倒數
        alert('驗證碼已發送至您的信箱，請於 5 分鐘內輸入')
    } catch (err) {
        // FastAPI 報錯訊息通常在 err.response.data.detail
        errorMessage.value = err.response?.data?.detail || '此信箱尚未註冊或發送失敗'
        if (err.response?.status === 429) startCountdown()
    } finally {
        loading.value = false
    }
}

/**
 * 功能 2：檢查驗證碼
 */
const checkOtp = async () => {
    if (otp.value.length !== 6) {
        errorMessage.value = '請輸入 6 位數驗證碼'
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        await api.post('/auth/forgot-password/verify-otp', {
            email: email.value,
            otp: otp.value
        })

        isOtpVerified.value = true
        alert('驗證成功，請設定新密碼')
    } catch (err) {
        errorMessage.value = err.response?.data?.detail || '驗證碼錯誤或已過期'
    } finally {
        loading.value = false
    }
}

/**
 * 功能 3：最終修改密碼
 */
const resetPassword = async () => {
    if (!canSubmit.value) return

    loading.value = true
    errorMessage.value = ''

    try {
        // 🌟 修正點 4：欄位名稱需對應後端 Pydantic Schema 的 new_password (蛇形)
        await api.post('/auth/forgot-password/reset', {
            email: email.value,
            otp: otp.value,
            new_password: newPassword.value 
        })

        localStorage.removeItem('user_token');
        localStorage.removeItem('currentUser');
        
        ElMessage.success('密碼重設成功！即將前往登入頁面！請使用新密碼登入');

        setTimeout(() => {
            router.push('/'); // 跳回登入頁
        }, 1500);
    } catch (err) {
        errorMessage.value = err.response?.data?.detail || '修改失敗，請稍後再試'
    } finally {
        loading.value = false
    }
}

const canSubmit = computed(() => {
    return isOtpVerified.value &&
        newPassword.value &&
        confirmPassword.value &&
        newPassword.value === confirmPassword.value &&
        newPassword.value.length >= 3 // 🌟 密碼長度限制
})

const goToLogin = () => router.push('/')

const passwordMismatch = computed(() => {
    return confirmPassword.value && newPassword.value !== confirmPassword.value
})
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
                                <img src="../assets/logo.svg" alt="logo" width="68" height="68">
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
                                :disabled="isEmailChecked && countdown > 0" />

                            <button @click="sendVerifyCode" :disabled="loading || countdown > 0 "
                                class="btn-gradient-small"
                                :class="{ 'btn-counting': countdown > 0}" >

                                <span v-if="loading">傳送中...</span>
                                <span v-else-if="countdown > 0">重新發送 ({{ countdown }}s)</span>
                                <span v-else>{{ isEmailChecked ? '重新發送' : '發送驗證碼' }}</span>
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
                            <span v-if="passwordMismatch" style="white-space: nowrap;">❌ 密碼輸入不一致</span>
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
                                <div class="feature-icon">🐾</div>
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
@import '../assets/css/forgetpassword.css';


</style>