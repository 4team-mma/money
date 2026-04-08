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
    { label: 'Gemini 3 Flash (最新/效能最強)', value: 'gemini-3-flash-preview' },
    { label: 'Gemini 3.1 Flash-Lite (極速/最省額度)', value: 'gemini-3.1-flash-lite-preview' },
    { label: 'Gemini 2.5 Flash (性能與速度平衡)', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.5 Pro (穩定/處理複雜長文)', value: 'gemini-2.5-pro' }
]

const modelLimitsInfo = {
    'gemini-3-flash-preview': { rpm: '15 RPM', rpd: '200 RPD', desc: '✨ 最新 3 系列，具備 Pro 等級推理能力且速度極快，效能最強且免費額度穩定！' },
    'gemini-3.1-flash-lite-preview': { rpm: '15 RPM', rpd: '1,000 RPD', desc: '🚀 針對極高吞吐量優化，最省額度、回應最快。' },
    'gemini-2.5-flash': { rpm: '10 RPM', rpd: '250 RPD', desc: '✅ 性能與速度平衡的成熟版本。' },
    'gemini-2.5-pro': { rpm: '5 RPM', rpd: '100 RPD', desc: '🧠 雖然是舊版，但在處理複雜邏輯與長文本時依然非常穩定。' },
    'default': { rpm: '-', rpd: '-', desc: '請選擇一個模型以查看限制資訊' }
}

// 🎯 Groq 模型清單
const groqModels = [
    { label: 'Llama 3.3 70B (🏆 穩定主力/假資料神機)', value: 'llama-3.3-70b-versatile' },
    { label: 'DeepSeek R1 70B (🤔 邏輯推理/思考模型)', value: 'deepseek-r1-distill-llama-70b' },
    { label: 'Llama 3.1 8B (🚀 極速生成/輕量首選)', value: 'llama-3.1-8b-instant' },
    { label: 'Mixtral 8x7B (📚 處理長文/邏輯穩定)', value: 'mixtral-8x7b-32768' }
]

const groqLimitsInfo = {
    'llama-3.3-70b-versatile': { rpm: '30 RPM', rpd: '1,000 RPD', desc: '🚀 速度極快且聰明，是目前 Groq 上的最強模型，Text-to-SQL 首選！' },
    'deepseek-r1-distill-llama-70b': { rpm: '30 RPM', rpd: '-', desc: '🧠 強大推理能力，適合處理「顧問意圖 (ADVISOR)」任務。' },
    'default': { rpm: '30 RPM', rpd: '-', desc: 'Groq 提供極速的開源模型推論服務，適合雲端環境。' }
}

// 🎯 計算當前模型的限制資訊
const currentLimit = computed(() => {
    if (selectedAiModel.value === 'gemini') {
        const ver = localSettings.value.geminiVersion;
        return modelLimitsInfo[ver] || modelLimitsInfo['default'];
    } else if (selectedAiModel.value === 'groq') {
        const ver = localSettings.value.groqVersion;
        return groqLimitsInfo[ver] || groqLimitsInfo['default'];
    }
    return null;
});

const ollamaModels = [
    { label: 'Gemma 4 E4B ( 💡最新/本地最強大腦)', value: 'gemma4:e4b', locked: false },
    { label: 'Llama 3.2 3B (🏆 JSON 穩定首選)', value: 'llama3.2', locked: false },
    { label: 'Gemma 3 4B (🚀 速度與精準平衡)', value: 'gemma3:4b', locked: false },
    { label: 'DeepSeek R1 8B (🤔 邏輯推理/稍微慢)', value: 'deepseek-r1:8b', locked: false },
    { label: 'Gemma 3 1B (極速但較笨)', value: 'gemma3:1b', locked: false }
]

const DEFAULT_PROMPT = '你是理財助手喵喵。個性惜字如金，言簡意賅，善用成語。嚴禁冗詞贅字、表格與公式。回答限制 30 字內，直指核心，句尾務必帶喵~';
const BACKEND_DEFAULT_PROMPT = "你是一個親切的理財助手喵喵，說話結尾要帶喵~";

const localSettings = ref({
    geminiKey: '',
    groqKey: '',      // 🌟 新增
    anythingKey: '',
    geminiVersion: '',
    groqVersion: '',    // 🌟 新增
    ollamaModel: '',
    system_prompt: DEFAULT_PROMPT,
    brain_version: 'v1' // 🌟 新增這行
})

