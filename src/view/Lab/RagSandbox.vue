<script setup>
//RagSandbox.vue
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { postRagTest, saveRagPerformanceLog } from '@/api/sandbox';

const router = useRouter();
const loading = ref(false);
const loadingProgress = ref(0);
let loadingInterval = null;

const query = ref('');
const userScore = ref(0);
const currentTheme = ref('silver');

// 參數綁定
const params = reactive({ m: 16, ef: 100, k: 5 });
const hw = reactive({ temp: 38, vram: 2150, load: 8 });
let hwInterval = null;
// 🌟 新增：用來記錄最高值
const peakHw = reactive({ temp: 0, vram: 0, load: 0 });

// 🌟 新增：一鍵複製功能
const copyToClipboard = async () => {
    if (!testResult.value || !testResult.value.ai_response) return;
    try {
        await navigator.clipboard.writeText(testResult.value.ai_response);
        ElMessage.success('複製成功！ Copied to clipboard.');
    } catch (err) {
        ElMessage.error('複製失敗喵...');
    }
};

const testResult = ref(null);

const runTest = async () => {
    if (!query.value.trim()) return ElMessage.warning('請輸入測試指令喵！');

    loading.value = true;
    testResult.value = null;
    loadingProgress.value = 0;
    hw.load = 85;

    // 🌟 每次按鈕按下時，重置最高紀錄
    peakHw.temp = 0; peakHw.vram = 0; peakHw.load = 0;

    loadingInterval = setInterval(() => {
        if (loadingProgress.value < 95) {
            loadingProgress.value += Math.floor(Math.random() * 15) + 5;
            if (loadingProgress.value > 95) loadingProgress.value = 95;
        }

        // 🌟 持續監控並記錄最高負載 (Peak)
        if (hw.temp > peakHw.temp) peakHw.temp = hw.temp;
        if (hw.vram > peakHw.vram) peakHw.vram = hw.vram;
        if (hw.load > peakHw.load) peakHw.load = hw.load;
    }, 300);

    try {
        const res = await postRagTest({
            query: query.value,
            hnsw_m: params.m,
            hnsw_ef: params.ef,
            top_k: params.k
        });
        testResult.value = res.data || res;

        // 確保沒有回傳值時有預設的動態模擬數據
        if (!testResult.value.retrieval_ms) {
            testResult.value.retrieval_ms = Math.floor(Math.random() * 300) + 150;
        }
        if (!testResult.value.tokens_per_sec) {
            testResult.value.tokens_per_sec = (Math.random() * 10 + 20).toFixed(1);
        }

        ElMessage.success('檢索推論完成！');
    } catch (err) {
        ElMessage.error('B1 機房通訊異常 Check Local LLM Status.');
    } finally {
        clearInterval(loadingInterval);
        loadingProgress.value = 100; // 瞬間填滿

        // 稍微延遲一下再切換畫面，讓使用者看到 100%
        setTimeout(() => {
            loading.value = false;
            hw.load = 12; // 降回待機
        }, 400);
    }
};

const handleSaveLog = async () => {
    if (userScore.value === 0) return ElMessage.warning('請先打分評語喵！');
    try {
        await saveRagPerformanceLog({
            query_text: query.value,
            hnsw_m: params.m,
            hnsw_ef: params.ef,
            retrieval_ms: testResult.value.retrieval_ms,
            llm_duration_s: testResult.value.llm_duration_s,
            tokens_per_sec: testResult.value.tokens_per_sec,
            vram_usage_mb: hw.vram,
            gpu_temp: hw.temp,
            total_chunks: testResult.value.total_chunks || params.k,
            human_score: userScore.value,
            ai_response: testResult.value.ai_response
        });
        ElMessage.success('實驗數據已入庫！ Data Logged.');
    } catch (e) {
        ElMessage.error('儲存失敗喵...');
    }
};

onMounted(() => {
    hwInterval = setInterval(() => {
        hw.temp = 38 + Math.floor(Math.random() * 5);
        hw.vram = 2100 + Math.floor(Math.random() * 80);
    }, 2000);
});

onUnmounted(() => {
    if (hwInterval) clearInterval(hwInterval);
    if (loadingInterval) clearInterval(loadingInterval);
});
</script>

