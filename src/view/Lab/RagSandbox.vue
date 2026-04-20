<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios'; // 假設妳用 axios 或妳封裝的 api

const router = useRouter();
const loading = ref(false);
const query = ref('');
const userScore = ref(0);

// HNSW 實驗參數
const params = reactive({
    m: 16,
    ef: 100,
    k: 5
});

// 模擬即時硬體狀態
const hw = reactive({
    temp: 42,
    vram: 2150,
    status: 'Ready'
});

// 測試結果
const testResult = ref(null);

const runTest = async () => {
    if (!query.value) return ElMessage.warning('請輸入測試問題喵！');
    loading.value = true;
    testResult.value = null;

    try {
        // 這裡對接妳即將寫好的後端測試路由
        const res = await axios.post('/api/admin_helper/rag_test', {
            query: query.value,
            m: params.m,
            ef: params.ef,
            k: params.k
        });
        testResult.value = res.data;
        ElMessage.success('檢索推論完成！');
    } catch (err) {
        ElMessage.error('實驗室連線異常喵...');
    } finally {
        loading.value = false;
    }
};

const saveLog = () => {
    ElMessage.success(`已儲存評分：${userScore.value} 分，數據已入庫！`);
};

onMounted(() => {
    // 這裡以後可以寫一個 setInterval 定期更新硬體數據
});
</script>

