<script setup>
import { ref, onMounted, computed } from 'vue'
import { getAiRobotConfig, saveAiRobotConfig } from '../api/robot';
import { useAiAdminStore } from '../stores/useAiAdminStore';

const aiStore = useAiAdminStore();
const selectedAiModel = ref('ollama')
const isEditMode = ref(false)
const isSaving = ref(false)

// 🎯 Gemini 模型清單
const geminiModels = [
    { label: 'Gemini 2.5 Flash (目前主力/穩定)', value: 'gemini-2.5-flash' },
    { label: 'Gemini 3 Flash (最新高速版)', value: 'gemini-3-flash' },
    { label: 'Gemini 2.5 Pro (進階邏輯/需確認配額)', value: 'gemini-2.5-pro' },
    { label: 'Gemini 2.5 Flash Lite (輕量極速)', value: 'gemini-2.5-flash-lite' }
]

// 🎯 定義各模型的限制資訊
const modelLimitsInfo = {
    'gemini-2.5-flash': { rpm: '5 RPM', rpd: '20 RPD', desc: '✅ 基礎版，適合一般對話與測試。' },
    'gemini-3-flash': { rpm: '5 RPM', rpd: '20 RPD', desc: '⚡ 新一代極速模型，效能更好。' },
    'gemini-2.5-pro': { rpm: '依官方', rpd: '依官方', desc: '⚠️ 你的帳號目前此模型無配額 (顯示 0/0)，可能需綁定信用卡。' },
    'gemini-2.5-flash-lite': { rpm: '依官方', rpd: '依官方', desc: '🚀 輕量版，你的帳號目前此模型無配額。' },
    'default': { rpm: '-', rpd: '-', desc: '請選擇一個模型以查看限制資訊' }
}

const currentGeminiLimit = computed(() => {
    const ver = localSettings.value.geminiVersion;
    if (!ver) return modelLimitsInfo['default'];
    return modelLimitsInfo[ver] || modelLimitsInfo['default'];
});

const ollamaModels = [
    { label: 'Gemma 3 1B IT (Mac 舊款首選)', value: 'gemma3:1b', locked: false },
    { label: 'Llama 3.2 3B (Win11 推薦)', value: 'llama3.2', locked: true },
    { label: 'DeepSeek R1 (Win10 推薦)', value: 'deepseek-r1:7b', locked: true }
]

const DEFAULT_PROMPT = '你是理財助手喵喵。個性惜字如金，言簡意賅，善用成語。嚴禁冗詞贅字、表格與公式。回答限制 30 字內，直指核心，句尾務必帶喵~';
const BACKEND_DEFAULT_PROMPT = "你是一個親切的理財助手喵喵，說話結尾要帶喵~";

const localSettings = ref({
    geminiKey: '',
    anythingKey: '',
    geminiVersion: '',
    ollamaModel: '',
    system_prompt: DEFAULT_PROMPT
})

// 🚀 強制同步函數
const switchAndSync = async (provider) => {
    selectedAiModel.value = provider;
    isEditMode.value = false;
    
    // 確保 Store 資料最新
    await aiStore.fetchConfig(provider); 
    const cached = aiStore.configs[provider];

    // 1. 同步 Prompt
    if (!cached.prompt || cached.prompt === BACKEND_DEFAULT_PROMPT || cached.prompt.includes("你是理財小助手喵喵")) {
        localSettings.value.system_prompt = DEFAULT_PROMPT;
    } else {
        localSettings.value.system_prompt = cached.prompt;
    }

    // 2. 同步模型版本
    if (provider === 'gemini') {
        const dbValue = cached.version;
        const isValid = geminiModels.some(m => m.value === dbValue);
        localSettings.value.geminiVersion = isValid ? dbValue : '';
    }

    if (provider === 'ollama') {
        let dbValue = cached.version;
        if (dbValue === 'gemma-3-1b-it') dbValue = 'gemma3:1b';
        const isValid = ollamaModels.some(m => m.value === dbValue);
        localSettings.value.ollamaModel = isValid ? dbValue : '';
    }
}

