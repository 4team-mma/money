<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getTokenRadarSummary, getTokenRadarLogs } from '@/api/tokenRadar'; // 確保路徑正確

const router = useRouter();
const loading = ref(false);

// 篩選條件
const filters = reactive({
    date_range: 'today',
    provider: ''
});

// 存放後端回傳的資料
const summary = ref(null);
const logsData = ref({ logs: [], total: 0, page: 1, limit: 15 });

// 取得資料的函數
const fetchData = async () => {
    loading.value = true;
    try {
        // 同時發送 Summary 與 Logs 請求 (平行處理加速)
        const [summaryRes, logsRes] = await Promise.all([
            getTokenRadarSummary({ date_range: filters.date_range, provider: filters.provider }),
            getTokenRadarLogs({ 
                date_range: filters.date_range, 
                provider: filters.provider, 
                page: logsData.value.page, 
                limit: logsData.value.limit 
            })
        ]);
        
        summary.value = summaryRes.data || summaryRes;
        logsData.value = logsRes.data || logsRes;
    } catch (error) {
        console.error(error);
        ElMessage.error('雷達連線失敗，請確認後端伺服器狀態喵！');
    } finally {
        loading.value = false;
    }
};

// 切換分頁
const handlePageChange = (newPage) => {
    logsData.value.page = newPage;
    fetchData();
};

onMounted(() => {
    fetchData();
});
</script>

