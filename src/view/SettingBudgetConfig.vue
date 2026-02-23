<script setup>
import { ref, onMounted, computed } from 'vue'
import { triggerMissionAction, getCardCollection } from '@/api/gamification';
import { ElMessage, ElLoading } from 'element-plus'
import { settingApi } from '@/api/setting';
import api from '@/api';

// 響應式狀態
const currentUserId = ref(null);
const userLevel = ref(1);
const currentTheme = ref(localStorage.getItem('appTheme') || 'light');

// 偏好設定資料
const preferences = ref({
    currency: 'TWD',
    budget_cycle: 'monthly',
    budget_alert_threshold: 75,
    start_of_week: 0
});

/* ========================
    Theme System & Unlocks
   ======================== */
const levelUnlocks = {
    light: 1, nordic: 1, sunset: 1, forest: 1, lavender: 1, dark: 1,
    oasis: 5, cyber: 10
};

const cardUnlocks = ref({
    NT: false,
    SP: false,
    SJ: false
});

const themes = computed(() => {
    const baseThemes = { 
        light: { name: 'MMA 經典', bgGradient: '#f8fafc', sidebarBg: '#ffffff', primary: '#3b82f6' },
        nordic: { name: '北歐極簡', bgGradient: '#eceff4', sidebarBg: '#d8dee9', primary: '#5e81ac' },
        sunset: { name: '微醺夕陽', bgGradient: '#fffbeb', sidebarBg: '#ffffff', primary: '#f59e0b' },
        forest: { name: '森林晨曦', bgGradient: '#f0fdf4', sidebarBg: '#ffffff', primary: '#10b981' },
        lavender: { name: '薰衣草園', bgGradient: '#f3f0ff', sidebarBg: '#ffffff', primary: '#b39cd0' },
        dark: { name: '極客深邃', bgGradient: '#0f172a', sidebarBg: '#1e293b', primary: '#60a5fa' },
        oasis: { name: '沙漠綠洲', bgGradient: '#f7f3f0', sidebarBg: '#caebdf', primary: '#c2a383' },
        cyber: { name: '午夜霓虹', bgGradient: '#0a0a12', sidebarBg: '#161625', primary: '#ff00ff' },
        nt_gold: { name: '科技流金 (NT獎勵)', bgGradient: 'linear-gradient(135deg, #110800 0%, #2a1600 100%)', sidebarBg: 'rgba(26, 15, 0, 0.95)', primary: '#f59e0b', text: '#fef3c7', isReward: true, group: 'NT' },
        sp_ocean: { name: '深海波光 (SP獎勵)', bgGradient: 'radial-gradient(circle at 50% 0%, #0369a1, #082f49)', sidebarBg: '#0c4a6e', primary: '#38bdf8', text: '#e0f2fe', isReward: true, group: 'SP' },
        sj_wood: { name: '木質散步 (SJ獎勵)', bgGradient: '#f5ebe0', sidebarBg: '#faf4f0', primary: '#9c6644', text: '#5c4033', isReward: true, group: 'SJ' }
    };

    Object.keys(baseThemes).forEach(id => {
        const theme = baseThemes[id];
        if (theme.isReward) {
            theme.locked = !cardUnlocks.value[theme.group];
            theme.lockReason = '需解鎖對應稀有卡牌';
        } else {
            const requiredLevel = levelUnlocks[id] || 1;
            theme.locked = userLevel.value < requiredLevel;
            theme.requiredLevel = requiredLevel;
        }
    });
    return baseThemes;
});

/* ========================
    Data Fetching
   ======================== */