onMounted(async () => {
    // 初始載入時，直接從 Store 拿取當前生效的 Provider
    const res = await getAiRobotConfig();
    const d = res?.data || res;
    const targetProvider = d?.provider || 'ollama';
    
    // 更新 Store 狀態，確保頂部狀態欄正確
    aiStore.currentActiveProvider = targetProvider; 
    await switchAndSync(targetProvider);
})

const handleSave = async () => {
    isSaving.value = true;
    try {
        const provider = selectedAiModel.value;

        // 防呆
        if (provider === 'gemini' && !localSettings.value.geminiVersion) {
            alert("請選擇一個 Gemini 運作模型版本喵！");
            isSaving.value = false;
            return;
        }
        if (provider === 'ollama' && !localSettings.value.ollamaModel) {
            alert("請選擇一個 Ollama 運作模型版本喵！");
            isSaving.value = false;
            return;
        }

        const payload = {
            provider: provider,
            system_prompt: localSettings.value.system_prompt,
            base_url: provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:3001',
            model_version: provider === 'ollama' ? localSettings.value.ollamaModel :
                provider === 'anythingllm' ? 'gemma3:1b' : localSettings.value.geminiVersion,
        };

        // 處理 API Key 邏輯
        const inputKey = provider === 'gemini' ? localSettings.value.geminiKey :
            provider === 'anythingllm' ? localSettings.value.anythingKey : null;

        if (inputKey && inputKey.trim() !== '') {
            payload.api_key = inputKey.trim();
        } else if (isEditMode.value) {
            alert("請輸入有效的 Key 喵！");
            isSaving.value = false;
            return;
        }

        const response = await saveAiRobotConfig(payload);
        
        // ✨ 重點修正：儲存成功後的操作
        if (response.success || response.data?.success || response.status === 200) {
            // 1. 更新 Store 內的當前生效 Provider (讓頂部狀態欄立即改變)
            aiStore.currentActiveProvider = provider;
            
            // 2. 重新拉取該 Provider 的最新配置 (同步 hasKey 等狀態)
            await aiStore.fetchConfig(provider);

            // 3. 清空輸入欄位並關閉編輯模式
            localSettings.value.geminiKey = '';
            localSettings.value.anythingKey = '';
            isEditMode.value = false;

            alert("💾 設定已更新！目前生效模型已切換為 " + provider.toUpperCase() + " 喵~");
        }
    } catch (error) {
        console.error("❌ 儲存錯誤:", error);
        alert("❌ 儲存失敗！請檢查網路或後端記錄。");
    } finally {
        isSaving.value = false;
    }
}
</script>