<template>
    <div class="radar-lab-light">
        <!-- 背景網格 -->
        <div class="light-grid-overlay"></div>

        <div class="content-wrapper">
            <!-- 標頭區塊 -->
            <header class="lab-header">
                <div class="brand">
                    <span class="icon-pulse">📡</span>
                    <span class="lab-title">TOKEN RADAR | API 消耗監測中心</span>
                    <div class="status-tag">
                        <span class="dot active"></span> SYSTEM ONLINE
                    </div>
                </div>
                <!-- 返回大廳按鈕 -->
                <button class="exit-btn-blue" @click="router.push('/LabDashboard')">
                    ⮌ EXIT | 返回大廳
                </button>
            </header>

            <!-- 篩選控制列 -->
            <div class="control-bar">
                <div class="filter-group">
                    <label>時間區間 :</label>
                    <select v-model="filters.date_range" @change="fetchData" class="light-select">
                        <option value="today">今日 (Today)</option>
                        <option value="week">本週 (This Week)</option>
                        <option value="month">本月 (This Month)</option>
                        <option value="all">全部 (All Time)</option>
                    </select>

                    <label>模型廠商 :</label>
                    <select v-model="filters.provider" @change="fetchData" class="light-select">
                        <option value="">全部 (All)</option>
                        <option value="groq">Groq (Llama)</option>
                        <option value="gemini">Google (Gemini)</option>
                        <option value="ollama">Ollama (地端)</option>
                    </select>
                </div>
                <button class="refresh-btn" @click="fetchData" :disabled="loading">
                    {{ loading ? 'SCANNING...' : '掃描更新 🔄' }}
                </button>
            </div>

            <!-- 載入中遮罩 -->
            <div v-if="loading && !summary" class="loading-state">
                <div class="spinner"></div>
                <p>正在攔截 Token 封包資料...</p>
            </div>

            <!-- 數據儀表板 -->
            <template v-if="summary">
                <div class="dashboard-grid">
                    
                    <!-- 左側：核心數據卡片 -->
                    <div class="stats-container">
                        <div class="stat-card blue-glow">
                            <div class="stat-title">總消耗 Token (區間)</div>
                            <div class="stat-value">{{ summary.period_tokens.toLocaleString() }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-title">API 請求總數</div>
                            <div class="stat-value">{{ summary.period_requests.toLocaleString() }} <small>次</small></div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-title">平均每次消耗</div>
                            <div class="stat-value">{{ summary.avg_tokens_per_req.toLocaleString() }}</div>
                        </div>
                        <div class="stat-card warning-glow">
                            <div class="stat-title">單次最高爆量</div>
                            <div class="stat-value text-red">{{ summary.max_single_tokens.toLocaleString() }}</div>
                            <div class="stat-subtitle" v-if="summary.max_single_intent">
                                兇手意圖: [{{ summary.max_single_intent }}]
                            </div>
                        </div>
                    </div>

                    <!-- 右側：額度預警與分布 -->
                    <div class="insight-container">
                        <div class="insight-card">
                            <h3>📊 廠商用量預警 (本月)</h3>
                            <div v-for="quota in summary.quota_warnings" :key="quota.provider" class="quota-item">
                                <div class="quota-info">
                                    <span class="provider-name">{{ quota.provider.toUpperCase() }}</span>
                                    <span class="quota-nums">{{ quota.used.toLocaleString() }} / {{ quota.limit.toLocaleString() }}</span>
                                </div>
                                <div class="quota-bar-bg">
                                    <div class="quota-bar-fill" 
                                        :class="{'danger-fill': quota.pct > 80, 'warning-fill': quota.pct > 50}"
                                        :style="{ width: Math.min(quota.pct, 100) + '%' }">
                                    </div>
                                </div>
                                <div class="quota-pct">{{ quota.pct }}%</div>
                            </div>
                        </div>

                        <div class="insight-card">
                            <h3>🎯 最耗 Token 的意圖 (TOP 5)</h3>
                            <div class="intent-list">
                                <div v-for="(intent, index) in summary.by_intent.slice(0, 5)" :key="intent.intent_type" class="intent-item">
                                    <span class="rank-badge">#{{ index + 1 }}</span>
                                    <span class="intent-name">{{ intent.intent_type }}</span>
                                    <span class="intent-pct">{{ intent.pct }}% ({{ intent.tokens.toLocaleString() }})</span>
                                </div>
                                <div v-if="summary.by_intent.length === 0" class="empty-text">尚無數據</div>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- 下方：詳細流水帳 (Logs) -->
                <div class="logs-section">
                    <h3>📝 即時封包監聽紀錄 (Live Logs)</h3>
                    <div class="table-container">
                        <table class="light-table">
                            <thead>
                                <tr>
                                    <th>時間</th>
                                    <th>廠商</th>
                                    <th>意圖判定</th>
                                    <th>耗損 Token</th>
                                    <th>延遲 (ms)</th>
                                    <th>請求內容截錄 (Snippet)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="log in logsData.logs" :key="log.log_id">
                                    <td class="time-col">{{ new Date(log.created_at).toLocaleString() }}</td>
                                    <td><span :class="['tag-provider', log.provider]">{{ log.provider }}</span></td>
                                    <td><span class="tag-intent">{{ log.intent_type }}</span></td>
                                    <td class="font-bold">{{ log.total_tokens.toLocaleString() }}</td>
                                    <td>{{ log.latency_ms || '--' }}</td>
                                    <td class="snippet-col">{{ log.request_snippet || '無紀錄' }}</td>
                                </tr>
                                <tr v-if="logsData.logs.length === 0">
                                    <td colspan="6" class="empty-table">目前沒有任何連線紀錄喵~</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- 分頁控制 -->
                    <div class="pagination" v-if="logsData.total > logsData.limit">
                        <button :disabled="logsData.page === 1" @click="handlePageChange(logsData.page - 1)">上一頁</button>
                        <span>第 {{ logsData.page }} 頁 / 共 {{ Math.ceil(logsData.total / logsData.limit) }} 頁</span>
                        <button :disabled="logsData.page >= Math.ceil(logsData.total / logsData.limit)" @click="handlePageChange(logsData.page + 1)">下一頁</button>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
/* =========================================
   🎨 科技冰藍明亮主題 (Ice Blue & Silver)
========================================= */
.radar-lab-light {
    min-height: 100vh;
    background: #f1f5f9; /* 亮灰白背景 */
    color: #1e293b;      /* 深灰藍文字 */
    font-family: 'Inter', -apple-system, sans-serif;
    position: relative;
    overflow-x: hidden;
}

/* 明亮版網格背景 */
.light-grid-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: 
        linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    z-index: 0;
    pointer-events: none;
}

.content-wrapper {
    position: relative;
    z-index: 1;
    padding: 30px;
    max-width: 1400px;
    margin: 0 auto;
}

/* --- Header --- */
.lab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    padding: 15px 25px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    margin-bottom: 25px;
}

.brand {
    display: flex;
    align-items: center;
    gap: 15px;
}

.lab-title {
    font-size: 1.4rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.5px;
}