const fetchUserData = async () => {
    const loading = ElLoading.service({ target: '.tab-content', text: '數據同步中...' });
    
    try {
        // 1. 獲取當前用戶資訊
        const userRes = await api.get('/users/me');
        // 🌟 雖然不傳給後端，但我們把 ID 存起來供本地判斷
        currentUserId.value = userRes.user_id;
        userLevel.value = userRes.level || 1;

        // 2. 併發抓取設定與卡牌
        const [settingRes, cardRes] = await Promise.allSettled([
            settingApi.getSetting(), // ✅ 移除參數
            getCardCollection()
        ]);

        // 3. 處理設定結果
        if (settingRes.status === 'fulfilled' && settingRes.value) {
            const s = settingRes.value;
            currentTheme.value = s.app_theme || currentTheme.value;
            preferences.value = {
                currency: s.currency || 'TWD',
                budget_cycle: s.budget_cycle || 'monthly',
                budget_alert_threshold: s.budget_alert_threshold || 75,
                start_of_week: s.start_of_week || 0
            };
            document.documentElement.setAttribute('data-theme', currentTheme.value);
        }

        // 4. 處理卡牌解鎖狀態
        if (cardRes.status === 'fulfilled') {
            const data = Array.isArray(cardRes.value) ? cardRes.value : (cardRes.value?.data || []);
            cardUnlocks.value.NT = data.some(c => c.category === 'NT' && c.difficulty === 'RARE' && (c.is_owned || c.is_unlocked));
            cardUnlocks.value.SP = data.some(c => c.category === 'SP' && c.difficulty === 'RARE' && (c.is_owned || c.is_unlocked));
            cardUnlocks.value.SJ = data.some(c => c.category === 'SJ' && c.difficulty === 'RARE' && (c.is_owned || c.is_unlocked));
        }

    } catch (error) {
        console.error('初始化失敗:', error);
        ElMessage.error('無法取得雲端設定，請檢查網路連線');
    } finally {
        loading.close();
    }
};

/* ========================
    Actions
   ======================== */
const changeTheme = async (id) => {
    const theme = themes.value[id];
    if (theme.locked) {
        const msg = theme.isReward ? theme.lockReason : `尚未解鎖！需要 Lv.${theme.requiredLevel}`;
        ElMessage.warning(msg);
        return;
    }

    // 本地立即生效
    currentTheme.value = id;
    document.documentElement.setAttribute('data-theme', id);
    localStorage.setItem('appTheme', id);
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: id }));

    // 同步後端 (422 錯誤修正點)
    if (!currentUserId.value) return;

    try {
        await settingApi.updateTheme(id); // ✅ 移除參數，只傳主題 ID
        triggerMissionAction('change_theme');
    } catch (e) {
        console.warn('雲端同步失敗:', e.message);
    }
};

const savePreferences = async () => {
    if (!currentUserId.value) return ElMessage.error('尚未取得使用者資訊');
    
    const loading = ElLoading.service({ text: '儲存中...' });
    try {
        await settingApi.updateAllSetting({
            ...preferences.value,
            app_theme: currentTheme.value
        });
        ElMessage.success('設定儲存成功');
    } catch (error) {
        ElMessage.error('儲存失敗');
    } finally {
        loading.close();
    }
};

onMounted(() => {
    fetchUserData();
});
</script>

<template>
    <div class="tab-content" style="min-height: 400px;">
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
                        :class="{ 'is-selected': currentTheme === id, 'is-locked': style.locked }"
                        @click="changeTheme(id)">
                        <div class="theme-preview" :style="{ background: style.bgGradient }">
                            <div class="preview-sidebar" :style="{ background: style.sidebarBg }"></div>
                            <div class="preview-accent" :style="{ background: style.primary }"></div>
                            <div v-if="style.locked" class="lock-overlay">
                                <span class="lock-icon">🔒</span>
                                <span v-if="!style.isReward" class="lock-text">Lv.{{ style.requiredLevel }}</span>
                                <span v-else class="lock-text" style="color: #fbbf24; font-size: 9px;">卡牌成就</span>
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
            <button class="btn-secondary" @click="fetchUserData">重新整理</button>
            <button class="btn-primary" @click="savePreferences">儲存設定</button>
        </div>
    </div>
</template>

<style scoped>
/* Style 部分保持原樣，與上一版一致 */
@import '../assets/css/setting.css';
.theme-picker { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; width: 100%; }
.theme-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; }
.theme-item:hover { transform: translateY(-3px); }
.theme-preview { width: 100%; aspect-ratio: 16 / 10; border-radius: 10px; position: relative; overflow: hidden; border: 2px solid #e2e8f0; transition: all 0.3s; }
.theme-item.is-selected .theme-preview { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); }
.preview-sidebar { width: 25%; height: 100%; position: absolute; left: 0; }
.preview-accent { width: 10px; height: 10px; border-radius: 50%; position: absolute; bottom: 6px; right: 6px; }
.is-locked { opacity: 0.7; }
.lock-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(2px); }
.lock-icon { font-size: 18px; }
.lock-text { font-size: 10px; color: #fbbf24; font-weight: bold; }
.theme_name_color { font-size: 12px; color: var(--text-primary); text-align: center; }
@media (max-width: 1024px) { .theme-picker { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 600px) { .theme-picker { grid-template-columns: repeat(2, 1fr); } }
</style>