<template>
  <div class="login-page">
    <div class="background-effects">
      <div class="effect-circle effect-1"></div>
      <div class="effect-circle effect-2"></div>
    </div>

    <div class="login-container">
      <div class="login-form-section">
        <div class="form-card">
          <div class="logo-section">
            <div class="logo-icon">
              <span class="icon">💼</span>
            </div>
            <h1 class="brand-name">Money MMA</h1>
          </div>

          <div class="welcome-text">
            <h2>歡迎回來</h2>
            <p>登入您的財務管理系統</p>
          </div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="form-group">
              <label for="email">電子郵件</label>
              <input 
                id="email" 
                v-model="formData.email" 
                type="email" 
                placeholder="your@email.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">密碼</label>
              <input 
                id="password" 
                v-model="formData.password" 
                type="password" 
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" class="login-button">
              開始使用
              <span class="arrow">→</span>
            </button>
          </form>

          <div class="register-link">
            還沒有帳號？ <a href="#" @click.prevent="handleRegister">立即註冊</a>
          </div>
        </div>
      </div>

      <div class="showcase-section">
        <div class="showcase-content">
          <div class="showcase-title">
            <h2>專業財務管理<br><span class="highlight">化繁為簡</span></h2>
            <p>智能記帳系統，讓您輕鬆掌握每一筆收支，實現財務自由的第一步</p>
          </div>

          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">📊</div>
              <h3>圖表分析</h3>
              <p>視覺化數據洞察</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">📅</div>
              <h3>行事曆</h3>
              <p>時間軸收支管理</p>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💼</div>
              <h3>多帳戶</h3>
              <p>統一管理所有資產</p>
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
</template>

<script setup>
import { reactive } from 'vue'

const formData = reactive({
  email: '',
  password: ''
})

const handleLogin = () => {
  console.log('Login attempt:', formData.email)
  window.location.href = '/dashboard'
}

const handleRegister = () => {
  window.location.href = '/Register'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%);
  position: relative;
  overflow: hidden;
}

.background-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.effect-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
  animation: pulse 4s ease-in-out infinite;
}

.effect-1 {
  width: 384px;
  height: 384px;
  background: #3B82F6;
  top: 25%;
  left: 25%;
}

.effect-2 {
  width: 384px;
  height: 384px;
  background: #2563EB;
  bottom: 25%;
  right: 25%;
  animation-delay: 1s;
}

@keyframes pulse {
  0%, 100% { opacity: 0.1; transform: scale(1); }
  50% { opacity: 0.15; transform: scale(1.1); }
}

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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

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
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon .icon {
  font-size: 28px;
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
}

.form-group input:focus {
  outline: none;
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.login-button {
  height: 48px;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
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

.showcase-title .highlight {
  color: #3B82F6;
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
  background: white;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  transition: all 0.2s;
}

.feature-card:hover {
  border-color: #3B82F6;
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
