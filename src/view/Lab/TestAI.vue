<script setup>
/**
 * 邱比特大腦：意圖識別 A/B 測試擂台 (三強對決版)
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
    compareAiIntents,
    runAiBatchTest,
    uploadAiTestExcel,
    clearAiTestFile,
    updateCorrectedIntent,
    saveEngineerCorrection
} from '@/api/robot';
import { ElMessage } from 'element-plus';

const router = useRouter();
const testMessage = ref('');
const loading = ref(false);
const singleResult = ref(null); // 預期後端回傳 { legacy, v1_ai, v2_ai, review_id }
const batchLoading = ref(false);
const batchReport = ref(null);
const hasCustomFile = ref(false);
const onlyShowErrors = ref(false);
const intentOptions = ['RECORD', 'QUERY', 'CHAT', 'ADVISOR', 'KNOWLEDGE', 'MULTI_RECORD', 'MULTI_QUERY', 'MULTI_ADVISOR', 'MULTI_KNOWLEDGE'];
const singleCorrection = ref('');
const showSingleCorrection = ref(false);

const filteredBatchDetails = computed(() => {
    if (!batchReport.value) return [];
    if (onlyShowErrors.value) {
        // 只要 V2 沒有拿滿分 (1.0)，就視為需要檢視的錯誤/瑕疵
        return batchReport.value.details.filter(item => item.v2_score < 1.0);
    }
    return batchReport.value.details;
});

const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('currentUser');
    ElMessage.success('已安全登出喵！');
    router.push('/');
};

// 單句對比測試
const runSingleTest = async () => {
    if (!testMessage.value.trim()) return;
    loading.value = true;
    try {
        const res = await compareAiIntents(testMessage.value);
        singleResult.value = res.data || res;

        // 預設將 V2 的答案作為修正參考
        singleCorrection.value = singleResult.value.v2_ai.intent;
        showSingleCorrection.value = true;

        ElMessage.success('對比完成喵！');
    } catch (err) {
        ElMessage.error('伺服器開小差了喵...');
    } finally {
        loading.value = false;
    }
};

// 儲存單句修正
const saveSingleCorrection = async () => {
    try {
        if (!singleResult.value.review_id) {
            ElMessage.warning('後端尚未回傳 review_id！');
            return;
        }
        await updateCorrectedIntent(singleResult.value.review_id, singleCorrection.value);
        showSingleCorrection.value = false;
        ElMessage.success('✅ 已成功將修正寫入資料庫！');
    } catch (err) {
        ElMessage.error('修正失敗，請確認 API 是否正確。');
    }
};

// 批次掃描測試
const runBatchTest = async () => {
    batchLoading.value = true;
    try {
        const res = await runAiBatchTest();
        batchReport.value = res.data || res;
        ElMessage.success(`批次分析完成！V2 總得分率 ${(batchReport.value.v2_accuracy * 100).toFixed(1)}%`);
    } catch (err) {
        ElMessage.error('批次測試失敗：請檢查後端 temp/excel 資料夾');
    } finally {
        batchLoading.value = false;
    }
};

// 儲存批次修正 (使用工程師直通車 API)
const saveCorrection = async (item) => {
    if (!item.correction) {
        ElMessage.warning('請先選擇修正後的意圖！');
        return;
    }

    try {
        // 打包送給直通車 API
        await saveEngineerCorrection({
            user_message: item.text,
            predicted_intent: item.v2_pred,
            corrected_intent: item.correction,
            confidence_score: item.v2_score
        });

        item.v2_score = true;
        ElMessage.success('✅ 已成功將修正寫入 MySQL 與語意資料庫！');
    } catch (err) {
        ElMessage.error('修正入庫失敗。');
    }
};

const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
        await uploadAiTestExcel(formData);
        hasCustomFile.value = true;
        ElMessage.success('自定義題庫上傳成功');
    } catch (err) { ElMessage.error('上傳失敗'); }
};

const clearTempFile = async () => {
    try {
        await clearAiTestFile();
        hasCustomFile.value = false;
        batchReport.value = null;
        ElMessage.success('已清空並恢復預設');
    } catch (err) { ElMessage.error('清空失敗'); }
};

const getConfidenceColor = (score) => {
    if (score > 0.9) return '#10b981';
    if (score > 0.7) return '#f59e0b';
    return '#ef4444';
};

// 視覺化加權分數
const renderScore = (score) => {
    if (score === 1.0) return '🎯 完美 (1.0)';
    if (score === 0.5) return '🥈 懂一半 (0.5)';
    if (score === 0.3) return '🥉 沾邊 (0.3)';
    return '❌ 離譜 (0.0)';
};
</script>

<template>
    <div class="mma-lab-page">
        <div class="mma-lab-content">
            <header class="mma-lab-header">
                <div class="header-main">
                    <div class="brand-box">
                        <div class="icon-wrapper purple-glow-icon">
                            <span class="sparkle">🧠</span>
                        </div>
                        <div class="brand-text">
                            <h1>大腦競技場：V1 vs V2 對決</h1>
                            <p>傳統 Regex vs 純 ONNX 模型 vs <strong>混合語意路由器</strong></p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="nav-btn" @click="router.push('/LabDashboard')">
                            <span class="btn-icon">🔙</span> 返回大廳
                        </button>
                        <button class="nav-btn danger-hover" @click="handleLogout">
                            🚪 登出
                        </button>
                    </div>
                </div>

                <div class="header-stats glass-panel" v-if="batchReport">
                    <div class="stat-unit">
                        <span class="label">樣本總數</span>
                        <span class="val cyan-text">{{ batchReport.total }}</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-unit">
                        <span class="label">V1 舊版得分率</span>
                        <span class="val orange-text">{{ (batchReport.v1_accuracy * 100).toFixed(1) }}%</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-unit">
                        <span class="label">V2 旗艦版得分率</span>
                        <span class="val" :class="batchReport.v2_accuracy >= 0.9 ? 'green-text' : 'orange-text'">
                            {{ (batchReport.v2_accuracy * 100).toFixed(1) }}%
                        </span>
                    </div>
                </div>
            </header>

            <section class="arena-section">
                <div class="search-group glass-panel">
                    <input class="dark-input" v-model="testMessage" placeholder="請輸入測試語句，按 Enter 發動進攻..." @keyup.enter="runSingleTest" />
                    <button class="tech-btn primary-btn" @click="runSingleTest" :disabled="loading">
                        {{ loading ? '掃描運算中... ⏳' : '發動三方對比 ⚡' }}
                    </button>
                </div>

                <div class="battle-arena" v-if="singleResult">
                    
                    <div class="arena-card legacy-card">
                        <div class="card-title"><span class="icon">🏠</span> 傳統喵喵 (Regex)</div>
                        <div class="result-box">{{ singleResult.legacy.intent }}</div>
                        <div class="ai-reply-box">
                            <span class="reply-label">💬 喵喵回覆：</span>
                            <div class="reply-content">{{ singleResult.legacy.response || '（無回覆內容）' }}</div>
                        </div>
                    </div>

                    <div class="vs-divider">VS</div>

                    <div class="arena-card v1-card">
                        <div class="card-title"><span class="icon">🧠</span> V1 舊大腦 (ONNX)</div>
                        <div class="result-box">{{ singleResult.v1_ai.intent }}</div>
                        <div class="conf-info">
                            信心：<b class="orange-text">{{ (singleResult.v1_ai.confidence * 100).toFixed(1) }}%</b>
                        </div>
                        <div class="ai-reply-box">
                            <span class="reply-label">💬 V1 模擬回覆：</span>
                            <div class="reply-content">（V1 不產生對話回覆以節省資源）</div>
                        </div>
                    </div>

                    <div class="vs-divider">VS</div>

                    <div class="arena-card v2-card">
                        <div class="card-glow"></div>
                        <div class="card-title relative-z"><span class="icon">✨</span> V2 旗艦大腦 (混合路由)</div>
                        <div class="result-box highlight relative-z">{{ singleResult.v2_ai.intent }}</div>
                        <div class="conf-info relative-z">
                            <span v-if="singleResult.v2_ai.is_intercepted" class="intercept-text">
                                🛡️ ChromaDB 攔截
                            </span>
                            <span v-else>信心：<b class="blue-text">{{ (singleResult.v2_ai.confidence * 100).toFixed(1) }}%</b></span>
                        </div>
                        <div class="ai-reply-box mixai-reply relative-z">
                            <span class="reply-label">💬 V2 真實說法：</span>
                            <div class="reply-content">{{ singleResult.v2_ai.response || '（生成失敗）' }}</div>
                        </div>
                    </div>
                </div>

                <div class="single-correction-box glass-panel" v-if="singleResult && showSingleCorrection">
                    <span>🤖 邱比特大腦 V2 表現得如何？</span>
                    <button class="tech-btn outline-btn" @click="showSingleCorrection = false">✅ 判斷正確</button>
                    <span class="divider-line">|</span>
                    <span>強制糾正為：</span>
                    <select v-model="singleCorrection" class="dark-select">
                        <option v-for="opt in intentOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <button class="tech-btn purple-btn" @click="saveSingleCorrection">💾 儲存修正入庫</button>
                </div>
            </section>

            <section class="batch-section glass-panel">
                <div class="section-title-row">
                    <h2>📊 批次盲測與加權報告</h2>
                    <div class="title-actions">
                        <div class="action-group">
                            <span v-if="hasCustomFile" class="custom-file-badge">📁 已載入自定義題庫</span>
                            <button class="tech-btn outline-btn" @click="$refs.fileInput.click()">📤 上傳盲測題庫</button>
                            <button v-if="hasCustomFile" class="tech-btn danger-outline-btn" @click="clearTempFile">🗑️ 清空</button>
                            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx, .csv" hidden />
                        </div>

                        <label class="mma-checkbox">
                            <input type="checkbox" v-model="onlyShowErrors" />
                            <span class="custom-box"></span> 僅顯示 V2 未滿分項目
                        </label>

                        <button class="tech-btn secondary-btn" @click="runBatchTest" :disabled="batchLoading">
                            {{ batchLoading ? '掃描中...' : '🏃 執行全自動加權掃描' }}
                        </button>
                    </div>
                </div>

                <div class="table-container" v-if="batchReport">
                    <table class="dark-table">
                        <thead>
                            <tr>
                                <th class="text-left">測試語句</th>
                                <th>✅ 真實意圖</th>
                                <th>🧠 V1 猜測 (得分)</th>
                                <th>✨ V2 猜測 (得分)</th>
                                <th>🛠️ 人類校正</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in filteredBatchDetails" :key="item.text" :class="{ 'error-row': item.v2_score < 1.0 }">
                                <td class="text-left text-light">{{ item.text }}</td>
                                <td><span class="pill gray-pill">{{ item.true_intent }}</span></td>
                                <td>
                                    <span class="pill orange-pill">{{ item.v1_pred }}</span><br>
                                    <small class="score-text">{{ renderScore(item.v1_score) }}</small>
                                </td>
                                <td>
                                    <span class="pill blue-pill">{{ item.v2_pred }}</span><br>
                                    <small :class="item.v2_score === 1.0 ? 'ok-text' : 'err-text'">
                                        {{ item.v2_is_intercepted ? '🛡️ ' : '' }}{{ renderScore(item.v2_score) }}
                                    </small>
                                </td>
                                <td class="fix-cell">
                                    <template v-if="item.v2_score < 1.0 && !item.is_saved">
                                        <div class="correction-controls">
                                            <select v-model="item.correction" class="dark-select mini-select">
                                                <option v-for="opt in intentOptions" :key="opt" :value="opt">{{ opt }}</option>
                                            </select>
                                            <button class="btn-save-mini" @click="saveCorrection(item)">存入</button>
                                        </div>
                                    </template>
                                    <span v-else-if="item.is_saved" class="saved-text">✅ 已入庫學習</span>
                                    <span v-else class="ok-text">👍 免修正</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
/* 整體深色實驗室背景 */
.mma-lab-page {
    min-height: 100vh;
    background: radial-gradient(circle at top center, #1e293b 0%, #0f172a 100%);
    color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 40px 20px;
}

.mma-lab-content {
    max-width: 1300px;
    margin: 0 auto;
}

/* 玻璃透視面板 */
.glass-panel {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 25px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Header 設計 */
.mma-lab-header {
    margin-bottom: 30px;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-box {
    display: flex;
    align-items: center;
    gap: 20px;
}

.icon-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(168, 85, 247, 0.3);
    border-radius: 16px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
}

.brand-text h1 {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 5px 0;
    color: #ffffff;
}

.brand-text p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
}
.brand-text strong { color: #c084fc; }

.header-right {
    display: flex;
    gap: 15px;
}

/* 導航按鈕 */
.nav-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}
.nav-btn:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
.nav-btn.danger-hover:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); color: #fca5a5; }

