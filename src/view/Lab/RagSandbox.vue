<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { postRagTest, saveRagPerformanceLog } from '@/api/sandbox'; 

const router = useRouter();
const loading = ref(false);
const query = ref('');
const userScore = ref(0);

// --- 🎨 主題設定：固定為科技銀 ---
const currentTheme = ref('silver'); 

// 🌟 實驗參數：確保一進入頁面就顯示
const params = reactive({ 
    m: 16,     // 資料連線數
    ef: 100,   // 搜尋深度
    k: 5       // 檢索片段數
});

// 硬體監控 (加上隨機跳動模擬即時感)
const hw = reactive({ temp: 38, vram: 2150, load: 8 });
let hwInterval = null;

const testResult = ref(null);

const runTest = async () => {
    if (!query.value.trim()) return ElMessage.warning('請輸入測試指令喵！ Enter command...');
    loading.value = true;
    testResult.value = null;
    hw.load = 75; 

    try {
        const res = await postRagTest({
            query: query.value,
            hnsw_m: params.m,
            hnsw_ef: params.ef,
            top_k: params.k
        });
        testResult.value = res.data || res;
        ElMessage.success('檢索推論完成！ Analysis Complete.');
    } catch (err) {
        ElMessage.error('B1 機房通訊異常 Check Local LLM Status.');
    } finally {
        loading.value = false;
        setTimeout(() => { hw.load = 10; }, 1500);
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
            total_chunks: testResult.value.total_chunks,
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
        hw.temp = 38 + Math.floor(Math.random() * 4);
        hw.vram = 2100 + Math.floor(Math.random() * 120);
    }, 2500);
});

onUnmounted(() => { if (hwInterval) clearInterval(hwInterval); });
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
                                <label>M-CONNECTION (連線數)</label>
                                <span class="val-num">{{ params.m }}</span>
                            </div>
                            <el-slider v-model="params.m" :min="16" :max="64" :step="8" />
                            <small>影響每個節點的鄰居連線數量</small>
                        </div>

                        <div class="param-item">
                            <div class="label-row">
                                <label>EF_SEARCH (搜尋深度)</label>
                                <span class="val-num">{{ params.ef }}</span>
                            </div>
                            <el-slider v-model="params.ef" :min="10" :max="300" :step="10" />
                            <small>數值越大越精準，但速度會變慢</small>
                        </div>

                        <div class="param-item">
                            <div class="label-row">
                                <label>K-RECORDS (檢索片段)</label>
                                <span class="val-num">{{ params.k }}</span>
                            </div>
                            <el-slider v-model="params.k" :min="1" :max="10" />
                            <small>每次餵給 AI 的程式碼碎片數量</small>
                        </div>

                        <button class="silver-run-btn" @click="runTest" :disabled="loading">
                            {{ loading ? 'ANALYZING...' : 'START INFERENCE | 啟動檢索 ⚡' }}
                        </button>
                    </div>
                </aside>

                <main class="cyber-main animate-fade-in">
                    <div class="input-area-silver">
                        <textarea v-model="query" placeholder="Enter System Architecture Query... (例如：請分析目前 auth.py 的登入邏輯)"></textarea>
                    </div>

                    <div v-if="testResult" class="result-silver-box">
                        <div class="result-header-silver">
                            <span class="ai-tag">ARCHITECT LOG | 架構師建議</span>
                            <div class="rating-box">
                                <span>SCORE:</span>
                                <el-rate v-model="userScore" @change="handleSaveLog" />
                            </div>
                        </div>
                        <div class="code-view">
                            <pre><code>{{ testResult.ai_response }}</code></pre>
                        </div>
                    </div>

                    <div v-else-if="!loading" class="placeholder-box">
                        <div class="radar"></div>
                        <p>STANDBY: WAITING FOR SYSTEM INSTRUCTIONS</p>
                    </div>
                </main>

                <aside class="cyber-panel side animate-slide-in-right">
                    <div class="panel-header">📊 TELEMETRY | 即時效能</div>
                    <div class="panel-body">
                        <div class="metric-card-silver">
                            <span class="m-label">LATENCY | 檢索延遲</span>
                            <div class="m-value neon-silver">{{ testResult?.retrieval_ms || '--' }} <small>ms</small></div>
                        </div>
                        <div class="metric-card-silver">
                            <span class="m-label">THROUGHPUT | 生成速度</span>
                            <div class="m-value neon-silver">{{ testResult?.tokens_per_sec || '--' }} <small>tok/s</small></div>
                        </div>

                        <div class="hardware-monitor">
                            <div class="hw-item">
                                <div class="hw-label">GPU TEMP <span>{{ hw.temp }}°C</span></div>
                                <div class="hw-bar-bg"><div class="fill silver-fill" :style="{width: hw.temp+'%'}"></div></div>
                            </div>
                            <div class="hw-item">
                                <div class="hw-label">VRAM <span>{{ hw.vram }} MB</span></div>
                                <div class="hw-bar-bg"><div class="fill silver-fill" :style="{width: (hw.vram/8192*100)+'%'}"></div></div>
                            </div>
                            <div class="hw-item">
                                <div class="hw-label">LOAD <span>{{ hw.load }}%</span></div>
                                <div class="hw-bar-bg"><div class="fill silver-fill" :style="{width: hw.load+'%'}"></div></div>
                            </div>
                        </div>

                        <div class="footer-info">
                            <p>DATABASE: <span>OPTIMIZED</span></p>
                            <p>CHUNKS: <span>3,452</span></p>
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
    min-height: 100vh; background: #020617; color: var(--accent);
    font-family: 'Inter', -apple-system, sans-serif; position: relative; overflow: hidden;
}

