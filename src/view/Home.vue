<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formData = ref({
    email: '',
    password: ''
})

const handleLogin = async () => {
    const { email: loginIdentifier, password } = formData.value
    
    try {
        // 🌟 1. 統一使用 res 接收 API 結果
        const res = await api.post('/auth/login', {
            identifier: loginIdentifier,
            password: password
        });

        // 🌟 2. 直接檢查 res.access_token (攔截器已拆箱)
        if (res && res.access_token) {
            const user = res.user;
            const token = res.access_token;

            // 存入 localStorage 供全系統使用
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('user_token', token); 
            
            ElMessage.success('登入成功！');

            // 依角色跳轉
            if (user.role === 'admin') {
                router.push('/admins');
            } else {
                router.push('/book');
            }
        }
    } catch (err) {
        // 🌟 3. 錯誤處理邏輯
        // 這裡不需要再跳 ElMessage（攔截器做過了）
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
                            <input id="email" v-model="formData.email" type="text" placeholder="your@email.com" required />
                        </div>

                        <div class="form-group">
                            <label for="password">密碼</label>
                            <input id="password" v-model="formData.password" type="password" placeholder="••••••••" required />
                        </div>

                        <button type="submit" class="login-button">
                            登入 <span class="arrow">→</span>
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
                        <span>邁向財富自由ＧＯ！</span>
                    </div>

                    <div class="feature-grid">
                        <div v-for="(f, i) in [
                            {icon:'📊', t:'圖表分析', d:'視覺化數據洞察'},
                            {icon:'🗓', t:'行事曆', d:'時間軸收支管理'},
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
</style>