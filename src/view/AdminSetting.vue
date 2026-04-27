<script setup>
//AdminSetting.vue
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAiCorrectionStatus, toggleAiCorrectionModel } from '@/api/speech'

const props = defineProps({
    themes: Object,
    currentTheme: String
})
const emit = defineEmits(['set-theme'])

// 預設就是乾淨的 OFF，不去煩後端
const isAiCorrectionEnabled = ref(false)
const isSwitching = ref(false)


const toggleAiCorrection = async () => {
    isSwitching.value = true
    const targetStatus = !isAiCorrectionEnabled.value
    
    try {
        const res = await toggleAiCorrectionModel(targetStatus)
        const finalStatus = res?.data?.is_enabled ?? res?.is_enabled ?? targetStatus
        isAiCorrectionEnabled.value = finalStatus
        
        ElMessage.success(targetStatus ? '🔥 模型已載入顯卡，準備就緒！' : '🧹 模型已卸載，記憶體已釋放！')
    } catch (err) {
        ElMessage.error('切換 AI 引擎失敗，請檢查後端連線喵...')
        console.error(err)
    } finally {
        isSwitching.value = false
    }
}

onMounted(async () => {
    try {
        const res = await getAiCorrectionStatus()
        // 雙重保險抓取法
        isAiCorrectionEnabled.value = res?.data?.is_enabled ?? res?.is_enabled ?? false
    } catch (err) {
        console.log("AI 狀態同步失敗，維持預設 OFF")
    }
})

</script>

<template>
    <div class="content-glass-card">
        <h3>🎨 介面主題設置</h3>
        <div class="theme-grid">
            <button v-for="(theme, id) in themes" :key="id" class="theme-card" :class="{ active: currentTheme === id }"
                :style="{ background: theme.cardBg || 'rgba(255,255,255,0.1)' }" @click="emit('set-theme', id)">
                <div class="theme-preview" :style="{ background: theme.bgGradient }"></div>
                <span :style="{ color: theme.color || 'inherit' }">
                    {{ theme.name }}
                </span>
            </button>
        </div>

        <hr class="section-divider">

        <h3>🧠 AI 語音處理引擎 (本地端專用)</h3>
        <div class="setting-row ai-engine-card">
            <div class="ai-info">
                <strong>啟用 Qwen 深度糾錯</strong>
                <p class="ai-desc">開啟後，將使用本地 RTX 4060 Ti 顯卡修正台灣口音錯字 (耗時約 3~5 秒載入)。</p>
            </div>

            <button class="toggle-btn" :class="{ active: isAiCorrectionEnabled }" @click="toggleAiCorrection"
                :disabled="isSwitching">
                <span class="status-dot"></span>
                {{ isSwitching ? '切換中...' : (isAiCorrectionEnabled ? '已啟用 (ON)' : '已停用 (OFF)') }}
            </button>
        </div>



    </div>
</template>

<style scoped>
.content-glass-card {
    padding: 32px;
    /* 稍微加大一點 padding 讓呼吸感更好 */
    background: var(--cardBg);
    border-radius: 20px;
    border: 1px solid var(--border);
    backdrop-filter: blur(10px);
}

h3 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.2rem;
    font-weight: 600;
}

.theme-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 20px;
}

/* ... (你原本的 theme-card 等樣式保留) ... */
.theme-card {
    position: relative;
    border: 2px solid transparent;
    padding: 12px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
}

.theme-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    filter: brightness(1.1);
}

.theme-card.active {
    border-color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    background: rgba(59, 130, 246, 0.1) !important;
}

.theme-card.active::after {
    content: '✓';
    position: absolute;
    top: -8px;
    right: -8px;
    background: #3b82f6;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--bg-card);
}

.theme-preview {
    width: 100%;
    height: 70px;
    border-radius: 10px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.1);
}

.theme-card span {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* 🌟 新增的 AI 區塊專屬樣式 */
.section-divider {
    margin: 40px 0 30px 0;
    border: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(150, 150, 150, 0.3), transparent);
}

.ai-engine-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: rgba(0, 0, 0, 0.03);
    /* 輕微的底色區分 */
    border-radius: 16px;
    border: 1px solid rgba(200, 200, 200, 0.2);
    transition: all 0.3s ease;
}

.ai-engine-card:hover {
    background: rgba(0, 0, 0, 0.05);
}

.ai-info strong {
    font-size: 1.1rem;
    color: var(--text-main);
    display: block;
    margin-bottom: 6px;
}

.ai-desc {
    font-size: 0.85rem;
    color: #888;
    margin: 0;
    line-height: 1.4;
}

/* 質感的切換按鈕 */
.toggle-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    border-radius: 30px;
    border: 1px solid #ccc;
    background: #f0f0f0;
    color: #666;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 140px;
    justify-content: center;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ccc;
    transition: all 0.3s ease;
}

/* 啟動狀態的按鈕 */
.toggle-btn.active {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
    color: #3b82f6;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
}

.toggle-btn.active .status-dot {
    background: #10b981;
    /* 亮綠色代表啟動 */
    box-shadow: 0 0 8px #10b981;
}
</style>