// 🚀 強制同步函數
const switchAndSync = async (provider) => {
    selectedAiModel.value = provider;
    isEditMode.value = false;

    await aiStore.fetchConfig(provider);
    const cached = aiStore.configs[provider] || { prompt: '', version: '' };


    // 🌟 同步大腦版本
    localSettings.value.brain_version = cached.brain_version || 'v1';

    // 1. 同步 Prompt
    if (!cached.prompt || cached.prompt === BACKEND_DEFAULT_PROMPT || cached.prompt.includes("你是理財小助手喵喵")) {
        localSettings.value.system_prompt = DEFAULT_PROMPT;
    } else {
        localSettings.value.system_prompt = cached.prompt;
    }

    // 2. 同步模型版本
    if (provider === 'gemini') {
        const dbValue = cached.version;
        localSettings.value.geminiVersion = geminiModels.some(m => m.value === dbValue) ? dbValue : '';
    } else if (provider === 'groq') {
        const dbValue = cached.version;
        localSettings.value.groqVersion = groqModels.some(m => m.value === dbValue) ? dbValue : '';
    } else if (provider === 'ollama') {
        let dbValue = cached.version;
        if (dbValue === 'gemma-3-1b-it') dbValue = 'gemma3:1b';
        localSettings.value.ollamaModel = ollamaModels.some(m => m.value === dbValue) ? dbValue : '';
    }
}

onMounted(async () => {
    const res = await getAiRobotConfig();
    const d = res?.data || res;
    const targetProvider = d?.provider || 'ollama';
    aiStore.currentActiveProvider = targetProvider;
    await switchAndSync(targetProvider);
})