.status-tag {
    background: #eff6ff;
    color: #2563eb;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #bfdbfe;
}

.dot.active {
    width: 8px; height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    box-shadow: 0 0 8px #3b82f6;
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.8; }
}

/* 返回按鈕 */
.exit-btn-blue {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
    padding: 8px 18px;
    border-radius: 8px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.3s;
}

.exit-btn-blue:hover {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

/* --- 控制列 (Filters) --- */
.control-bar {
    display: flex;
    justify-content: space-between;
    margin-bottom: 25px;
    align-items: center;
}

.filter-group {
    display: flex;
    gap: 15px;
    align-items: center;
    background: #ffffff;
    padding: 10px 20px;
    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
    border: 1px solid #e2e8f0;
    font-weight: bold;
    color: #475569;
}

.light-select {
    padding: 6px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    color: #1e293b;
    outline: none;
    cursor: pointer;
}

.refresh-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    transition: 0.2s;
}

.refresh-btn:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-2px);
}

/* --- 核心數據 Grid --- */
.dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    margin-bottom: 30px;
}

.stats-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.stat-card {
    background: #ffffff;
    padding: 25px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.stat-card.blue-glow { border-bottom: 4px solid #3b82f6; }
.stat-card.warning-glow { border-bottom: 4px solid #ef4444; }

.stat-title {
    font-size: 0.9rem;
    color: #64748b;
    font-weight: 700;
    margin-bottom: 10px;
}

.stat-value {
    font-size: 2.2rem;
    font-weight: 900;
    color: #0f172a;
}
.stat-value.text-red { color: #ef4444; }
.stat-subtitle { font-size: 0.8rem; color: #94a3b8; margin-top: 5px;}

/* 右側圖表區 */
.insight-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.insight-card {
    background: #ffffff;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}

.insight-card h3 {
    margin: 0 0 15px 0;
    font-size: 1.1rem;
    color: #334155;
}

/* 預警進度條 */
.quota-item { margin-bottom: 15px; }
.quota-info { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold; margin-bottom: 5px;}
.provider-name { color: #475569; }
.quota-bar-bg { width: 100%; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
.quota-bar-fill { height: 100%; background: #3b82f6; transition: width 0.5s ease; }
.quota-bar-fill.warning-fill { background: #f59e0b; }
.quota-bar-fill.danger-fill { background: #ef4444; }
.quota-pct { text-align: right; font-size: 0.75rem; color: #94a3b8; margin-top: 3px;}

/* 意圖排行 */
.intent-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px; background: #f8fafc; border-radius: 8px; margin-bottom: 8px;
}
.rank-badge { background: #3b82f6; color: white; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: bold;}
.intent-name { flex-grow: 1; font-weight: bold; color: #1e293b; }
.intent-pct { color: #64748b; font-size: 0.85rem; }

/* --- 表格區塊 --- */
.logs-section {
    background: #ffffff;
    padding: 25px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
}
.logs-section h3 { margin-top: 0; color: #334155; }

.table-container { overflow-x: auto; }
.light-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.light-table th { background: #f1f5f9; padding: 12px 15px; color: #475569; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
.light-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; color: #334155; }
.light-table tr:hover { background: #f8fafc; }

.time-col { color: #94a3b8; font-size: 0.85rem; }
.snippet-col { max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: monospace; color: #64748b; }
.font-bold { font-weight: bold; color: #0f172a; }

/* 標籤徽章 */
.tag-provider { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; }
.tag-provider.groq { background: #fce7f3; color: #2563eb; }
.tag-provider.gemini { background: #fef3c7; color: #d97706; }
.tag-provider.ollama { background: #dcfce3; color: #059669; }

.tag-intent { background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; }

/* 分頁 */
.pagination { display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px; font-weight: bold; color: #64748b;}
.pagination button { padding: 6px 15px; border: 1px solid #cbd5e1; background: white; border-radius: 6px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination button:hover:not(:disabled) { background: #f1f5f9; }

/* 載入中 */
.loading-state { text-align: center; padding: 40px; color: #64748b; font-weight: bold;}
.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
@keyframes spin { to { transform: rotate(360deg); } }
.empty-table { text-align: center; color: #94a3b8; padding: 30px !important; }
</style>