<template>
    <div class="model-management-container">
        <div class="glass-header">
            <div class="title-group">
                <h3>🐈 AI 開發輔助中心</h3>
                <span class="sub-title">專屬地端模型輔助開發與系統除錯 (引擎: gemma4:e4b)</span>
            </div>
            <div class="active-status active">
                ● 目前任務：<strong>{{ currentTabName }}</strong>
            </div>
        </div>

        <div class="layout-body">
            <div class="nav-sidebar">
                <div class="nav-item" :class="{ active: currentTab === 'stage1' }" @click="currentTab = 'stage1'">
                    🐾 測試腳本生成
                </div>
                <div class="nav-item" :class="{ active: currentTab === 'stage2' }" @click="currentTab = 'stage2'">
                    🐾 Bug 檢修站
                </div>
                <div class="nav-item" :class="{ active: currentTab === 'stage3' }" @click="currentTab = 'stage3'" style="opacity: 0.6;">
                    🔒 全專案顧問 (B1)
                </div>
            </div>

            <div class="config-pane">
                
                <div class="card personality">
                    <div class="card-title">🐈 {{ currentTabName }} 設定</div>
                    
                    <div v-show="currentTab === 'stage1'" class="animate-fade">
                        <div class="form-group">
                            <label>請描述您想生成的測試情境喵：</label>
                            <textarea 
                                v-model="stage1Input" 
                                class="prompt-area" 
                                placeholder="例如：請幫我寫一個 Locust 壓力測試，模擬 100 人同時呼叫 /api/login 且隨機帶入過期 Token..."
                            ></textarea>
                        </div>
                    </div>

                    <div v-show="currentTab === 'stage2'" class="animate-fade">
                        <div class="form-group">
                            <label>1. 有問題的程式碼片段 (Function / Component)：</label>
                            <textarea 
                                v-model="stage2Code" 
                                class="prompt-area code-font" 
                                style="min-height: 120px;" 
                                placeholder="def some_broken_function(): ..."
                            ></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>2. 錯誤日誌 (Error Log)：</label>
                            <textarea 
                                v-model="stage2Log" 
                                class="prompt-area code-font error-bg" 
                                style="min-height: 100px;" 
                                placeholder="Traceback (most recent call last): ..."
                            ></textarea>
                        </div>
                    </div>

                    <div v-show="currentTab === 'stage3'" class="animate-fade locked-state">
                        <div class="form-group">
                            <label>詢問專案架構或連動問題 (B1 機房建置中)：</label>
                            <textarea disabled class="prompt-area readonly" placeholder="等待 codebase_vector_db 實作完成喵..."></textarea>
                        </div>
                    </div>
                </div>

                <button @click="executeTask" class="btn-save-master" :disabled="isGenerating || currentTab === 'stage3'">
                    {{ isGenerating ? '⏳ 喵喵正在思考與撰寫中...' : '🐈 讓喵喵幫你寫' }}
                </button>

                <div class="card connection" style="margin-top: 10px;">
                    <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>📝 喵喵的解答</span>
                        <button v-if="aiResponse" @click="copyCode" class="btn-edit">📋 複製程式碼</button>
                    </div>
                    
                    <div class="output-container" :class="{ 'thinking': isGenerating }">
                        <div v-if="!aiResponse && !isGenerating" class="empty-state">
                            <span style="font-size: 2rem;">🐈</span>
                            <p>等待小主人輸入指令喵...</p>
                        </div>
                        <div v-else-if="isGenerating" class="empty-state">
                            <span class="spin-icon">🐾</span>
                            <p>喵喵正在連線地端模型...</p>
                        </div>
                        <pre v-else class="code-output"><code>{{ aiResponse }}</code></pre>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentTab = ref('stage1')

const currentTabName = computed(() => {
    if (currentTab.value === 'stage1') return '自動測試腳本生成'
    if (currentTab.value === 'stage2') return '程式碼 Bug 檢修'
    return '全專案關聯查詢 (開發中)'
})

const stage1Input = ref('')
const stage2Code = ref('')
const stage2Log = ref('')

const isGenerating = ref(false)
const aiResponse = ref('')

