<script setup>
import { ref } from 'vue'

// 接收父組件傳過來的樣式
const props = defineProps({
    currentStyle: Object
})

/* ========================
   模型控制中心邏輯
   ======================== */
const selectedAiModel = ref('gemini') 
const aiSettings = ref({
    geminiKey: '',
    geminiVersion: 'gemini-1.5-pro',
    ollamaHost: 'http://localhost:11434',
    ollamaModel: 'llama3'
})

const testConnection = () => {
    alert(`正在測試 ${selectedAiModel.value} 連線...`)
}

// 儲存邏輯 (之後對接 FastAPI)
const saveConfig = () => {
    console.log("準備儲存至 MySQL:", aiSettings.value)
    alert("設定已傳送至後端加密儲存！")
}
</script>

<template>
    <div class="model-management-container">
        <div class="section-header">
            <h3>🤖 AI 模型控制中心</h3>
            <p class="opacity-60">配置用於自動化記帳分類與財務健康分析的 AI 大腦</p>
        </div>

        <div class="model-config-grid">
            <div class="config-sidebar">
                <div class="model-card" 
                     :class="{ active: selectedAiModel === 'gemini' }"
                     @click="selectedAiModel = 'gemini'">
                    <div class="model-icon">✨</div>
                    <div class="model-info">
                        <span class="model-name">Google Gemini</span>
                        <span class="model-desc">雲端高性能 LLM</span>
                    </div>
                </div>

                <div class="model-card" 
                     :class="{ active: selectedAiModel === 'ollama' }"
                     @click="selectedAiModel = 'ollama'">
                    <div class="model-icon">🦙</div>
                    <div class="model-info">
                        <span class="model-name">Ollama (Local)</span>
                        <span class="model-desc">本地私有化部署</span>
                    </div>
                </div>
            </div>

            <div class="config-detail-card">
                <div v-if="selectedAiModel === 'gemini'" class="animate-fade-in">
                    <div class="card-title-row">
                        <h4>Gemini Cloud 設定</h4>
                        <span class="badge-online">已啟用 Google API</span>
                    </div>
                    <div class="input-group">
                        <label>Gemini API Key</label>
                        <input type="password" v-model="aiSettings.geminiKey" 
                               placeholder="API Key 會安全地儲存在後端資料庫" class="mma-input" />
                    </div>
                    <div class="input-group">
                        <label>模型版本</label>
                        <select v-model="aiSettings.geminiVersion" class="mma-input">
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro (推薦)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                        </select>
                    </div>
                </div>

                <div v-if="selectedAiModel === 'ollama'" class="animate-fade-in">
                    <div class="card-title-row">
                        <h4>Ollama 本地設定</h4>
                        <span class="badge-offline">本地內網通訊</span>
                    </div>
                    <div class="input-group">
                        <label>伺服器端點 (Host)</label>
                        <input type="text" v-model="aiSettings.ollamaHost" class="mma-input" />
                    </div>
                    <div class="input-group">
                        <label>指定模型名稱 (Model)</label>
                        <input type="text" v-model="aiSettings.ollamaModel" class="mma-input" />
                    </div>
                </div>

                <div class="config-actions">
                    <button class="btn-mma-action" @click="testConnection">⚡ 測試連線</button>
                    <button class="btn-mma-action" 
                            
                            @click="saveConfig">
                        💾 儲存並套用
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

.model-config-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 25px;
    margin-top: 20px;
}

.config-sidebar {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.model-card {
    background: white;
    padding: 16px;
    border-radius: 12px;
    border: 2px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.model-card.active {
    border-color: #3b82f6; /* 這是你喜歡的藍色框 */
    background: #f0f7ff;
}

.model-name { display: block; font-weight: bold; }
.model-desc { font-size: 0.8rem; color: #666; }

.config-detail-card {
    background: white;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.input-group { margin-bottom: 20px; }
.input-group label { display: block; margin-bottom: 8px; font-weight: 500; }
.mma-input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ddd; }

.config-actions {
    display: flex;
    gap: 12px;
    margin-top: 30px;
}
.btn-mma-action {
    background: white;
    border: 1.5px solid #3b82f6;
    color: #3b82f6;
    padding: 10px 25px;      
    border-radius: 12px;   
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;      
    transition: 0.2s;
    white-space: nowrap;
    margin-left: 50%;
}


.btn-mma-action:hover:not(.is-disabled) {
    background: #3b82f6;
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
}

</style>