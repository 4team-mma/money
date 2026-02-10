<script setup>
import { ref, onMounted, computed } from 'vue' 
import { robotApi } from '../api/robot';
import { useAiAdminStore } from '../stores/useAiAdminStore';

const aiStore = useAiAdminStore();
const selectedAiModel = ref('ollama')
const isEditMode = ref(false)
const isSaving = ref(false)

// 🎯 1. Gemini 模型清單
const geminiModels = [
    { label: 'Gemini 1.5 Flash (測試首選/額度高)', value: 'gemini-1.5-flash' },
    { label: 'Gemini 1.5 Pro (聰明/額度中)', value: 'gemini-1.5-pro' },
    { label: 'Gemini 2.0 Flash (目前最穩/額度低)', value: 'gemini-2.0-flash' },
    { label: 'Gemini 2.0 Flash Lite (極速/預覽版)', value: 'gemini-2.0-flash-lite-preview-02-05' },
    { label: 'Gemini Pro Latest (最新 Pro)', value: 'gemini-pro-latest' }
]

// 🎯 2. 定義各模型的限制資訊
const modelLimitsInfo = {
    'gemini-1.5-flash': { rpm: '15 RPM', rpd: '1,500 RPD', desc: '✅ 額度最高，適合瘋狂測試與一般對話。' },
    'gemini-1.5-pro':   { rpm: '2 RPM',  rpd: '50 RPD',    desc: '⚠️ 每日僅 50 次，適合處理複雜邏輯，省著用。' },
    'gemini-2.0-flash': { rpm: '10 RPM', rpd: '1,500 RPD', desc: '⚡ 速度快且穩，額度尚可 (依官方浮動)。' },
    'gemini-2.0-flash-lite-preview-02-05': { rpm: '30 RPM', rpd: '1,500+ RPD', desc: '🚀 極速預覽版，通常額度給很寬。' },
    'default':          { rpm: '未知',    rpd: '未知',      desc: '❓ 實驗性或舊版模型，額度通常較低 (約 50 次/日)。' }
}

// 計算當前選中 Gemini 模型的限制資訊
const currentGeminiLimit = computed(() => {
    const ver = localSettings.value.geminiVersion;
    return modelLimitsInfo[ver] || modelLimitsInfo['default'];
});

const ollamaModels = [
    { label: 'Gemma 3 1B IT (Mac 舊款首選)', value: 'gemma3:1b', locked: false },
    { label: 'Llama 3.2 3B (Win11 推薦)', value: 'llama3.2', locked: true },
    { label: 'DeepSeek R1 (Win10 推薦)', value: 'deepseek-r1:7b', locked: true }
]

// 😺 更新：長話短說、成語精簡版的喵喵性格
const DEFAULT_PROMPT = '你是理財助手喵喵。個性惜字如金，言簡意賅，善用成語。嚴禁冗詞贅字、表格與公式。回答限制 30 字內，直指核心，句尾務必帶喵~';

const localSettings = ref({
    geminiKey: '',
    anythingKey: '',
    geminiVersion: 'gemini-1.5-flash', 
    ollamaModel: 'gemma3:1b',
    system_prompt: DEFAULT_PROMPT
})

// 🚀 強制同步函數 (修正：讀取 model_version)
const switchAndSync = async (provider) => {
    selectedAiModel.value = provider;
    isEditMode.value = false;
    await aiStore.fetchConfig(provider); // 確保 Store 資料是最新的

    const cached = aiStore.configs[provider];

    // 1. 同步 Prompt
    localSettings.value.system_prompt = cached.prompt || DEFAULT_PROMPT;

    // 2. 同步模型版本 (包含防呆機制)
    if (provider === 'gemini') {
        // 從 Store 取值 (Store 裡叫做 version)
        const dbValue = cached.version;
        // 檢查這個值是否有效 (是否存在於我們的 geminiModels 清單中)
        const isValid = geminiModels.some(m => m.value === dbValue);
        
        // 如果 DB 有值且有效，就用 DB 的；否則給預設值，防止選單空白
        localSettings.value.geminiVersion = isValid ? dbValue : 'gemini-1.5-flash';
        
        // Debug 用：讓你知道前端抓到了什麼
        console.log(`[Admin] Gemini Version Sync: DB=${dbValue}, UI=${localSettings.value.geminiVersion}`);
    }

    if (provider === 'ollama') {
        const dbValue = cached.version;
        // Ollama 因為是本地模型，比較彈性，有值就用，沒值用預設
        localSettings.value.ollamaModel = dbValue || 'gemma3:1b';
    }
}

onMounted(async () => {
    // 取得目前生效的 Provider (例如 'gemini')
    const res = await robotApi.getAiRobotConfig();
    const d = res?.data || res;
    
    // 載入該 Provider 的詳細設定 (包含 Key 狀態與模型版本)
    await switchAndSync(d?.provider || 'ollama');
})