<template>
    <div class="model-management-container">
        <div class="glass-header">
            <div class="title-group">
                <h3>🐈 AI 模型控制中心</h3>
                <span class="sub-title">配置喵喵的回話風格與串接金鑰</span>
            </div>
            <div class="active-status" :class="aiStore.currentActiveProvider">
                ● 目前生效：<strong>{{ aiStore.currentActiveProvider ? aiStore.currentActiveProvider.toUpperCase() : '尚未設定' }}</strong>
            </div>
        </div>

        <div class="layout-body">
            <div class="nav-sidebar">
                <div class="nav-item" :class="{ active: selectedAiModel === 'gemini' }" @click="switchAndSync('gemini')">✨ Gemini</div>
                <div class="nav-item" :class="{ active: selectedAiModel === 'ollama' }" @click="switchAndSync('ollama')">🦙 Ollama</div>
                <div class="nav-item" :class="{ active: selectedAiModel === 'anythingllm' }" @click="switchAndSync('anythingllm')">🦾 AnythingLLM</div>
            </div>

            <div class="config-pane">
                <div class="card personality">
                    <div class="card-title">🧠 喵喵性格指令 (System Prompt)</div>
                    <textarea v-model="localSettings.system_prompt" class="prompt-area" rows="4"></textarea>
                </div>

                <div class="card connection">
                    <div class="card-title">⚙️ {{ selectedAiModel.toUpperCase() }} 連線配置</div>

                    <div v-if="selectedAiModel === 'gemini'" class="form-group">
                        <label>GEMINI API KEY</label>
                        <div class="key-control">
                            <div v-if="aiStore.configs.gemini.hasKey && !isEditMode" class="key-locked-display">
                                🔒 系統已安全載入並加密儲存金鑰
                            </div>
                            <input v-else type="password" v-model="localSettings.geminiKey" class="form-input" placeholder="請貼上 API Key" />

                            <button v-if="aiStore.configs.gemini.hasKey" @click="isEditMode = !isEditMode" class="btn-edit">
                                {{ isEditMode ? '取消' : '修改' }}
                            </button>
                        </div>
                    </div>

                    <div v-if="selectedAiModel === 'anythingllm'" class="form-group">
                        <label>ANYTHINGLLM KEY</label>
                        <div class="key-control">
                            <div v-if="aiStore.configs.anythingllm.hasKey && !isEditMode" class="key-locked-display">
                                🔒 系統已安全載入並加密儲存金鑰
                            </div>
                            <input v-else type="password" v-model="localSettings.anythingKey" class="form-input" placeholder="請貼上 Key" />

                            <button v-if="aiStore.configs.anythingllm.hasKey" @click="isEditMode = !isEditMode" class="btn-edit">
                                {{ isEditMode ? '取消' : '修改' }}
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>運作模型版本</label>
                        <select v-if="selectedAiModel === 'gemini'" v-model="localSettings.geminiVersion" class="form-select">
                            <option value="" disabled hidden>請選擇模型</option>
                            <option v-for="m in geminiModels" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                        <select v-if="selectedAiModel === 'ollama'" v-model="localSettings.ollamaModel" class="form-select">
                            <option value="" disabled hidden>請選擇模型</option>
                            <option v-for="m in ollamaModels" :key="m.value" :value="m.value" :disabled="m.locked">{{ m.label }}</option>
                        </select>
                        <div v-if="selectedAiModel === 'anythingllm'" class="form-input readonly">預設使用 gemma3:1b</div>
                    </div>

                    <div v-if="selectedAiModel === 'gemini'" class="limit-info-box">
                        <div class="limit-row">
                            <span class="limit-label">RPM (每分請求):</span>
                            <span class="limit-val">{{ currentGeminiLimit.rpm }}</span>
                        </div>
                        <div class="limit-row">
                            <span class="limit-label">RPD (每日請求):</span>
                            <span class="limit-val">{{ currentGeminiLimit.rpd }}</span>
                        </div>
                        <div class="limit-desc">{{ currentGeminiLimit.desc }}</div>
                    </div>
                </div>

                <button @click="handleSave" class="btn-save-master" :disabled="isSaving">
                    {{ isSaving ? '⏳ 儲存中...' : '💾 儲存變更' }}
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.model-management-container {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;

    /* 解放寬度，解決左右太空的問題 */
    max-width: 1200px; 
    width: 100%;
    margin: 0 auto;
    color: var(--admin-text);
}
h3{
    color: var(--admin-text);
}

span{
    color: var(--admin-text);
}


.card.personality {
    background: var(--admin-card-bg); /* 建議用 card-bg 變數，而不是 gradient */
    color: var(--admin-text);
}
/* 2. 玻璃擬態標題 */
.glass-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--admin-border1);
    backdrop-filter: blur(10px);
    padding: 30px; /* 稍微增加內距 */
    border-radius: 20px;
    border: 1px solid var(--admin-border);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    margin-bottom: 35px;
}

.active-status {
    padding: 8px 18px;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: bold;
    background:var(--admin-border1);
    border: 1px solid #e2e8f0;
}

.layout-body {
    display: grid;
    /* 側邊欄固定，主面板自動撐開 */
    grid-template-columns: 220px 1fr;
    gap: 40px; /* 增加左右間距 */
}