<template>
    <div class="sandbox-page">
        <div class="sandbox-layout">
            <header class="sandbox-header glass-panel">
                <div class="header-info">
                    <h1>🧪 B1 向量機房：效能沙盒</h1>
                    <p>RTX 4060 Ti 地端推論模式 | 專案 Codebase RAG 壓力測試</p>
                </div>
                <div class="header-btns">
                    <button class="nav-btn" @click="router.push('/LabDashboard')">🔙 返回大廳</button>
                </div>
            </header>

            <div class="content-grid">
                <aside class="side-panel glass-panel">
                    <h3 class="panel-title"><span class="icon">⚙️</span> HNSW 參數微調</h3>
                    
                    <div class="control-group">
                        <label>M (資料連線數): <span>{{ params.m }}</span></label>
                        <el-slider v-model="params.m" :min="16" :max="64" :step="8" />
                        <small>定義每個代碼碎片的鄰居數量，越高越精準但越佔顯存。</small>
                    </div>

                    <div class="control-group">
                        <label>ef_search (搜尋寬度): <span>{{ params.ef }}</span></label>
                        <el-slider v-model="params.ef" :min="10" :max="300" :step="10" />
                        <small>搜尋時的廣度。數值越高，越不容易漏掉深層關聯代碼。</small>
                    </div>

                    <div class="control-group">
                        <label>K (檢索片段數): <span>{{ params.k }}</span></label>
                        <el-slider v-model="params.k" :min="1" :max="10" />
                        <small>每次餵給 AI 的程式碼片段數量。</small>
                    </div>

                    <button class="action-btn run-btn" @click="runTest" :disabled="loading">
                        {{ loading ? '運算中...' : '執行實驗檢索 ⚡' }}
                    </button>
                </aside>

                <main class="main-test-area">
                    <div class="query-box glass-panel">
                        <textarea v-model="query" placeholder="輸入架構級問題... 例如：『如果我要在 adds 表新增一個地點欄位，前後端要怎麼改？』"></textarea>
                    </div>

                    <div v-if="testResult" class="result-display glass-panel animate-fade-in">
                        <div class="result-header">
                            <span class="status-tag">AI 建議輸出</span>
                            <div class="score-input">
                                <span>精準度打分：</span>
                                <el-rate v-model="userScore" @change="saveLog" />
                            </div>
                        </div>
                        <pre class="code-output">{{ testResult.ai_response }}</pre>
                    </div>
                </main>

                <aside class="side-panel glass-panel">
                    <h3 class="panel-title"><span class="icon">📊</span> 即時效能指標</h3>
                    
                    <div class="metric-card">
                        <div class="metric-label">檢索延遲 (Retrieval)</div>
                        <div class="metric-value cyan-text">{{ testResult?.retrieval_ms || '--' }} <small>ms</small></div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">推論速度 (TPS)</div>
                        <div class="metric-value green-text">{{ testResult?.tps || '--' }} <small>tokens/s</small></div>
                    </div>

                    <div class="hardware-box">
                        <h4 class="hw-title">🖥️ RTX 4060 Ti 狀態</h4>
                        <div class="hw-row">
                            <span>GPU 溫度</span>
                            <span :class="hw.temp > 60 ? 'warn' : 'normal'">{{ hw.temp }}°C</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill" :style="{width: hw.temp + '%'}"></div></div>
                        
                        <div class="hw-row">
                            <span>VRAM 佔用</span>
                            <span>{{ hw.vram }} MB</span>
                        </div>
                        <div class="progress-bar"><div class="progress-fill cyan-bg" :style="{width: (hw.vram/8192*100) + '%'}"></div></div>
                    </div>

                    <div class="chunks-info">
                        <p>B1 機房總筆數：<strong>3,452</strong></p>
                        <small v-if="3452 < 10000" class="safe">✅ 數據量適中，HNSW 預設值性能最佳。</small>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sandbox-page {
    min-height: 100vh;
    background: radial-gradient(circle at top center, #1e293b 0%, #080c14 100%);
    color: #e2e8f0;
    padding: 30px;
    font-family: 'Inter', sans-serif;
}
.glass-panel {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 20px;
}
.sandbox-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.sandbox-header h1 { font-size: 1.5rem; margin: 0; color: #00f2ff; text-shadow: 0 0 10px rgba(0,242,255,0.3); }
.content-grid { display: grid; grid-template-columns: 280px 1fr 280px; gap: 20px; align-items: start; }

/* 側邊欄與控制器 */
.side-panel { display: flex; flex-direction: column; gap: 20px; }
.panel-title { font-size: 1rem; margin: 0; color: #94a3b8; display: flex; align-items: center; gap: 8px; }
.control-group label { display: block; font-size: 0.9rem; margin-bottom: 8px; }
.control-group span { color: #00f2ff; font-weight: bold; float: right; }
.control-group small { display: block; color: #64748b; font-size: 0.75rem; margin-top: 5px; }

/* 主區域 */
.query-box textarea {
    width: 100%; height: 120px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px; color: white; padding: 15px; resize: none; font-size: 0.95rem;
}
.result-display { margin-top: 20px; }
.code-output {
    background: #0f172a; padding: 20px; border-radius: 12px; font-family: 'Fira Code', monospace;
    font-size: 0.85rem; line-height: 1.6; overflow-x: auto; color: #cbd5e1; border-left: 4px solid #a855f7;
}

/* 效能卡片 */
.metric-card { text-align: center; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 12px; }
.metric-value { font-size: 1.8rem; font-weight: 800; margin-top: 5px; }
.cyan-text { color: #22d3ee; }
.green-text { color: #34d399; }

/* 硬體狀態 */
.hardware-box { margin-top: 10px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 12px; }
.hw-title { font-size: 0.85rem; color: #94a3b8; margin-top: 0; }
.hw-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 5px; }
.progress-bar { height: 4px; background: #334155; border-radius: 2px; margin-bottom: 12px; overflow: hidden; }
.progress-fill { height: 100%; background: #f87171; transition: width 0.3s; }
.cyan-bg { background: #22d3ee; }

/* 按鈕 */
.run-btn {
    background: linear-gradient(135deg, #0ea5e9, #2563eb); color: white; border: none;
    padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.3s;
}
.run-btn:hover { transform: scale(1.02); box-shadow: 0 0 15px rgba(37,99,235,0.4); }
.nav-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 8px 15px; border-radius: 8px; cursor: pointer; }

.safe { color: #34d399; font-size: 0.75rem; }
.animate-fade-in { animation: fadeIn 0.5s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>