const handleSave = async () => {
    isSaving.value = true;
    try {
        const provider = selectedAiModel.value;

        // 防呆
        if (provider === 'gemini' && !localSettings.value.geminiVersion) { alert("請選擇 Gemini 版本喵！"); isSaving.value = false; return; }
        if (provider === 'groq' && !localSettings.value.groqVersion) { alert("請選擇 Groq 版本喵！"); isSaving.value = false; return; }
        if (provider === 'ollama' && !localSettings.value.ollamaModel) { alert("請選擇 Ollama 版本喵！"); isSaving.value = false; return; }

        const payload = {
            provider: provider,
            system_prompt: localSettings.value.system_prompt,
            brain_version: localSettings.value.brain_version,
            base_url: provider === 'ollama' ? 'http://localhost:11434' :
                provider === 'anythingllm' ? 'http://localhost:3001' : '',
            model_version: provider === 'ollama' ? localSettings.value.ollamaModel :
                provider === 'groq' ? localSettings.value.groqVersion :
                    provider === 'anythingllm' ? 'gemma3:1b' : localSettings.value.geminiVersion,
        };

        // 處理 API Key
        const inputKey = provider === 'gemini' ? localSettings.value.geminiKey :
            provider === 'groq' ? localSettings.value.groqKey :
                provider === 'anythingllm' ? localSettings.value.anythingKey : null;

        if (inputKey && inputKey.trim() !== '') {
            payload.api_key = inputKey.trim();
        } else if (isEditMode.value) {
            alert("請輸入有效的 Key 喵！"); isSaving.value = false; return;
        }

        const response = await saveAiRobotConfig(payload);
        if (response.success || response.data?.success || response.status === 200) {
            aiStore.currentActiveProvider = provider;
            await aiStore.fetchConfig(provider);
            localSettings.value.geminiKey = '';
            localSettings.value.groqKey = ''; // 🌟 清空
            localSettings.value.anythingKey = '';
            isEditMode.value = false;
            alert("💾 設定已更新！目前生效模型為 " + provider.toUpperCase() + " 喵~");
        }
    } catch (error) {
        alert("❌ 儲存失敗！請檢查後端記錄。");
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
                ● 目前生效：<strong>{{ aiStore.currentActiveProvider?.toUpperCase() || '尚未設定' }}</strong>
            </div>
        </div>

        <div class="layout-body">
            <div class="nav-sidebar">
                <div class="nav-item" :class="{ active: selectedAiModel === 'gemini' }"
                    @click="switchAndSync('gemini')">✨ Gemini</div>
                <div class="nav-item" :class="{ active: selectedAiModel === 'groq' }" @click="switchAndSync('groq')">⚡
                    Groq (極速)</div>
                <div class="nav-item" :class="{ active: selectedAiModel === 'ollama' }"
                    @click="switchAndSync('ollama')">🦙 Ollama</div>
                <div class="nav-item" :class="{ active: selectedAiModel === 'anythingllm' }"
                    @click="switchAndSync('anythingllm')">🦾 AnythingLLM</div>
            </div>

            <div class="config-pane">
                <div class="card personality">
                    <div class="card-title">🧠 喵喵性格指令 (System Prompt)</div>
                    <textarea v-model="localSettings.system_prompt" class="prompt-area" rows="4"></textarea>
                </div>

                <div class="card connection">
                    <div class="card-title">⚙️ {{ selectedAiModel.toUpperCase() }} 連線配置</div>

                    <div class="brain-selector-group">
                        <label class="section-label">🧠 運作大腦版本 (意圖偵測邏輯)</label>
                        <div class="brain-toggle-container">
    <div class="brain-option" 
         :class="{ active: localSettings.brain_version === 'v1' }"
         @click="localSettings.brain_version = 'v1'; console.log('切換到 V1')" 
    >
        <span class="version-tag">V1</span>
        <div class="option-info">
            <div class="option-name">傳統關鍵字大腦</div>
            <div class="option-desc">最穩定，依照固定關鍵字攔截意圖。</div>
        </div>
        <div v-if="localSettings.brain_version === 'v1'" class="check-mark">✔</div>
    </div>

    <div class="brain-option" 
         :class="{ active: localSettings.brain_version === 'v2' }"
         @click="localSettings.brain_version = 'v2'; console.log('切換到 V2')"
    >
        <span class="version-tag v2">V2</span>
        <div class="option-info">
            <div class="option-name">MixAI 混合動力大腦</div>
            <div class="option-desc">透過 ONNX 模型 + 向量庫，判斷更擬人。</div>
        </div>
        <div v-if="localSettings.brain_version === 'v2'" class="check-mark">✔</div>
    </div>
</div>
                    </div>
                    <hr class="divider" />


                    <div v-if="selectedAiModel === 'gemini'" class="form-group">
                        <label>GEMINI API KEY</label>
                        <div class="key-control">
                            <div v-if="aiStore.configs.gemini?.hasKey && !isEditMode" class="key-locked-display">🔒
                                系統已安全載入金鑰</div>
                            <input v-else type="password" v-model="localSettings.geminiKey" class="form-input"
                                placeholder="請貼上 Gemini API Key" />
                            <button v-if="aiStore.configs.gemini?.hasKey" @click="isEditMode = !isEditMode"
                                class="btn-edit">{{ isEditMode ? '取消' : '修改' }}</button>
                        </div>
                    </div>

                    <div v-if="selectedAiModel === 'groq'" class="form-group">
                        <label>GROQ API KEY</label>
                        <div class="key-control">
                            <div v-if="aiStore.configs.groq?.hasKey && !isEditMode" class="key-locked-display">🔒
                                系統已安全載入金鑰</div>
                            <input v-else type="password" v-model="localSettings.groqKey" class="form-input"
                                placeholder="請貼上 Groq API Key" />
                            <button v-if="aiStore.configs.groq?.hasKey" @click="isEditMode = !isEditMode"
                                class="btn-edit">{{ isEditMode ? '取消' : '修改' }}</button>
                        </div>
                    </div>

                    <div v-if="selectedAiModel === 'anythingllm'" class="form-group">
                        <label>ANYTHINGLLM KEY</label>
                        <div class="key-control">
                            <div v-if="aiStore.configs.anythingllm?.hasKey && !isEditMode" class="key-locked-display">🔒
                                系統已安全載入金鑰</div>
                            <input v-else type="password" v-model="localSettings.anythingKey" class="form-input"
                                placeholder="請貼上 Key" />
                            <button v-if="aiStore.configs.anythingllm?.hasKey" @click="isEditMode = !isEditMode"
                                class="btn-edit">{{ isEditMode ? '取消' : '修改' }}</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>運作模型版本</label>
                        <select v-if="selectedAiModel === 'gemini'" v-model="localSettings.geminiVersion"
                            class="form-select">
                            <option value="" disabled hidden>請選擇模型</option>
                            <option v-for="m in geminiModels" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                        <select v-if="selectedAiModel === 'groq'" v-model="localSettings.groqVersion"
                            class="form-select">
                            <option value="" disabled hidden>請選擇模型</option>
                            <option v-for="m in groqModels" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                        <select v-if="selectedAiModel === 'ollama'" v-model="localSettings.ollamaModel"
                            class="form-select">
                            <option value="" disabled hidden>請選擇模型</option>
                            <option v-for="m in ollamaModels" :key="m.value" :value="m.value" :disabled="m.locked">{{
                                m.label }}</option>
                        </select>
                        <div v-if="selectedAiModel === 'anythingllm'" class="form-input readonly">預設使用 gemma3:1b</div>
                    </div>

                    <div v-if="currentLimit" class="limit-info-box">
                        <div class="limit-row">
                            <span class="limit-label">RPM:</span>
                            <span class="limit-val">{{ currentLimit.rpm }}</span>
                        </div>
                        <div v-if="currentLimit.rpd !== '-'" class="limit-row">
                            <span class="limit-label">RPD:</span>
                            <span class="limit-val">{{ currentLimit.rpd }}</span>
                        </div>
                        <div class="limit-desc">{{ currentLimit.desc }}</div>
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

h3 {
    color: var(--admin-text);
}

span {
    color: var(--admin-text);
}


.card.personality {
    background: var(--admin-card-bg);
    /* 建議用 card-bg 變數，而不是 gradient */
    color: var(--admin-text);
}

/* 2. 玻璃擬態標題 */
.glass-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--admin-border1);
    backdrop-filter: blur(10px);
    padding: 30px;
    /* 稍微增加內距 */
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
    background: var(--admin-border1);
    border: 1px solid #e2e8f0;
}