const executeTask = async () => {
    isGenerating.value = true
    aiResponse.value = ''
    
    // 模擬 API 呼叫延遲
    setTimeout(() => {
        if (currentTab.value === 'stage1') {
            aiResponse.value = `# 🐈 喵喵幫你寫好的 Locust 測試腳本
from locust import HttpUser, task, between

class LoginTestUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def test_login_with_expired_token(self):
        # 模擬帶入過期 token 測試 slowapi 防護
        headers = {"Authorization": "Bearer expired_token_xyz"}
        with self.client.get("/api/login", headers=headers, catch_response=True) as response:
            if response.status_code == 401:
                response.success()
            else:
                response.failure(f"預期 401，但得到 {response.status_code} 喵！")
`
        } else if (currentTab.value === 'stage2') {
            aiResponse.value = `[🐈 喵喵診斷結果]
這個錯誤通常是因為在非同步 (async) 環境中直接呼叫了阻擋式 (blocking) 的 I/O 函式喵。

[🔧 修正後的程式碼]
async def my_endpoint():
    # 記得加上 await 來解決協程阻塞問題喵！
    result = await db.execute("SELECT * FROM users")
    return result
`
        }
        isGenerating.value = false
    }, 1500)
}

const copyCode = () => {
    navigator.clipboard.writeText(aiResponse.value)
    alert('已複製到剪貼簿喵！')
}
</script>

<style scoped>
/* 1. 基礎容器配置 (完美置中) */
.model-management-container {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    color: var(--admin-text);
}

h3, span, label {
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

/* 3. 佈局 (側邊欄 + 主內容) */
.layout-body {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 40px;
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
    color: #fff; /* 確保 active 狀態文字可見 */
    border-color: var(--admin-primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

/* 4. 卡片與表單 */
.config-pane {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.card {
    background: var(--admin-card-bg);
    border-radius: 24px;
    padding: 25px 30px;
    border: 1px solid var(--admin-border);
    color: var(--admin-text);
    margin-bottom: 10px;
}

.personality {
    border-top: 6px solid #0f71b3;
}

.card-title {
    font-size: 1.1rem;
    font-weight: 800;
    margin-bottom: 25px;
}

.form-group {
    margin-bottom: 25px;
}

.form-group label {
    display: block;
    margin-bottom: 12px;
    font-weight: 700;
    font-size: 0.95rem;
    opacity: 0.9;
}

/* 輸入框樣式 (直接對齊你的 .prompt-area) */
.prompt-area {
    width: 100%;
    background: rgba(0, 0, 0, 0.03);
    color: var(--admin-text);
    border: 1.5px solid var(--admin-border);
    border-radius: 14px;
    padding: 18px;
    font-size: 0.95rem;
    line-height: 1.6;
    outline: none;
    transition: all 0.3s ease;
    resize: vertical;
    min-height: 150px;
}

.prompt-area:focus {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--admin-primary);
    box-shadow: 0 0 0 4px rgba(15, 113, 179, 0.1);
}

.readonly {
    background: #f8fafc;
    border-style: dashed;
    color: #94a3b8;
    cursor: not-allowed;
}

.error-bg {
    background: rgba(239, 68, 68, 0.05);
}

.code-font {
    font-family: 'Courier New', Courier, monospace;
}

/* 5. 輸出區域 (模仿 prompt-area，但用來顯示程式碼) */
.output-container {
    width: 100%;
    background: rgba(0, 0, 0, 0.02);
    border: 1.5px solid var(--admin-border);
    border-radius: 14px;
    padding: 18px;
    min-height: 200px;
    max-height: 500px;
    overflow-y: auto;
    transition: all 0.3s ease;
}

.output-container.thinking {
    background: rgba(15, 113, 179, 0.05);
    border-color: rgba(15, 113, 179, 0.3);
}

.code-output {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
    color: var(--admin-text);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 160px;
    color: #94a3b8;
    font-weight: bold;
    gap: 10px;
}

/* 6. 按鈕樣式 (使用你的 btn-save-master 與 btn-edit) */
.btn-save-master {
    margin: 10px 0;
    width: 100%;
    padding: 18px;
    background: #0f71b3;
    color: white;
    border: none;
    border-radius: 15px;
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    box-shadow: 0 10px 25px rgba(15, 113, 179, 0.3);
    transition: all 0.3s;
}

.btn-save-master:disabled {
    background: #94a3b8;
    box-shadow: none;
    cursor: not-allowed;
}

.btn-edit {
    padding: 8px 20px;
    background: white;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
    color: #475569;
}

.btn-edit:hover {
    background: #f1f5f9;
}

/* 動畫 */
.animate-fade {
    animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

.spin-icon {
    font-size: 2rem;
    display: inline-block;
    animation: spin 1.5s linear infinite;
}
@keyframes spin {
    100% { transform: rotate(360deg); }
}

/* 捲軸美化 */
::-webkit-scrollbar {
    width: 8px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}
</style>