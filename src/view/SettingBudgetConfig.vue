<script setup>
import { ref, onMounted, computed } from 'vue' 
import { ElMessage } from 'element-plus'

/* ========================
    Theme System (與 main.css 對應)
   ======================== */

const themeUnlocks = {
    light: 1,      
    nordic: 1,
    sunset: 1,
    forest: 1,
    lavender: 1,
    dark: 1,
    oasis: 5,   // Lv 5解鎖
    cyber: 10    // Lv 10解鎖
};

// 假設你從 API 或成就系統獲取的當前等級
const userLevel = ref(3);

const themes = computed(() => {
    const baseThemes = {
    light: { 
        name: 'MMA 經典', 
        bgGradient: '#f8fafc', 
        sidebarBg: '#ffffff', 
        primary: '#3b82f6' 
    },
    nordic: { 
        name: '北歐極簡', 
        bgGradient: '#eceff4', 
        sidebarBg: '#d8dee9', 
        primary: '#5e81ac',
        text: '#2e3440'
    },
        sunset: { 
        name: '微醺夕陽', 
        bgGradient: '#fffbeb', 
        sidebarBg: '#ffffff', 
        primary: '#f59e0b' 
    },
    forest: { 
        name: '森林晨曦', 
        bgGradient: '#f0fdf4', 
        sidebarBg: '#ffffff', 
        primary: '#10b981' 
    },
    lavender: { 
        name: '薰衣草園', 
        bgGradient: '#f3f0ff', 
        sidebarBg: '#ffffff', 
        primary: '#b39cd0',
        text: '#4b4453'
    },
    dark: { 
        name: '極客深邃', 
        bgGradient: '#0f172a', 
        sidebarBg: '#1e293b', 
        primary: '#60a5fa' 
    },
    oasis: { 
        name: '沙漠綠洲', 
        bgGradient: '#f7f3f0', 
        sidebarBg: '#caebdf', 
        primary: '#c2a383',
        text: '#4a3f35'
    },
        cyber: { 
        name: '午夜霓虹',
        bgGradient: '#0a0a12', 
        sidebarBg: '#161625', 
        primary: '#ff00ff',
        text: '#e0e0ff'
    }
    };

    Object.keys(baseThemes).forEach(id => {
    const requiredLevel = themeUnlocks[id] || 1;
    baseThemes[id].locked = userLevel.value < requiredLevel;
    baseThemes[id].requiredLevel = requiredLevel; // 順便存起來，顯示在介面上
    });

    return baseThemes;
    });

// 讀取當前前台主題 (注意：key 是 appTheme)
const currentTheme = ref(localStorage.getItem('appTheme') || 'light')

// 2. 切換主題函式
const changeTheme = (id) => {
    if (themes.value[id].locked) {
        // 如果你有引入 ElMessage
        if (typeof ElMessage !== 'undefined') {
            ElMessage.warning(`尚未解鎖！需要 Lv.${themes.value[id].requiredLevel}`);
        } else {
            alert(`尚未解鎖！需要 Lv.${themes.value[id].requiredLevel}`);
        }
        return;
    }

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
                            <div v-if="style.locked" class="lock-overlay">
                                <span class="lock-icon">🔒</span>
                                <span class="lock-text">Lv.{{ style.requiredLevel }} 解鎖</span>
                            </div>
                        </div>
                        <span class="theme_name_color" >{{ style.name }}</span>
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
    display: grid;
    /* 核心設定：分成 6 等份，每份 1fr */
    grid-template-columns: repeat(6, 1fr); 
    gap: 10px; /* 項目之間的間距 */
    width: 70%;
}

.theme-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: transform 0.2s;
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
    width: 100%;
    aspect-ratio: 16 / 10; /* 保持固定寬高比 */
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    border: 2px solid transparent;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transition: all 0.3s;
}

.theme-item.is-selected .theme-preview {
    border-color: var(--theme-primary, #3b82f6);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
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

.theme_name_color {
    color: var(--text-primary);
}

/* 鎖定狀態的容器 */
.theme-item.is-locked {
    cursor: not-allowed; /* 顯示禁止點擊的手勢 */
    opacity: 0.8;
}

/* 鎖定時的預覽圖模糊效果 */
.theme-item.is-locked .theme-preview {
    filter: grayscale(0.8) blur(2px); /* 變灰且模糊 */
    border: 1px dashed rgba(0,0,0,0.1);
}

/* 鎖定遮罩層 */
.lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4); /* 半透明黑底 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(4px); /* 加強模糊感 */
    transition: background 0.3s;
}

/* 鎖定圖示與文字 */
.lock-icon {
    font-size: 24px;
    margin-bottom: 4px;
    filter: none; /* 圖示本身不要模糊 */
}

.lock-text {
    font-size: 12px;
    color: #ffd700; /* 使用金色文字，對應成就獎勵的感覺 */
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* 移除鎖定項目的懸浮位移效果 */
.theme-item.is-locked:hover {
    transform: none;
}

/* 滑鼠懸停在鎖定項目時，遮罩變深一點點提示不可用 */
.theme-item.is-locked:hover .lock-overlay {
    background: rgba(0, 0, 0, 0.6);
}

/* 響應式：如果螢幕太小，自動變更為每排 3 個或 2 個 */
@media (max-width: 1024px) {
    .theme-picker {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 600px) {
    .theme-picker {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>