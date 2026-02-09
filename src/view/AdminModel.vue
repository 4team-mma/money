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

// 🚀 核心：初始化加載
onMounted(async () => {
    try {
        // 🛡️ 雙系統 Token 預檢 (Mac: user_token / Win11: token)
        const token = localStorage.getItem('user_token') || localStorage.getItem('token');
        if (!token) {
            currentActiveModel.value = '尚未登入喵';
            return;
        }

        const res = await robotApi.getAiRobotConfig();
        // 修正：相容 axios 不同層級的資料結構
        const d = res?.data || res;
        
        if (d && d.provider) {
            selectedAiModel.value = d.provider;
            currentActiveModel.value = d.provider.toUpperCase();
            
            // 同步設定到輸入框，增加預設值防止空白
            if (d.provider === 'anythingllm') {
                aiSettings.value.anythingHost = d.base_url || 'http://localhost:3001';
                aiSettings.value.anythingModel = d.model_version || 'gemma3:1b';
            } else if (d.provider === 'ollama') {
                aiSettings.value.ollamaHost = d.base_url || 'http://localhost:11434';
                aiSettings.value.ollamaModel = d.model_version || 'gemma3:1b';
            }
            aiSettings.value.system_prompt = d.system_prompt || aiSettings.value.system_prompt;
        } else {
            currentActiveModel.value = '預設 OLLAMA';
        }
    } catch (err) { 
        console.error("載入配置失敗:", err);
        // 針對 401 報錯提供明確文字提示
        currentActiveModel.value = err.response?.status === 401 ? '認證過期' : '連線失敗';
    }
})

const saveConfig = async () => {
    try {
        let activeKey = '';
        if (selectedAiModel.value === 'anythingllm') activeKey = aiSettings.value.anythingKey;
        else if (selectedAiModel.value === 'gemini') activeKey = aiSettings.value.geminiKey;

        // 整理 payload
        const payload = {
            provider: selectedAiModel.value,
            system_prompt: aiSettings.value.system_prompt,
            base_url: selectedAiModel.value === 'ollama' ? aiSettings.value.ollamaHost : aiSettings.value.anythingHost,
            model_version: selectedAiModel.value === 'ollama' ? aiSettings.value.ollamaModel : 
                           selectedAiModel.value === 'anythingllm' ? aiSettings.value.anythingModel : aiSettings.value.geminiVersion,
            api_key: activeKey
        };

        await robotApi.saveAiRobotConfig(payload);
        currentActiveModel.value = selectedAiModel.value.toUpperCase();
        alert("✅ 設定儲存並套用成功！喵～");
    } catch (error) { 
        alert(`❌ 儲存失敗：${error.response?.data?.detail || '連線逾時喵'}`); 
    }
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
                    <div class="input-group"><label>Gemini Key</label><input type="password" v-model="aiSettings.geminiKey" class="mma-input" /></div>
                </div>

                <div class="config-actions">
                    <button class="btn-mma-action" @click="saveConfig">💾 儲存並套用</button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 此處保留您原本最精美的 CSS 喵！ */
.header-main { display: flex; justify-content: space-between; align-items: center; }
.status-badge { background: #f3f4f6; padding: 6px 16px; border-radius: 50px; font-size: 0.9rem; color: #4b5563; display: flex; align-items: center; gap: 8px; border: 1px solid #e5e7eb; }
.status-badge.ollama { border-color: #93c5fd; color: #1e40af; }
.status-badge.anythingllm { border-color: #c084fc; color: #581c87; }
.status-badge.gemini { border-color: #6ee7b7; color: #064e3b; }
.editing-title { font-size: 0.75rem; text-transform: uppercase; color: #3b82f6; margin-bottom: 10px; font-weight: bold; }
.model-config-grid { display: grid; grid-template-columns: 280px 1fr; gap: 25px; margin-top: 20px; }
.config-sidebar { display: flex; flex-direction: column; gap: 15px; }
.model-card { background: white; padding: 16px; border-radius: 12px; border: 2px solid transparent; cursor: pointer; transition: all 0.3s; }
.model-card.active { border-color: #3b82f6; background: #f0f7ff; }
.config-detail-card { background: white; padding: 24px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.mma-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; }
.btn-mma-action { background: #3b82f6; color: white; padding: 10px 25px; border-radius: 12px; cursor: pointer; border: none; }
</style>