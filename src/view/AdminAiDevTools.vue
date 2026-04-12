<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { generateDevCodeStream } from '@/api/admin_helper'

const currentTab = ref('stage1')
const currentTabName = computed(() => {
    if (currentTab.value === 'stage1') return '自動測試腳本生成'
    if (currentTab.value === 'stage2') return '程式碼 Bug 檢修'
    if (currentTab.value === 'stage3') return '全專案關聯查詢 (B1 機房)'
    return 'AI 訓練資料生成' // 🌟 新增
})

const stage1Input = ref('')
const stage2Code = ref('')
const stage2Log = ref('')
const stage3Input = ref('')
const stage4Input = ref('')

const isGenerating = ref(false)
const aiResponse = ref('')
const thinkingText = ref('') // 🌟 專門存放「思考過程」的變數
const isThinkingDone = ref(false)

const executeTask = async () => {
    // 防呆檢查
    if (currentTab.value === 'stage1' && !stage1Input.value.trim()) { alert('請先輸入測試情境喵！'); return }
    if (currentTab.value === 'stage2' && !stage2Code.value.trim() && !stage2Log.value.trim()) { alert('程式碼跟錯誤日誌至少要填一個喵！'); return }
    if (currentTab.value === 'stage3' && !stage3Input.value.trim()) { alert('請輸入你想詢問的專案問題喵！'); return }
    if (currentTab.value === 'dataset_gen' && !stage4Input.value.trim()) { alert('請輸入要生成的資料情境喵！'); return } // 🌟 新增防呆

    isGenerating.value = true
    aiResponse.value = ''
    thinkingText.value = '深度思考載入中 :) 請稍後...'
    isThinkingDone.value = false
    let rawStreamText = ''

    try {
        // 🌟 這裡判斷，傳遞真正的 mode 名稱給後端
        let payload = { mode: currentTab.value, context: '' }
        if (currentTab.value === 'stage1') payload.context = stage1Input.value
        else if (currentTab.value === 'stage2') payload.context = `[有問題的程式碼]:\n${stage2Code.value}\n\n[錯誤日誌]:\n${stage2Log.value}`
        else if (currentTab.value === 'stage3') payload.context = stage3Input.value
        else if (currentTab.value === 'dataset_gen') payload.context = stage4Input.value // 🌟 新增這裡

        const userStore = useUserStore()
        const token = localStorage.getItem("user_token") || localStorage.getItem("token") || ""
        if (!token) {
            alert('找不到登入憑證喵！請重新登入！')
            isGenerating.value = false
            return
        }

        // 🌟 呼叫封裝好的 API，並傳入 callback 處理打字機邏輯！
        // 這樣 Vue 檔就徹底乾淨了！
        await generateDevCodeStream(payload, token, (chunkText) => {
            rawStreamText += chunkText

            // 解析 <think> 的邏輯完全不用動
            const thinkStart = rawStreamText.indexOf('<think>')
            const thinkEnd = rawStreamText.indexOf('</think>')

            if (thinkStart !== -1) {
                if (thinkEnd === -1) {
                    const thinkingContent = rawStreamText.slice(thinkStart + 7).trim()
                    thinkingText.value = thinkingContent.replace(/\n/g, ' ') || '深度思考中...'
                    isThinkingDone.value = false
                } else {
                    isThinkingDone.value = true
                    aiResponse.value = rawStreamText.slice(thinkEnd + 8).trimStart()
                }
            } else {
                aiResponse.value = rawStreamText
                isThinkingDone.value = true
            }
        })

    } catch (error) {
        console.error("AI 輔助生成失敗:", error)
        aiResponse.value = "喵... 連線到後端或 Ollama 失敗了，請按 F12 檢查 Network 喵！"
        isThinkingDone.value = true
    } finally {
        isGenerating.value = false
        isThinkingDone.value = true
    }
}

