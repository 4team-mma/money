<script setup>
import { ref, onMounted, watch } from 'vue'
import { robotApi } from '../api/robot';
import { useAiAdminStore } from '../stores/useAiAdminStore';

const aiStore = useAiAdminStore();
const selectedAiModel = ref('ollama')
const isEditMode = ref(false)
const isSaving = ref(false)

// 🎯 找回原本的 3 個模型
const geminiModels = [
    { label: 'Gemini 2.0 Flash (目前最穩)', value: 'gemini-2.0-flash' },
    { label: 'Gemini Flash Latest (最新 Flash)', value: 'gemini-flash-latest' },
    { label: 'Gemini Pro Latest (最新 Pro)', value: 'gemini-pro-latest' }
]

const ollamaModels = [
    { label: 'Gemma 3 1B IT (Mac 舊款首選)', value: 'gemma-3-1b-it', locked: false },
    { label: 'Llama 3.2 3B (Win11 推薦)', value: 'llama3.2', locked: true },
    { label: 'DeepSeek R1 (Win10 推薦)', value: 'deepseek-r1:7b', locked: true }
]

const DEFAULT_PROMPT = '你是理財助手喵喵。嚴禁廢話、公式與表格，回答限制在 30 字內，直接回答金額重點，結尾帶喵。';

const localSettings = ref({
    geminiKey: '',
    anythingKey: '',
    geminiVersion: 'gemini-2.0-flash',
    ollamaModel: 'gemma-3-1b-it',
    system_prompt: DEFAULT_PROMPT
})

// 🚀 強制同步函數：確保 hasKey 狀態被更新
const switchAndSync = async (provider) => {
    selectedAiModel.value = provider;
    isEditMode.value = false;
    await aiStore.fetchConfig(provider); // 這裡會更新 aiStore.configs[provider].hasKey
    
    const cached = aiStore.configs[provider];
    localSettings.value.system_prompt = cached.prompt || DEFAULT_PROMPT;
    if (provider === 'gemini') localSettings.value.geminiVersion = cached.version || 'gemini-2.0-flash';
    if (provider === 'ollama') localSettings.value.ollamaModel = cached.version || 'gemma-3-1b-it';
}

onMounted(async () => {
    const res = await robotApi.getAiRobotConfig();
    const d = res?.data || res;
    await switchAndSync(d?.provider || 'ollama');
})

const handleSave = async () => {
    isSaving.value = true;
    try {
        const provider = selectedAiModel.value;
        let activeKey = 'none';

        // 修改模式開啟且有填寫才傳送 Key
        if (isEditMode.value) {
            if (provider === 'gemini' && localSettings.value.geminiKey.trim()) activeKey = localSettings.value.geminiKey.trim();
            if (provider === 'anythingllm' && localSettings.value.anythingKey.trim()) activeKey = localSettings.value.anythingKey.trim();
        }

        const payload = {
            provider: provider,
            system_prompt: localSettings.value.system_prompt,
            base_url: provider === 'ollama' ? 'http://localhost:11434' : 'http://localhost:3001',
            model_version: provider === 'ollama' ? localSettings.value.ollamaModel : 
                           provider === 'anythingllm' ? 'gemma3:1b' : localSettings.value.geminiVersion,
            api_key: activeKey
        };

        await robotApi.saveAiRobotConfig(payload);
        await aiStore.fetchConfig(provider); // 🚀 儲存完立刻抓回最新 hasKey 狀態
        
        localSettings.value.geminiKey = '';
        localSettings.value.anythingKey = '';
        isEditMode.value = false; // 🚀 儲存完自動關閉修改模式，觸發鎖定
        alert("💾 所有變更已成功儲存喵！");
    } catch (error) { alert("❌ 儲存失敗！"); }
    finally { isSaving.value = false; }
}
</script>

<template>
    <div class="model-management-container">
        <div class="glass-header">
            <div class="title-group">
                <h3>🤖 AI 模型控制中心</h3>
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
                </div>

                <button @click="handleSave" class="btn-save-master" :disabled="isSaving">
                    💾 儲存變更
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 🎯 樣式完整恢復您最愛的版本 */
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
</style>