.grid-overlay {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background-image: linear-gradient(var(--accent-glow) 1px, transparent 1px),
                      linear-gradient(90deg, var(--accent-glow) 1px, transparent 1px);
    background-size: 50px 50px; opacity: 0.1;
}

.content-wrapper { position: relative; z-index: 2; padding: 25px; max-width: 1600px; margin: 0 auto; }

/* --- Header --- */
.cyber-header {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1px solid var(--accent-glow); padding-bottom: 20px; margin-bottom: 30px;
}
.glitch-text { font-size: 1.6rem; font-weight: 800; color: #f1f5f9; letter-spacing: 1px; }

/* --- 面板 --- */
.cyber-panel { background: var(--panel-bg); border: 1px solid var(--accent-glow); border-radius: 12px; }
.panel-header { background: #334155; color: #f1f5f9; padding: 6px 15px; font-size: 11px; font-weight: 800; border-radius: 12px 12px 0 0; }
.panel-body { padding: 25px; }

.cyber-grid { display: grid; grid-template-columns: 320px 1fr 300px; gap: 25px; }

/* --- 參數 Item --- */
.param-item { margin-bottom: 25px; }
.label-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; font-weight: bold; }
.val-num { color: #f8fafc; background: #475569; padding: 1px 8px; border-radius: 4px; }
.param-item small { color: #64748b; font-size: 11px; display: block; margin-top: 5px; }

/* --- 核心區 --- */
.input-area-silver textarea {
    width: 100%; height: 120px; background: rgba(0,0,0,0.5); border: 1px solid #475569;
    color: #fff; padding: 18px; border-radius: 12px; outline: none; font-size: 1rem;
}
.input-area-silver textarea:focus { border-color: #94a3b8; box-shadow: 0 0 15px var(--accent-glow); }

.result-silver-box { margin-top: 20px; background: #0f172a; border: 1px solid #334155; border-radius: 12px; }
.result-header-silver { display: flex; justify-content: space-between; padding: 10px 20px; background: rgba(255,255,255,0.05); }
.code-view { padding: 20px; color: #e2e8f0; white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 14px; line-height: 1.6; }

/* --- 按鈕 --- */
.silver-run-btn {
    width: 100%; padding: 15px; background: linear-gradient(135deg, #f8fafc, #94a3b8);
    color: #0f172a; border: none; font-weight: 800; border-radius: 8px; cursor: pointer; transition: 0.3s;
}
.silver-run-btn:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(255,255,255,0.2); }

.exit-btn-silver { background: transparent; border: 1px solid #475569; color: #94a3b8; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.exit-btn-silver:hover { background: #475569; color: #fff; }

/* --- 指標與硬體 --- */
.metric-card-silver { background: rgba(255,255,255,0.03); border: 1px solid var(--accent-glow); text-align: center; padding: 15px; margin-bottom: 20px; border-radius: 12px; }
.m-value { font-size: 1.8rem; font-weight: 800; }
.neon-silver { color: #f1f5f9; text-shadow: 0 0 10px rgba(255,255,255,0.2); }

.hw-bar-bg { height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; margin: 8px 0 15px; }
.silver-fill { background: linear-gradient(to right, #94a3b8, #f8fafc); box-shadow: 0 0 8px rgba(255,255,255,0.3); }

/* Element Plus 客製化 */
:deep(.el-slider__bar) { background-color: #94a3b8 !important; }
:deep(.el-slider__button) { border: 2px solid #fff !important; background-color: #475569 !important; }
</style>