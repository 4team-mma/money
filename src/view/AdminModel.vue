<script setup>
import { ref, onMounted } from 'vue'
import { robotApi } from '../api/robot';

const selectedAiModel = ref('ollama')
const currentActiveModel = ref('載入中...')

const aiSettings = ref({
    geminiKey: '',
    geminiVersion: 'gemini-1.5-pro',
    ollamaHost: 'http://localhost:11434',
    ollamaModel: 'gemma3:1b',
    anythingHost: 'http://localhost:3001',
    anythingModel: 'gemma3:1b',
    anythingKey: '',
    system_prompt: '你是一個親切的理財助手喵喵，說話結尾要帶喵~'
})

onMounted(async () => {
    try {
        const res = await robotApi.getAiRobotConfig();
        const d = res.data || res;
        if (d && d.provider) {
            selectedAiModel.value = d.provider;
            currentActiveModel.value = d.provider.toUpperCase();
            // 同步讀取的設定到輸入框
            if (d.provider === 'anythingllm') {
                aiSettings.value.anythingHost = d.base_url;
                aiSettings.value.anythingModel = d.model_version;
            } else if (d.provider === 'ollama') {
                aiSettings.value.ollamaHost = d.base_url;
                aiSettings.value.ollamaModel = d.model_version;
            }
            aiSettings.value.system_prompt = d.system_prompt || aiSettings.value.system_prompt;
        }
    } catch (err) { currentActiveModel.value = '預設 Ollama'; }
})

const saveConfig = async () => {
    try {
        let activeKey = '';
        if (selectedAiModel.value === 'anythingllm') activeKey = aiSettings.value.anythingKey;
        else if (selectedAiModel.value === 'gemini') activeKey = aiSettings.value.geminiKey;

        let host = selectedAiModel.value === 'ollama' ? aiSettings.value.ollamaHost : aiSettings.value.anythingHost;
        let model = selectedAiModel.value === 'ollama' ? aiSettings.value.ollamaModel : 
                    selectedAiModel.value === 'anythingllm' ? aiSettings.value.anythingModel : aiSettings.value.geminiVersion;

        const payload = {
            provider: selectedAiModel.value,
            system_prompt: aiSettings.value.system_prompt,
            base_url: host,
            model_version: model,
            api_key: activeKey // 若為空，後端會自動找舊的
        };

        await robotApi.saveAiRobotConfig(payload);
        currentActiveModel.value = selectedAiModel.value.toUpperCase();
        alert("✅ 設定儲存並套用成功！");
    } catch (error) { alert("❌ 儲存失敗，請檢查 API 路徑是否為 /save"); }
}
</script>

<template>
    <div class="model-management-container">
        <div class="section-header">
            <div class="header-main">
                <h3>🤖 AI 模型控制中心</h3>
                <div class="status-badge" :class="selectedAiModel">
                    ● 目前生效：<strong>{{ currentActiveModel }}</strong>
                </div>
            </div>
        </div>

        <div class="model-config-grid">
            <div class="config-sidebar">
                <div class="model-card" :class="{ active: selectedAiModel === 'ollama' }" @click="selectedAiModel = 'ollama'">🦙 Ollama</div>
                <div class="model-card" :class="{ active: selectedAiModel === 'anythingllm' }" @click="selectedAiModel = 'anythingllm'">🦾 AnythingLLM</div>
                <div class="model-card" :class="{ active: selectedAiModel === 'gemini' }" @click="selectedAiModel = 'gemini'">✨ Gemini</div>
            </div>

            <div class="config-detail-card">
                <div class="editing-title">正在配置：{{ selectedAiModel.toUpperCase() }}</div>

                <div v-if="selectedAiModel === 'anythingllm'">
                    <div class="input-group"><label>API 端點</label><input v-model="aiSettings.anythingHost" class="mma-input" /></div>
                    <div class="input-group"><label>API Key (留空保持原設定)</label><input type="password" v-model="aiSettings.anythingKey" class="mma-input" /></div>
                </div>

                <div v-if="selectedAiModel === 'ollama'">
                    <div class="input-group"><label>Host</label><input v-model="aiSettings.ollamaHost" class="mma-input" /></div>
                </div>

                <div v-if="selectedAiModel === 'gemini'">
                    <div class="input-group"><label>Gemini Key (留空保持原設定)</label><input type="password" v-model="aiSettings.geminiKey" class="mma-input" /></div>
                </div>

                <div class="config-actions"><button class="btn-mma-action" @click="saveConfig">💾 儲存並套用</button></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 保持你原本的樣式，並新增以下狀態標籤樣式 */
.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.status-badge {
    background: #f3f4f6;
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 0.9rem;
    color: #4b5563;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #e5e7eb;
}

.status-badge.ollama { border-color: #93c5fd; color: #1e40af; }
.status-badge.anythingllm { border-color: #c084fc; color: #581c87; }
.status-badge.gemini { border-color: #6ee7b7; color: #064e3b; }

.pulse-icon {
    color: #10b981;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}

.editing-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #3b82f6;
    margin-bottom: 10px;
    font-weight: bold;
}

/* 原始樣式... */
.model-config-grid { display: grid; grid-template-columns: 280px 1fr; gap: 25px; margin-top: 20px; }
.config-sidebar { display: flex; flex-direction: column; gap: 15px; }
.model-card { background: white; padding: 16px; border-radius: 12px; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
.model-card.active { border-color: #3b82f6; background: #f0f7ff; }
.model-name { display: block; font-weight: bold; }
.model-desc { font-size: 0.8rem; color: #666; }
.config-detail-card { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 500; }
.mma-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
.config-actions { display: flex; gap: 12px; margin-top: 30px; }
.btn-mma-action { background: white; border: 1.5px solid #3b82f6; color: #3b82f6; padding: 10px 25px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 14px; transition: 0.2s; white-space: nowrap; }
.btn-mma-action:hover { background: #3b82f6; color: white; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2); }
</style>