.layout-body {
    display: grid;
    /* 側邊欄固定，主面板自動撐開 */
    grid-template-columns: 220px 1fr;
    gap: 40px;
    /* 增加左右間距 */
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
    padding: 15px 30px !important;
    /* 上下改為 15px，左右維持 30px */
    border: 1px solid var(--admin-border);
    color: var(--admin-text);
    margin-bottom: 20px;
    /* 稍微縮小卡片之間的垂直距離 */
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
    appearance: none !important;
    /* 隱藏原生箭頭 */
    -webkit-appearance: none;
    cursor: pointer;
    /* 加入自定義箭頭圖標 */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
    background-repeat: no-repeat !important;
    background-position: right 15px center !important;
    background-size: 18px !important;
    padding-right: 45px !important;
    /* 留位置給箭頭 */
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
    background-color: #ffffff;
    /* 選項彈出時用白底 */
    color: #1e293b;
    /* 文字用深色 */
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
    margin-top: 20px;
    z-index: 10; /* 確保在最上層 */
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


.brain-selector-group {
    margin-bottom: 20px;
}

.section-label {
    display: block;
    font-size: 0.85rem;
    font-weight: bold;
    margin-bottom: 10px;
    opacity: 0.8;
}

.brain-toggle-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
}

.brain-option {
    position: relative;
    cursor: pointer !important; /* 強制顯示手指 */
    border: 2px solid #e2e8f0; /* 預設淺灰色邊框 */
    transition: all 0.2s ease-in-out;
}

/* 選中勾勾的樣式 */
.check-mark {
    position: absolute;
    top: 10px;
    right: 10px;
    color: #3b82f6;
    font-weight: bold;
    font-size: 1.2rem;
}

/* 選中時的樣式：直接給藍色 */
.brain-option.active {
    border-color: #3b82f6 !important; 
    background-color: #eff6ff !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.version-tag {
    background: #94a3b8;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    font-size: 0.7rem;
    font-weight: 800;
}

.version-tag.v2 {
    background: #3b82f6;
}

.option-name {
    font-size: 0.9rem;
    font-weight: bold;
}

.option-desc {
    font-size: 0.75rem;
    opacity: 0.6;
}

.divider {
    border: none;
    border-top: 1px solid var(--admin-border);
    margin: 20px 0;
    opacity: 0.3;
}
</style>