const handleSave = async () => {
    isSaving.value = true;
    try {
        const provider = selectedAiModel.value;
        let activeKey = 'none';

        if (isEditMode.value) {
            if (provider === 'gemini' && localSettings.value.geminiKey.trim()) activeKey = localSettings.value.geminiKey.trim();
            if (provider === 'anythingllm' && localSettings.value.anythingKey.trim()) activeKey = localSettings.value.anythingKey.trim();
        }

        const payload = {
            provider: provider,
            system_prompt: localSettings.value.system_prompt,
            base_url: provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:3001',
            // 儲存時將選單的值送回後端
            model_version: provider === 'ollama' ? localSettings.value.ollamaModel : 
                           provider === 'anythingllm' ? 'gemma3:1b' : localSettings.value.geminiVersion,
            api_key: activeKey
        };

        await robotApi.saveAiRobotConfig(payload);
        await aiStore.fetchConfig(provider); // 儲存後重新抓取確認
        
        localSettings.value.geminiKey = '';
        localSettings.value.anythingKey = '';
        isEditMode.value = false;
        alert("💾 設定已更新！準備上線~喵~");
    } catch (error) { alert("❌ 儲存失敗！"); }
    finally { isSaving.value = false; }
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
                ● 目前生效：<strong>{{ aiStore.currentActiveProvider.toUpperCase() || '載入中' }}</strong>
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
                            <input v-if="!aiStore.configs.gemini.hasKey || isEditMode" type="password" v-model="localSettings.geminiKey" class="form-input" placeholder="請貼上 API Key" />
                            <div v-else class="key-locked-display">🔒 系統已安全載入並加密儲存金鑰</div>
                            <button @click="isEditMode = !isEditMode" class="btn-edit">{{ isEditMode ? '取消' : '修改' }}</button>
                        </div>
                    </div>

                    <div v-if="selectedAiModel === 'anythingllm'" class="form-group">
                        <label>ANYTHINGLLM KEY</label>
                        <div class="key-control">
                            <input v-if="!aiStore.configs.anythingllm.hasKey || isEditMode" type="password" v-model="localSettings.anythingKey" class="form-input" placeholder="請貼上 Key" />
                            <div v-else class="key-locked-display">🔒 系統已安全載入並加密儲存金鑰</div>
                            <button @click="isEditMode = !isEditMode" class="btn-edit">{{ isEditMode ? '取消' : '修改' }}</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>運作模型版本</label>
                        <select v-if="selectedAiModel === 'gemini'" v-model="localSettings.geminiVersion" class="form-select">
                            <option v-for="m in geminiModels" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                        <select v-if="selectedAiModel === 'ollama'" v-model="localSettings.ollamaModel" class="form-select">
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
                        <div class="limit-note">* 數值為官方免費版預設上限，無法即時抓取剩餘次數。</div>
                    </div>

                </div>

                <button @click="handleSave" class="btn-save-master" :disabled="isSaving">
                    💾 儲存變更
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.model-management-container { max-width: 900px; margin: 0 auto; color: #1e293b; }
.glass-header { display: flex; justify-content: space-between; align-items: center; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 30px; }
.active-status { padding: 8px 18px; border-radius: 50px; font-size: 0.85rem; font-weight: bold; background: white; border: 1px solid #e2e8f0; }
.layout-body { display: grid; grid-template-columns: 200px 1fr; gap: 30px; }
.nav-sidebar { display: flex; flex-direction: column; gap: 12px; }
.nav-item { padding: 15px; background: white; border-radius: 15px; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.3s; font-weight: 600; text-align: center; }
.nav-item.active { background: #3b82f6; color: white; border-color: #2563eb; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
.config-pane { display: flex; flex-direction: column; gap: 20px; }
.card { background: white; border-radius: 20px; padding: 25px; border: 1px solid #f1f5f9; }
.personality-card { border-top: 6px solid #3b82f6; }
.card-title { font-size: 1rem; font-weight: 800; margin-bottom: 20px; color: #334155; }
.prompt-area { width: 100%; border-radius: 12px; border: 1px solid #cbd5e1; padding: 15px; font-size: 0.95rem; line-height: 1.6; background: #f8fafc; outline: none; }
.key-locked-display { flex: 1; padding: 12px; background: #f1f5f9; border-radius: 10px; color: #94a3b8; font-size: 0.85rem; border: 1px dashed #cbd5e1; display: flex; align-items: center; }
.btn-edit { padding: 0 20px; background: white; border: 1px solid #cbd5e1; border-radius: 10px; cursor: pointer; font-weight: 600; }
.btn-save-master { width: 100%; padding: 18px; background: #3b82f6; color: white; border: none; border-radius: 15px; font-weight: 800; font-size: 1rem; cursor: pointer; box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3); }
.form-input, .form-select { flex: 1; padding: 12px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
.readonly { background: #f8fafc; border-style: dashed; color: #94a3b8; }
.limit-info-box { margin-top: 15px; background: #fff7ed; border: 1px solid #ffedd5; padding: 15px; border-radius: 12px; font-size: 0.9rem; color: #9a3412; }
.limit-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: 600; }
.limit-desc { margin-top: 8px; font-size: 0.85rem; color: #c2410c; }
.limit-note { margin-top: 5px; font-size: 0.75rem; color: #9ca3af; font-style: italic; }
</style>