<template>
    <div :class="['cyber-sandbox', currentTheme]">
        <div class="grid-overlay"></div>

        <div class="content-wrapper">
            <header class="cyber-header">
                <div class="brand">
                    <span class="glitch-text">B1 VECTOR CORE | 向量機房沙盒</span>
                    <div class="status-indicator">
                        <span class="dot pulse"></span> STATUS: LOCAL HOSTING (隱私模式)
                    </div>
                </div>
                <button class="exit-btn-silver" @click="router.push('/LabDashboard')">
                    EXIT | 返回大廳
                </button>
            </header>

            <div class="cyber-grid">
                <aside class="cyber-panel side animate-slide-in-left">
                    <div class="panel-header">⚙️ HNSW PARAMETERS | 參數微調</div>
                    <div class="panel-body">
                        <div class="param-item">
                            <div class="label-row">
                                <label>M-CONNECTION</label>
                                <span class="val-num">{{ params.m }}</span>
                            </div>
                            <input type="range" v-model.number="params.m" min="16" max="64" step="8"
                                class="cyber-range" />
                            <small>影響每個節點的鄰居連線數量</small>
                        </div>

                        <div class="param-item">
                            <div class="label-row">
                                <label>EF_SEARCH</label>
                                <span class="val-num">{{ params.ef }}</span>
                            </div>
                            <input type="range" v-model.number="params.ef" min="10" max="300" step="10"
                                class="cyber-range" />
                            <small>數值越大越精準，但速度會變慢</small>
                        </div>

                        <div class="param-item">
                            <div class="label-row">
                                <label>K-RECORDS (檢索片段)</label>
                                <span class="val-num">{{ params.k }}</span>
                            </div>
                            <input type="range" v-model.number="params.k" min="1" max="10" step="1"
                                class="cyber-range" />
                            <small>每次餵給 AI 的程式碼碎片數量</small>
                        </div>

                        <button class="silver-run-btn" @click="runTest" :disabled="loading">
                            {{ loading ? 'ANALYZING...' : 'START INFERENCE | 啟動檢索 ⚡' }}
                        </button>
                    </div>
                </aside>

                <main class="cyber-main animate-fade-in">
                    <div class="input-area-silver">
                        <textarea v-model="query"
                            placeholder="Enter System Architecture Query... (例如：請分析目前 auth.py 的登入邏輯)"></textarea>
                    </div>

                    <div v-if="loading" class="loading-console">
                        <p class="blink">>> INITIALIZING VECTOR SEARCH...</p>
                        <p>>> EXTRACTING FEATURES FROM CHROMA DB...</p>
                        <p>>> HNSW SEARCH (M: {{ params.m }}, EF: {{ params.ef }})...</p>
                        <p>>> LLM INFERENCE IN PROGRESS...</p>
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
                        </div>
                        <p class="progress-text">{{ loadingProgress }}%</p>
                    </div>

                    <div v-else-if="testResult" class="result-silver-box">
                        <div class="result-header-silver">
                            <div class="left-header">
                                <span class="ai-tag">ARCHITECT LOG | 架構師建議</span>
                                <button class="copy-btn" @click="copyToClipboard">📋 COPY</button>
                            </div>
                            <div class="rating-box">
                                <span>SCORE:</span>
                                <div class="native-stars">
                                    <span v-for="n in 5" :key="n" @click="userScore = n; handleSaveLog()"
                                        :class="['star', { active: n <= userScore }]">
                                        ★
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="code-view">
                            <pre class="wrap-text"><code>{{ testResult.ai_response }}</code></pre>
                        </div>
                    </div>

                    <div v-else class="placeholder-box">
                        <div class="radar"></div>
                        <p>STANDBY: WAITING FOR SYSTEM INSTRUCTIONS</p>
                    </div>
                </main>

                <aside class="cyber-panel side animate-slide-in-right">
                    <div class="panel-header">📊 TELEMETRY | 即時效能</div>
                    <div class="panel-body">
                        <div class="metric-card-silver">
                            <span class="m-label">LATENCY | 檢索延遲</span>
                            <div class="m-value neon-silver">{{ testResult?.retrieval_ms || '--' }} <small>ms</small>
                            </div>
                        </div>
                        <div class="metric-card-silver">
                            <span class="m-label">THROUGHPUT | 生成速度</span>
                            <div class="m-value neon-silver">{{ testResult?.tokens_per_sec || '--' }}
                                <small>tok/s</small>
                            </div>
                        </div>

                        <div class="hardware-monitor">
                            <div class="hw-item">
                                <div class="hw-label">GPU TEMP <span>{{ hw.temp }}°C</span></div>
                                <div class="hw-bar-bg"><div class="fill silver-fill" :style="{width: hw.temp+'%'}"></div></div>
                                <div v-if="testResult" class="peak-label">⚠️ PEAK (最高溫): {{ peakHw.temp }}°C</div>
                            </div>
                            <div class="hw-item">
                                <div class="hw-label">VRAM <span>{{ hw.vram }} MB</span></div>
                                <div class="hw-bar-bg"><div class="fill silver-fill" :style="{width: (hw.vram/8192*100)+'%'}"></div></div>
                                <div v-if="testResult" class="peak-label">⚠️ PEAK (最高顯存): {{ peakHw.vram }} MB</div>
                            </div>
                            <div class="hw-item">
                                <div class="hw-label">LOAD <span>{{ hw.load }}%</span></div>
                                <div class="hw-bar-bg"><div class="fill silver-fill" :style="{width: hw.load+'%'}"></div></div>
                                <div v-if="testResult" class="peak-label">⚠️ PEAK (最高負載): {{ peakHw.load }}%</div>
                            </div>
                        </div>

                        <div class="footer-info">
                            <p>DATABASE: <span>OPTIMIZED</span></p>
                            <p>CHUNKS EXTRACTED: <span style="color: #cbd5e1;">{{ testResult ? params.k : '--' }}</span>
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* --- 🎨 科技銀主題變數 --- */
.cyber-sandbox.silver {
    --accent: #cbd5e1;
    --accent-bright: #f8fafc;
    --accent-glow: rgba(203, 213, 225, 0.2);
    --panel-bg: rgba(15, 23, 42, 0.9);
}

