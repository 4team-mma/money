<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { triggerMissionAction } from '@/api/gamification';
import { ElMessage, ElLoading } from 'element-plus'
import { settingApi } from '@/api/setting';
import api from '@/api';

const userId = 1
// 偏好設定資料
const preferences = ref({
    currency: 'TWD',
    budget_cycle: 'monthly',
    budget_alert_threshold: 75,
    start_of_week: 0
});

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
    cyber: 10,  // Lv 10解鎖

    // --- 【解鎖位置備註】 ---
    // 這裡原本應該綁定 API 取得的卡牌解鎖狀態 (檢查是否擁有對應的 reward_unlock_feature)。
    // 為了讓你先預覽效果，我先將門檻設為 1 (預設開啟)。
    // 之後串接後端時，可以將這裡改成 true/false 的布林值判斷。
    nt_gold: 15,  // 對應 NT 財富領主 (UNLOCK_CUSTOM_THEME1)
    sp_ocean: 18, // 對應 SP 投資先鋒 (UNLOCK_CUSTOM_THEME2)
    sj_wood: 20,   // 對應 SJ 理財初心者 (UNLOCK_CUSTOM_THEME3)
};

// 假設你從 API 或成就系統獲取的當前等級
const userLevel = ref(3);
const currentTheme = ref('light');

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
        },
        // --- 新增的三個卡牌特殊解鎖主題 ---
        nt_gold: {
            name: '科技流金 (NT獎勵)',
            // 改為深褐金漸層，完美對應實際背景色
            bgGradient: 'linear-gradient(135deg, #110800 0%, #2a1600 100%)',
            // 側邊欄改為對應的半透明深色
            sidebarBg: 'rgba(26, 15, 0, 0.95)',
            // 品牌高光色改為亮金橘
            primary: '#f59e0b',
            // 文字改為亮金
            text: '#fef3c7'
        },
        sp_ocean: {
            name: '深海波光 (SP獎勵)',
            bgGradient: 'radial-gradient(circle at 50% 0%, #0369a1, #082f49)',
            sidebarBg: '#0c4a6e',
            primary: '#38bdf8',
            text: '#e0f2fe'
        },
        sj_wood: {
            name: '木質散步 (SJ獎勵)',
            bgGradient: '#f5ebe0',
            sidebarBg: '#faf4f0',
            primary: '#9c6644',
            text: '#5c4033'
        } };
    Object.keys(baseThemes).forEach(id => {
        const requiredLevel = themeUnlocks[id] || 1;
        baseThemes[id].locked = userLevel.value < requiredLevel;
        baseThemes[id].requiredLevel = requiredLevel; // 順便存起來，顯示在介面上
    });

    return baseThemes;
});

// 1. 初始化：從後端獲取設定
const fetchUserData = async () => {
    const loading = ElLoading.service({ target: '.tab-content', text: '載入設定中...' });
    try {
        // 同時獲取個人資料(等級)與系統設定
        const [userRes, settingRes] = await Promise.all([
            api.get(`/users/me`),
            settingApi.getSetting(userId)
        ]);

        // 更新等級
        userLevel.value = userRes.level || 1;

        // 更新設定與主題
        const s = settingRes;
        currentTheme.value = s.app_theme;
        preferences.value = {
            currency: s.currency || 'TWD',
            budget_cycle: s.budget_cycle,
            budget_alert_threshold: s.budget_alert_threshold,
            start_of_week: s.start_of_week
        };

        // 套用主題
        document.documentElement.setAttribute('data-theme', s.app_theme);
        
    } catch (error) {
        console.error('初始化失敗:', error);
        ElMessage.error('無法連線至伺服器');
    } finally {
        loading.close();
    }
};

// 2. 切換主題函式
const changeTheme = async (id) => {
    if (themes.value[id].locked) {
        ElMessage.warning(`尚未解鎖！需要 Lv.${themes.value[id].requiredLevel}`);
        return;
    }

    // 樂觀更新：先變色
    const oldTheme = currentTheme.value;
    currentTheme.value = id;
    document.documentElement.setAttribute('data-theme', id);

    try {
        await settingApi.updateTheme(userId, id);
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: id }));
        triggerMissionAction('change_theme');
    } catch (error) {
        // 失敗則回滾
        currentTheme.value = oldTheme;
        document.documentElement.setAttribute('data-theme', oldTheme);
        ElMessage.error('主題同步失敗');
    }
};


// 儲存設定
const savePreferences = async () => {
    try {
        // ✅ 修正：使用封裝好的 settingApi，避免手寫 URL 噴 404
        // ✅ 修正：傳送結構對齊後端 SettingBase
        await settingApi.updateAllSetting(userId, {
            app_theme: currentTheme.value,
            currency: preferences.value.currency,
            budget_cycle: preferences.value.budget_cycle,
            budget_alert_threshold: Number(preferences.value.budget_alert_threshold),
            start_of_week: Number(preferences.value.start_of_week),
            // 如果後端 Schema 要求完整欄位，補上預設值
            avatar_url: null,
            birthday: null,
            about: ""
        });
        
        ElMessage.success('設定已同步至雲端');
    } catch (error) {
        // 攔截器會自動彈出 ElMessage.error，這裡通常不用重複寫
        console.error('儲存失敗:', error);
    }
};

onMounted(() => {
    fetchUserData();
});
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
                        :class="{ 'is-selected': currentTheme === id}"
                        @click="changeTheme(id)">
                        <div class="theme-preview" :style="{ background: style.bgGradient }">
                            <div class="preview-sidebar" :style="{ background: style.sidebarBg }"></div>
                            <div class="preview-accent" :style="{ background: style.primary }"></div>
                            <div v-if="style.locked" class="lock-overlay">
                                <span class="lock-icon">🔒</span>
                                <span class="lock-text">Lv.{{ style.requiredLevel }} 解鎖</span>
                            </div>
                        </div>
                        <span class="theme_name_color">{{ style.name }}</span>
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
                <select v-model="preferences.budget_cycle" class="select-input">
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
                <select v-model="preferences.budget_alert_threshold" class="select-input">
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
                <select v-model="preferences.start_of_week" class="select-input">
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
    gap: 10px;
    /* 項目之間的間距 */
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

.theme-item:hover,
.theme-item.is-selected {
    opacity: 1;
    transform: translateY(-2px);
}

.theme-item.is-selected span {
    font-weight: 700;
    color: var(--color-primary);
}

.theme-preview {
    width: 100%;
    aspect-ratio: 16 / 10;
    /* 保持固定寬高比 */
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    border: 2px solid transparent;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
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
    border-right: 1px solid rgba(0, 0, 0, 0.05);
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
    cursor: not-allowed;
    /* 顯示禁止點擊的手勢 */
    opacity: 0.8;
}

/* 鎖定時的預覽圖模糊效果 */
.theme-item.is-locked .theme-preview {
    filter: grayscale(0.8) blur(2px);
    /* 變灰且模糊 */
    border: 1px dashed rgba(0, 0, 0, 0.1);
}

/* 鎖定遮罩層 */
.lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    /* 半透明黑底 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(4px);
    /* 加強模糊感 */
    transition: background 0.3s;
}

/* 鎖定圖示與文字 */
.lock-icon {
    font-size: 24px;
    margin-bottom: 4px;
    filter: none;
    /* 圖示本身不要模糊 */
}

.lock-text {
    font-size: 12px;
    color: #ffd700;
    /* 使用金色文字，對應成就獎勵的感覺 */
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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