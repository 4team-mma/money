<script setup>
import { ref, onMounted } from 'vue'

/* ========================
   Theme System (與 main.css 對應)
   ======================== */
const themes = {
    light: { 
        name: 'MMA 經典', 
        bgGradient: '#f8fafc', 
        sidebarBg: '#ffffff', 
        primary: '#3b82f6' 
    },
    dark: { 
        name: '極客深邃', 
        bgGradient: '#0f172a', 
        sidebarBg: '#1e293b', 
        primary: '#60a5fa' 
    },
    forest: { 
        name: '森林晨曦', 
        bgGradient: '#f0fdf4', 
        sidebarBg: '#ffffff', 
        primary: '#10b981' 
    },
    sunset: { 
        name: '微醺夕陽', 
        bgGradient: '#fffbeb', 
        sidebarBg: '#ffffff', 
        primary: '#f59e0b' 
    }
}

// 讀取當前前台主題 (注意：key 是 appTheme)
const currentTheme = ref(localStorage.getItem('appTheme') || 'light')

// 2. 切換主題函式
const changeTheme = (id) => {
    currentTheme.value = id
    localStorage.setItem('appTheme', id)
    
    // 設定 html 屬性以觸發 main.css 變數切換
    document.documentElement.setAttribute('data-theme', id)
    
    // 發送事件通知 Nav.vue 或其他組件
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: id }))
}

// 偏好設定資料
const preferences = ref({
    language: 'zh-TW',
    currency: 'TWD',
    theme: 'light',
    budgetPeriod: 'monthly',
    budgetAlert: '75',
    weekStart: '0'
})

// 儲存設定
const savePreferences = () => {
    alert('偏好設定已儲存！')
}

onMounted(() => {
    // 初始化選中的主題狀態
    const saved = localStorage.getItem('appTheme')
    if (saved && themes[saved]) {
        currentTheme.value = saved
    }
})
</script>

<template>
    <div class="tab-content">
        
        <div class="settings-section">
            <h2>介面外觀</h2>
            
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
/* 引用前台設定樣式 (setting.css) */
@import '../assets/css/setting.css';

/* 主題選擇器樣式 (補在這裡確保不依賴 admin.css) */
.theme-picker {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 10px;
}

.theme-item {
    cursor: pointer;
    text-align: center;
    transition: 0.3s;
    opacity: 0.7;
}

.theme-item:hover, .theme-item.is-selected {
    opacity: 1;
    transform: translateY(-2px);
}

.theme-item.is-selected span {
    font-weight: 700;
    color: var(--color-primary);
}

.theme-preview {
    width: 100px;
    height: 60px;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    border: 2px solid var(--border-color);
    margin-bottom: 8px;
    transition: 0.3s;
}

.theme-item.is-selected .theme-preview {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.preview-sidebar {
    width: 25%;
    height: 100%;
    position: absolute;
    left: 0;
    border-right: 1px solid rgba(0,0,0,0.05);
}

.preview-accent {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: absolute;
    bottom: 8px;
    right: 8px;
}
</style>