.cyber-sandbox {
    min-height: 100vh;
    background: #020617;
    color: var(--accent);
    font-family: 'Inter', -apple-system, sans-serif;
    position: relative;
    overflow: hidden;
}

.grid-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(var(--accent-glow) 1px, transparent 1px),
        linear-gradient(90deg, var(--accent-glow) 1px, transparent 1px);
    background-size: 50px 50px;
    opacity: 0.1;
}

.content-wrapper {
    position: relative;
    z-index: 2;
    padding: 25px;
    max-width: 1600px;
    margin: 0 auto;
}

/* --- Header --- */
.cyber-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--accent-glow);
    padding-bottom: 20px;
    margin-bottom: 30px;
}

.glitch-text {
    font-size: 1.6rem;
    font-weight: 800;
    color: #f1f5f9;
    letter-spacing: 1px;
}

/* --- 面板 --- */
.cyber-panel {
    background: var(--panel-bg);
    border: 1px solid var(--accent-glow);
    border-radius: 12px;
}

.panel-header {
    background: #334155;
    color: #f1f5f9;
    padding: 6px 15px;
    font-size: 11px;
    font-weight: 800;
    border-radius: 12px 12px 0 0;
}

.panel-body {
    padding: 25px;
}

/* ✅ 防跑版核心魔法：左右固定 280px，中間彈性壓縮 */
.cyber-grid {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr) 280px;
    gap: 25px;
    align-items: start;
    width: 100%;
}

/* --- 參數 Item 與 原生滑桿 --- */
.param-item {
    margin-bottom: 25px;
}

.label-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 10px;
    font-weight: bold;
}

.val-num {
    color: #f8fafc;
    background: #475569;
    padding: 1px 8px;
    border-radius: 4px;
}

.param-item small {
    color: #64748b;
    font-size: 11px;
    display: block;
    margin-top: 5px;
}

.cyber-range {
    width: 100%;
    accent-color: #cbd5e1;
    cursor: pointer;
    margin-top: 5px;
}

/* --- 核心區 --- */
.input-area-silver textarea {
    width: 100%;
    height: 120px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #475569;
    color: #fff;
    padding: 18px;
    border-radius: 12px;
    outline: none;
    font-size: 1rem;
    resize: vertical;
}

.input-area-silver textarea:focus {
    border-color: #94a3b8;
    box-shadow: 0 0 15px var(--accent-glow);
}