const copyCode = () => {
    navigator.clipboard.writeText(aiResponse.value)
    alert('已複製到剪貼簿喵！')
}
</script>

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
                <div class="nav-item" :class="{ active: currentTab === 'stage1' }" @click="currentTab = 'stage1'">🐾
                    測試腳本生成</div>
                <div class="nav-item" :class="{ active: currentTab === 'stage2' }" @click="currentTab = 'stage2'">🐾 Bug
                    檢修站</div>
                <div class="nav-item" :class="{ active: currentTab === 'stage3' }" @click="currentTab = 'stage3'">🐾
                    全專案顧問 (B1)</div>
                <div class="nav-item" :class="{ active: currentTab === 'dataset_gen' }"
                    @click="currentTab = 'dataset_gen'">🐾 資料生成專家</div>
            </div>

            <div class="config-pane">
                <div class="card personality">
                    <div class="card-title">🐈 {{ currentTabName }} 設定</div>

                    <div v-show="currentTab === 'stage1'" class="animate-fade">
                        <div class="form-group">
                            <label>請描述您想生成的測試情境喵：</label>
                            <textarea v-model="stage1Input" class="prompt-area"
                                placeholder="例如：請幫我寫一個 Locust 壓力測試..."></textarea>
                        </div>
                    </div>

                    <div v-show="currentTab === 'stage2'" class="animate-fade">
                        <div class="form-group">
                            <label>1. 有問題的程式碼片段 (Function / Component)：</label>
                            <textarea v-model="stage2Code" class="prompt-area code-font"
                                style="min-height: 120px;"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>2. 錯誤日誌 (Error Log)：</label>
                            <textarea v-model="stage2Log" class="prompt-area code-font error-bg"
                                style="min-height: 100px;"></textarea>
                        </div>
                    </div>

                    <div v-show="currentTab === 'stage3'" class="animate-fade">
                        <div class="form-group">
                            <label>詢問專案架構或連動問題 (已連線至 B1 機房)：</label>
                            <textarea v-model="stage3Input" class="prompt-area" style="min-height: 120px;"
                                placeholder="請輸入架構問題喵..."></textarea>
                        </div>
                    </div>

                    <div v-show="currentTab === 'dataset_gen'" class="animate-fade">
                        <div class="form-group">
                            <label>請描述要生成的訓練資料情境 (微調用)：</label>
                            <textarea v-model="stage4Input" class="prompt-area" style="min-height: 120px;"
                                placeholder="例如：幫我生 10 筆關於購買股票的語音糾錯對話..."></textarea>
                        </div>
                    </div>
                </div>

                <button @click="executeTask" class="btn-save-master" :disabled="isGenerating">
                    {{ isGenerating ? '⏳ 喵喵正在思考與撰寫中...' : '🐈 讓喵喵幫你寫' }}
                </button>

                <div class="card connection" style="margin-top: 10px;">
                    <div class="card-title" style="display: flex; justify-content: space-between; align-items: center;">
                        <span>📝 喵喵的解答</span>
                        <button v-if="aiResponse" @click="copyCode" class="btn-edit">📋 複製程式碼</button>
                    </div>

                    <div class="output-container" :class="{ 'thinking-bg': isGenerating }">
                        <div v-if="!isGenerating && !aiResponse" class="empty-state">
                            <span style="font-size: 2rem;">🐈</span>
                            <p>等待小主人輸入指令喵...</p>
                        </div>

                        <div v-if="isGenerating && !isThinkingDone" class="thinking-stream-line">
                            {{ thinkingText }}
                        </div>

                        <pre v-if="aiResponse" class="code-output"><code>{{ aiResponse }}</code></pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 基礎樣式全部保留原本的，只補上思考狀態的專屬 CSS */
.model-management-container {
    user-select: none;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    color: var(--admin-text);
}

h3,
span,
label {
    color: var(--admin-text);
}

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
    color: #fff;
    border-color: var(--admin-primary);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

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

.error-bg {
    background: rgba(239, 68, 68, 0.05);
}

.code-font {
    font-family: 'Courier New', Courier, monospace;
}

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

.thinking-bg {
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

.animate-fade {
    animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 🌟 你指定的極簡灰色單行思考樣式 */
.thinking-stream-line {
    color: #94a3b8;
    /* 灰色字體 */
    font-size: 0.95rem;
    font-style: italic;
    padding: 10px 0;
    margin-bottom: 10px;
    border-bottom: 1px dashed #cbd5e1;
    /* 強制單行並將溢出部分變成 ... */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    /* 呼吸燈特效 */
    animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
    0% {
        opacity: 0.4;
    }

    50% {
        opacity: 1;
    }

    100% {
        opacity: 0.4;
    }
}
</style>