.nav-sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.nav-item {
    padding: 18px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 18px;
    border: 1px solid var(--admin-border);
    cursor: pointer;
    transition: all 0.3s;
    font-weight: 700;
    text-align: center;
    margin-bottom: 15px;
}

.nav-item.active {
    background: var(--admin-primary);
    color: #fff;
    border-color: var(--admin-primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.nav-item.active[data-v-ae806f5c] {
    background: var(--admin-primary);
    color: var(--admin-text);
    border-color: var(--admin-primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* 7. 表單群組間距 */
.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 12px;
    font-weight: 700;
    font-size: 0.9rem;
    opacity: 0.9;
}


.config-pane {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.card {
    background: var(--admin-card-bg);
    border-radius: 24px;
    padding: 15px 30px !important; /* 上下改為 15px，左右維持 30px */
    border: 1px solid var(--admin-border);
    color: var(--admin-text);
    margin-bottom: 20px; /* 稍微縮小卡片之間的垂直距離 */
}

.personality-card {
    border-top: 6px solid #3b82f6;
}

/* 針對卡片標題也需要修正顏色，否則深色模式下會變黑 */
.card-title {
    color: var(--admin-text);
    font-size: 1.1rem;
    font-weight: 800;
    margin-bottom: 25px;
    display: flex;
    align-items: center;
    gap: 10px;
}


.prompt-area, 
.form-input, 
.form-select {
    width: 100% !important;
    /* 背景稍微深一點點，增加對比 */
    background: rgba(0, 0, 0, 0.03) !important; 
    color: var(--admin-text) !important;
    
    /* 增加邊框寬度，並確保使用變數 */
    border: 1.5px solid var(--admin-border) !important; 
    
    border-radius: 14px;
    padding: 18px;
    font-size: 1rem;
    line-height: 1.6;
    outline: none;
    transition: all 0.3s ease;
}

/* 🎯 這裡是你要求的：多加一個下拉符號 */
.form-select {
    appearance: none !important; /* 隱藏原生箭頭 */
    -webkit-appearance: none;
    cursor: pointer;
    /* 加入自定義箭頭圖標 */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
    background-repeat: no-repeat !important;
    background-position: right 15px center !important; 
    background-size: 18px !important;
    padding-right: 45px !important; /* 留位置給箭頭 */
}

/* 聚焦時讓邊框亮起來，這樣使用者才知道選中哪裡 */
.prompt-area:focus, 
.form-input:focus, 
.form-select:focus {
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-color: var(--admin-primary) !important;
    outline: none;
    box-shadow: 0 0 0 4px rgba(var(--admin-primary-rgb), 0.1);

}

.prompt-area {
    min-height: 120px;
    resize: vertical;
}

.form-select option {
    background-color: #ffffff; /* 選項彈出時用白底 */
    color: #1e293b;            /* 文字用深色 */
}

/* 5. API Key 控制區塊佈局修正 */
.key-control {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 10px;
}

.key-locked-display {
    flex: 1;
    padding: 15px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    color: var(--admin-text);
    opacity: 0.7;
    font-size: 0.9rem;
    border: 1px dashed var(--admin-border);
    display: flex;
    align-items: center;
}

.btn-edit {
    padding: 0 20px;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
}

.btn-save-master {
    width: 100%;
    padding: 18px;
    background: #0f71b3;
    color: white;
    border: none;
    border-radius: 15px;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
}

.form-input,
.form-select {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.9rem;
}

.readonly {
    background: #f8fafc;
    border-style: dashed;
    color: #94a3b8;
}

.limit-info-box {
    margin-top: 15px;
    background: #fff7ed;
    border: 1px solid #ffedd5;
    padding: 15px;
    border-radius: 12px;
    font-size: 0.9rem;
    color: #9a3412;
}

.limit-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    font-weight: 600;
}

.limit-desc {
    margin-top: 8px;
    font-size: 0.85rem;
    color: #c2410c;
}

.limit-note {
    margin-top: 5px;
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
}



</style>