/* 頂部數據統計 */
.header-stats {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px;
}
.stat-unit { text-align: center; }
.stat-unit .label { display: block; font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600;}
.stat-unit .val { font-size: 1.8rem; font-weight: 800; text-shadow: 0 0 10px rgba(255,255,255,0.1); }
.stat-sep { width: 1px; height: 40px; background: rgba(255, 255, 255, 0.1); }
.cyan-text { color: #22d3ee; }
.orange-text { color: #fbbf24; }
.green-text { color: #34d399; }
.blue-text { color: #60a5fa; }

/* 搜尋群組 */
.search-group {
    display: flex;
    gap: 15px;
    margin-bottom: 40px;
    padding: 15px;
}

.dark-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 0 20px;
    color: #f8fafc;
    font-size: 1.1rem;
    transition: border-color 0.3s;
}
.dark-input:focus { outline: none; border-color: #3b82f6; }

/* 按鈕系列 */
.tech-btn {
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: all 0.3s ease;
    color: white;
}
.primary-btn { background: linear-gradient(135deg, #2563eb, #3b82f6); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }
.primary-btn:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5); transform: translateY(-2px); }
.primary-btn:disabled { background: #475569; cursor: not-allowed; box-shadow: none; }

.purple-btn { background: linear-gradient(135deg, #7e22ce, #a855f7); box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3); }
.purple-btn:hover { box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5); transform: translateY(-2px); }

.secondary-btn { background: linear-gradient(135deg, #059669, #10b981); box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); }
.secondary-btn:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5); transform: translateY(-2px); }

.outline-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: #e2e8f0; }
.outline-btn:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.4); }

.danger-outline-btn { background: transparent; border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; }
.danger-outline-btn:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.8); }

/* 擂台對決卡片 */
.battle-arena {
    display: flex;
    gap: 20px;
    align-items: stretch;
    margin-bottom: 30px;
}

.arena-card {
    flex: 1;
    background: rgba(15, 23, 42, 0.6);
    border-radius: 20px;
    padding: 30px 20px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.legacy-card { border: 1px solid rgba(148, 163, 184, 0.2); }
.v1-card { border: 1px solid rgba(245, 158, 11, 0.3); }
.v2-card { border: 1px solid rgba(59, 130, 246, 0.4); box-shadow: 0 10px 30px rgba(59, 130, 246, 0.15); }

/* V2 卡片發光特效 */
.card-glow {
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    width: 200px;
    height: 200px;
    background: #3b82f6;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.25;
    z-index: 0;
}
.relative-z { position: relative; z-index: 1; }

.card-title { font-size: 0.95rem; font-weight: 600; color: #cbd5e1; margin-bottom: 20px; }
.result-box { font-size: 2.2rem; font-weight: 800; margin-bottom: 15px; letter-spacing: 1px; color: #e2e8f0; }
.result-box.highlight { color: #60a5fa; text-shadow: 0 0 15px rgba(96, 165, 250, 0.4); }

.conf-info { font-size: 0.9rem; color: #94a3b8; margin-bottom: 15px; }
.intercept-text { color: #34d399; font-weight: 800; text-shadow: 0 0 10px rgba(52, 211, 153, 0.3); }

.vs-divider { display: flex; align-items: center; font-size: 1.5rem; font-weight: 900; color: #475569; }

/* AI 對話框 */
.ai-reply-box {
    margin-top: 20px;
    padding: 15px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    text-align: left;
}
.mixai-reply { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.2); }

.reply-label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px; font-weight: 600; }
.reply-content { font-size: 0.9rem; color: #cbd5e1; line-height: 1.5; white-space: pre-wrap; }

/* 單句修正區塊 */
.single-correction-box {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    padding: 15px 25px;
    border: 1px dashed rgba(168, 85, 247, 0.4);
    animation: fadeIn 0.4s ease-out;
}
.divider-line { color: #475569; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* 表格區塊 */
.batch-section { margin-top: 40px; }

.section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}
.section-title-row h2 { font-size: 1.4rem; font-weight: 600; margin: 0; }

.title-actions { display: flex; align-items: center; gap: 20px; }
.action-group { display: flex; align-items: center; gap: 10px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 20px; }
.custom-file-badge { font-size: 0.85rem; color: #34d399; font-weight: 600; background: rgba(52,211,153,0.1); padding: 5px 10px; border-radius: 6px; }

/* 自訂 Checkbox */
.mma-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; color: #cbd5e1; font-size: 0.95rem; user-select: none; }
.mma-checkbox input { display: none; }
.custom-box { width: 18px; height: 18px; border: 2px solid #64748b; border-radius: 4px; display: inline-block; position: relative; transition: all 0.2s; }
.mma-checkbox input:checked + .custom-box { background: #3b82f6; border-color: #3b82f6; }
.mma-checkbox input:checked + .custom-box::after { content: '✔'; color: white; position: absolute; font-size: 12px; left: 2px; top: -1px; }

/* 深色資料表 */
.table-container { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); }
.dark-table { width: 100%; border-collapse: collapse; background: rgba(15, 23, 42, 0.4); }
.dark-table th { background: rgba(0, 0, 0, 0.3); padding: 15px; font-size: 0.9rem; color: #94a3b8; border-bottom: 1px solid rgba(255, 255, 255, 0.1); font-weight: 600; }
.dark-table td { padding: 15px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 0.95rem; }
.error-row { background: rgba(239, 68, 68, 0.08); }

.text-left { text-align: left !important; }
.text-light { color: #f8fafc; font-weight: 500; }

/* Pills 標籤 */
.pill { padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; display: inline-block; margin-bottom: 5px; }
.gray-pill { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; }
.orange-pill { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
.blue-pill { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border: 1px solid rgba(59, 130, 246, 0.2); }

.score-text { color: #94a3b8; font-size: 0.8rem; }
.ok-text { color: #34d399; font-weight: 600; }
.err-text { color: #f87171; font-weight: 600; }
.saved-text { color: #60a5fa; font-weight: 600; }

/* 表格內的控制元件 */
.correction-controls { display: flex; gap: 8px; justify-content: center; align-items: center; }
.dark-select { background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.2); color: #f8fafc; padding: 8px 12px; border-radius: 8px; outline: none; }
.mini-select { width: 130px; font-size: 0.85rem; padding: 6px 8px; }
.btn-save-mini { background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-save-mini:hover { background: #059669; }

/* 響應式 */
@media (max-width: 1024px) {
    .battle-arena { flex-direction: column; }
    .vs-divider { display: none; }
    .title-actions { flex-direction: column; align-items: flex-start; gap: 15px; }
    .action-group { border-right: none; padding-right: 0; flex-wrap: wrap; }
}
</style>