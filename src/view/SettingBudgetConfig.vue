<script setup>
import { ref } from 'vue'

// 1. 直接在組件內定義主題資料
const themes = {
    mma_light: { name: 'MMA 經典', primary: '#3b82f6', bgGradient: 'linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%)', cardBg: 'rgba(255, 255, 255, 0.85)', sidebarBg: 'rgba(255, 255, 255, 0.7)', text: '#1e293b', border: 'rgba(255, 255, 255, 0.5)' },
    dark: { name: '極客深邃', primary: '#60a5fa', bgGradient: 'linear-gradient(135deg, #0f172a 0%, #111827 100%)', cardBg: 'rgba(31, 41, 55, 0.9)', sidebarBg: 'rgba(17, 24, 39, 0.95)', text: '#FFFFFF', border: 'rgba(255, 255, 255, 0.15)' },
    forest: { name: '森林晨曦', primary: '#10b981', bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)', text: '#064e3b', border: 'rgba(16, 185, 129, 0.2)' },
    sunset: { name: '微醺夕陽', primary: '#f59e0b', bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)', text: '#78350f', border: 'rgba(245, 158, 11, 0.2)' }
}

const currentTheme = ref(localStorage.getItem('adminTheme') || 'mma_light')

// 2. 切換主題函式
const changeTheme = (id) => {
    currentTheme.value = id
    localStorage.setItem('adminTheme', id)
    
    // 核心：發送一個全域事件，讓父層或其他組件知道主題變了
    window.dispatchEvent(new Event('theme-changed'))
}


// 標籤頁
const activeTab = ref('profile')
const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'preferences', label: '偏好設定', icon: '⚙️' },
    { id: 'security', label: '帳號設置', icon: '🔒' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'output', label: '輸出', icon: '📂' },
]

// 偏好設定
const preferences = ref({
    language: 'zh-TW',
    currency: 'TWD',
    theme: 'light',
    budgetPeriod: 'monthly',
    budgetAlert: '75',
    weekStart: '0'
})

// 儲存偏好設定
const savePreferences = () => {
    alert('偏好設定已儲存！')
}
</script>


<template>
            <!-- 偏好設定 -->
                <div class="tab-content">
        <div class="settings-section">
    

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>貨幣</h3>
                            <p>預設貨幣單位</p>
                        </div>
                        <select v-model="preferences.currency" class="select-input">
                            <option value="TWD">台幣 (TWD)</option>
                            <option value="USD">美元 (USD)</option>
                            <option value="JPY">日圓 (JPY)</option>
                            <option value="CNY">人民幣 (CNY)</option>
                        </select>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>主題</h3>
                            <p>選擇介面主題</p>
                        </div>
                        <div class="theme-picker">
                            <div v-for="(style, id) in themes" :key="id" class="theme-item"
                                :class="{ 'is-selected': currentTheme === id }" @click="changeTheme(id)">
                                <div class="theme-preview" :style="{ background: style.bgGradient }">
                                    <div class="preview-sidebar" :style="{ background: style.sidebarBg }"></div>
                                        <div class="preview-accent" :style="{ background: style.primary }"></div>
                                </div>
                                <span>{{ style.name }}</span>
                            </div>
                    </div>
                    </div>
                </div>

                <div class="settings-section">
                    <h2>預算設定</h2>
                    總預算,分類預算,預算週期

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>預算週期</h3>
                            <p>預算重置週期</p>
                        </div>
                        <select v-model="preferences.budgetPeriod" class="select-input">
                            <option value="monthly">每月</option>
                            <option value="weekly">每週</option>
                            <option value="yearly">每年</option>
                        </select>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>預算提醒</h3>
                            <p>預算達到多少時提醒</p>
                        </div>
                        <select v-model="preferences.budgetAlert" class="select-input">
                            <option value="50">50%</option>
                            <option value="75">75%</option>
                            <option value="90">90%</option>
                            <option value="100">100%</option>
                        </select>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>週起始日</h3>
                            <p>每週從哪一天開始</p>
                        </div>
                        <select v-model="preferences.weekStart" class="select-input">
                            <option value="0">星期日</option>
                            <option value="1">星期一</option>
                        </select>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-secondary">重置</button>
                    <button class="btn-primary" @click="savePreferences">儲存設定</button>
                </div>
            </div>

</template>


<style scoped>
@import '../assets/css/setting.css';
@import "../assets/css/admin.css";
</style>