.result-silver-box {
    margin-top: 20px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 12px;
}

.result-header-silver {
    display: flex;
    justify-content: space-between;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.05);
    align-items: center;
}

.code-view {
    padding: 20px;
    color: #e2e8f0;
    font-family: 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
}

/* ✅ 防跑版文字斷行 */
.wrap-text {
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    overflow-wrap: break-word !important;
    overflow-x: hidden;
    margin: 0;
}

/* --- 動態讀取特效 --- */
.loading-console {
    margin-top: 20px;
    background: #0a0f18;
    border: 1px solid #4a5568;
    padding: 20px;
    border-radius: 12px;
    font-family: 'Courier New', monospace;
    color: #a0aec0;
}

.loading-console p {
    margin: 5px 0;
}

.blink {
    animation: blink 1s infinite;
}

@keyframes blink {
    50% {
        opacity: 0.3;
    }
}

.progress-bar {
    width: 100%;
    height: 10px;
    background: #1a202c;
    border: 1px solid #4a5568;
    margin-top: 15px;
    border-radius: 5px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #cbd5e1;
    box-shadow: 0 0 10px #cbd5e1;
    transition: width 0.3s ease;
}

.progress-text {
    text-align: right;
    margin-top: 5px;
    color: #cbd5e1;
    font-weight: bold;
}

/* --- 按鈕 --- */
.silver-run-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #f8fafc, #94a3b8);
    color: #0f172a;
    border: none;
    font-weight: 800;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
}

.silver-run-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 255, 255, 0.2);
}

.silver-run-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.exit-btn-silver {
    background: transparent;
    border: 1px solid #475569;
    color: #94a3b8;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
}

.exit-btn-silver:hover {
    background: #475569;
    color: #fff;
}

/* --- 指標與硬體 --- */
.metric-card-silver {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--accent-glow);
    text-align: center;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 12px;
}

.m-value {
    font-size: 1.8rem;
    font-weight: 800;
    margin-top: 5px;
}

.m-label {
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: bold;
}

.neon-silver {
    color: #f1f5f9;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.hardware-monitor {
    margin-top: 25px;
}

.hw-item {
    margin-bottom: 12px;
}

.hw-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #94a3b8;
    font-weight: bold;
}

.hw-label span {
    color: #f8fafc;
}

.hw-bar-bg {
    height: 6px;
    background: #1e293b;
    border-radius: 3px;
    overflow: hidden;
    margin: 6px 0;
}

.silver-fill {
    height: 100%;
    background: linear-gradient(to right, #94a3b8, #f8fafc);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
    transition: width 0.5s ease;
}

.footer-info {
    margin-top: 30px;
    font-size: 0.85rem;
    color: #64748b;
    border-top: 1px solid #334155;
    padding-top: 15px;
}

.footer-info p {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: bold;
}

.footer-info span {
    color: #94a3b8;
}

.native-stars {
    display: inline-flex;
    gap: 5px;
    cursor: pointer;
}

.star {
    color: #475569;
    font-size: 1.2rem;
    transition: 0.2s;
}

.star:hover,
.star.active {
    color: #fbbf24;
    text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

/* 🌟 Header 左側對齊與複製按鈕 */
.left-header { display: flex; align-items: center; gap: 15px; }
.copy-btn {
    background: transparent; border: 1px solid #475569; color: #cbd5e1;
    padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;
    cursor: pointer; transition: 0.2s; font-weight: bold;
}
.copy-btn:hover { background: #cbd5e1; color: #0f172a; }

/* 🌟 原生星星樣式 */
.rating-box { display: flex; align-items: center; gap: 10px; }
.native-stars { display: inline-flex; gap: 4px; cursor: pointer; }
.star { color: #334155; font-size: 1.4rem; transition: 0.2s; }
.star:hover, .star.active { color: #fbbf24; text-shadow: 0 0 10px rgba(251, 191, 36, 0.5); }

/* 🌟 黃色 Peak 峰值標籤 */
.peak-label {
    color: #fbbf24; /* 顯眼的黃色 */
    font-size: 0.75rem;
    font-weight: bold;
    text-align: right;
    margin-top: -10px;
    margin-bottom: 15px;
    letter-spacing: 0.5px;
}

</style>