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
            <header class="mma-lab-header mma-card-shadow">
                <div class="header-main">
                    <div class="brand-box">
                        <span class="sparkle">✨</span>
                        <div class="brand-text">
                            <h1>🚀 大腦競技場：V1 vs V2 對決</h1>
                            <p>傳統關鍵字 vs 純 ONNX 模型 vs 語意路由器</p>
                        </div>
                    </div>
                    <div class="header-right">
                        <button class="mma-btn solid danger" @click="handleLogout">🚪 登出</button>
                    </div>
                </div>

                <div class="header-stats" v-if="batchReport">
                    <div class="stat-unit">
                        <span class="label">樣本總數</span>
                        <span class="val">{{ batchReport.total }}</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-unit">
                        <span class="label">V1 舊版得分率</span>
                        <span class="val orange">{{ (batchReport.v1_accuracy * 100).toFixed(1) }}%</span>
                    </div>
                    <div class="stat-sep"></div>
                    <div class="stat-unit">
                        <span class="label">V2 旗艦版得分率</span>
                        <span class="val" :class="batchReport.v2_accuracy >= 0.9 ? 'green' : 'orange'">
                            {{ (batchReport.v2_accuracy * 100).toFixed(1) }}%
                        </span>
                    </div>
                </div>
            </header>

            <section class="mma-card-shadow arena-section">
                <div class="search-group">
                    <input v-model="testMessage" placeholder="請輸入測試語句，按 Enter 發動進攻..." @keyup.enter="runSingleTest" />
                    <button class="mma-btn solid primary" @click="runSingleTest" :disabled="loading">
                        {{ loading ? '掃描運算中... ⏳' : '發動三方對比 🐾' }}
                    </button>
                </div>

                <div class="battle-arena" v-if="singleResult"
                    style="display: flex; justify-content: space-between; align-items: stretch; gap: 20px;">

                    <div class="arena-card legacy" style="flex: 1;">
                        <div class="card-title">🏠 傳統喵喵 (Regex)</div>
                        <div class="result-box">{{ singleResult.legacy.intent }}</div>
                        <div class="ai-reply-box">
                            <span class="reply-label">💬 喵喵回覆：</span>
                            <div class="reply-content">{{ singleResult.legacy.response || '（無回覆內容）' }}</div>
                        </div>
                    </div>

                    <div class="vs-divider" style="display: flex; align-items: center;">VS</div>

                    <div class="arena-card legacy" style="flex: 1; border-top: 4px solid #f59e0b;">
                        <div class="card-title">🧠 V1 舊大腦 (ONNX)</div>
                        <div class="result-box">{{ singleResult.v1_ai.intent }}</div>
                        <div class="conf-info">
                            信心：<b>{{ (singleResult.v1_ai.confidence * 100).toFixed(1) }}%</b>
                        </div>
                        <div class="ai-reply-box">
                            <span class="reply-label">💬 V1 模擬回覆：</span>
                            <div class="reply-content">（V1 不產生對話回覆以節省資源）</div>
                        </div>
                    </div>

                    <div class="vs-divider" style="display: flex; align-items: center;">VS</div>

                    <div class="arena-card mixai" style="flex: 1;">
                        <div class="card-title">✨ V2 旗艦大腦 (混合路由)</div>
                        <div class="result-box highlight">{{ singleResult.v2_ai.intent }}</div>
                        <div class="conf-info">
                            <span v-if="singleResult.v2_ai.is_intercepted" style="color: #10b981; font-weight: 800;">🛡️
                                ChromaDB 攔截</span>
                            <span v-else>信心：<b>{{ (singleResult.v2_ai.confidence * 100).toFixed(1) }}%</b></span>
                        </div>
                        <div class="ai-reply-box mixai-reply">
                            <span class="reply-label">💬 V2 真實說法：</span>
                            <div class="reply-content">{{ singleResult.v2_ai.response || '（生成失敗）' }}</div>
                        </div>
                    </div>
                </div>

                <div class="single-correction-box" v-if="singleResult && showSingleCorrection">
                    <span>🤖 邱比特大腦 V2 表現得如何？</span>
                    <button class="mma-btn outline" @click="showSingleCorrection = false">✅ 判斷正確</button>
                    <span style="color: #cbd5e1;">|</span>
                    <span>強制糾正為：</span>
                    <select v-model="singleCorrection" class="mma-select">
                        <option v-for="opt in intentOptions" :key="opt" :value="opt">{{ opt }}</option>
                    </select>
                    <button class="mma-btn solid primary" @click="saveSingleCorrection">儲存修正入庫</button>
                </div>
            </section>

            <section class="mma-card-shadow batch-section">
                <div class="section-title-row">
                    <h2>📊 批次盲測與加權報告</h2>
                    <div class="title-actions" style="display: flex; gap: 15px; align-items: center;">

                        <div style="display: flex; gap: 8px; border-right: 2px solid #e2e8f0; padding-right: 15px;">
                            <span v-if="hasCustomFile"
                                style="font-size: 13px; color: #10b981; font-weight: bold; line-height: 40px;">
                                📁 已載入自定義題庫
                            </span>
                            <button class="mma-btn outline" @click="$refs.fileInput.click()">📤 上傳盲測題庫</button>
                            <button v-if="hasCustomFile" class="mma-btn outline danger" @click="clearTempFile">🗑️
                                清空</button>
                            <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx, .csv" hidden />
                        </div>

                        <label class="mma-checkbox">
                            <input type="checkbox" v-model="onlyShowErrors" />
                            <span class="box"></span> 僅顯示 V2 未滿分項目
                        </label>

                        <button class="mma-btn solid secondary" @click="runBatchTest" :disabled="batchLoading">
                            {{ batchLoading ? '掃描中...' : '🏃 執行全自動加權掃描' }}
                        </button>
                    </div>
                </div>

                <div class="table-container" v-if="batchReport">
                    <table class="mma-table">
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
                            <tr v-for="item in filteredBatchDetails" :key="item.text"
                                :class="{ 'error-row': item.v2_score < 1.0 }">
                                <td class="text-left font-bold">{{ item.text }}</td>
                                <td><span class="pill gray">{{ item.true_intent }}</span></td>
                                <td>
                                    <span class="pill" style="background:#fef3c7; color:#b45309">{{ item.v1_pred
                                        }}</span><br>
                                    <small>{{ renderScore(item.v1_score) }}</small>
                                </td>
                                <td>
                                    <span class="pill blue">{{ item.v2_pred }}</span><br>
                                    <small :class="item.v2_score === 1.0 ? 'ok-text' : 'err-text'">
                                        {{ item.v2_is_intercepted ? '🛡️ ' : '' }}{{ renderScore(item.v2_score) }}
                                    </small>
                                </td>
                                <td class="fix-cell">
                                    <template v-if="item.v2_score < 1.0 && !item.is_saved">
                                        <select v-model="item.correction" class="mma-select" style="width:120px">
                                            <option v-for="opt in intentOptions" :key="opt" :value="opt">{{ opt }}
                                            </option>
                                        </select>
                                        <button class="btn-save-mini" @click="saveCorrection(item)">存入</button>
                                    </template>

                                    <span v-else-if="item.is_saved" style="color: #10b981; font-weight: bold;">
                                        ✅ 已入庫學習
                                    </span>

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
/* 核心樣式：置中排版、間距寬敞 */
.mma-lab-page {
    background-color: #f1f5f9;
    min-height: 100vh;
    padding: 50px 20px;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

.mma-lab-content {
    max-width: 1300px;
    margin: 0 auto;
}

.mma-card-shadow {
    background: white;
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
    margin-bottom: 30px;
    padding: 35px;
    border: 1px solid #f1f5f9;
}

/* Header */
.mma-lab-header {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.brand-box {
    display: flex;
    align-items: center;
    gap: 20px;
}

.sparkle {
    font-size: 32px;
    background: #eff6ff;
    padding: 12px;
    border-radius: 16px;
}

.brand-text h1 {
    margin: 0;
    font-size: 26px;
    color: #1e293b;
}

.brand-text p {
    margin: 5px 0 0 0;
    color: #64748b;
    font-size: 15px;
}

.header-right {
    display: flex;
    gap: 20px;
    align-items: center;
}

.mode-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.mode-tag {
    font-size: 12px;
    font-weight: 800;
    padding: 6px 15px;
    border-radius: 20px;
    background: #f8fafc;
    color: #64748b;
    border: 1px solid #e2e8f0;
}

.mode-tag.is-custom {
    background: #dcfce7;
    color: #166534;
    border-color: #bbf7d0;
}

/* 統計數字欄 */
.header-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 50px;
    background: #f8fafc;
    padding: 15px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
}

.stat-unit {
    text-align: center;
}

.stat-unit .label {
    display: block;
    font-size: 12px;
    color: #94a3b8;
    font-weight: bold;
    margin-bottom: 5px;
}

.stat-unit .val {
    font-size: 24px;
    font-weight: 900;
    color: #1e293b;
}

.stat-sep {
    width: 1px;
    height: 35px;
    background: #e2e8f0;
}

/* 搜尋框與擂台 */
.search-group {
    display: flex;
    gap: 15px;
    background: #f8fafc;
    padding: 10px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    margin-bottom: 50px;
}

.search-group input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0 20px;
    font-size: 18px;
    outline: none;
}

.battle-arena {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
}

.arena-card {
    flex: 1;
    padding: 40px 30px;
    border-radius: 24px;
    background: #fff;
    border: 1px solid #f1f5f9;
    text-align: center;
}

.arena-card.mixai {
    border: 2px solid #3b82f6;
    background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%);
}

.arena-card .card-title {
    font-size: 13px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    margin-bottom: 20px;
}

.arena-card .result-box {
    font-size: 44px;
    font-weight: 900;
    margin-bottom: 20px;
    letter-spacing: 1px;
}

.arena-card .result-box.highlight {
    color: #3b82f6;
}

.arena-card .card-footer {
    font-size: 13px;
    color: #94a3b8;
}

.vs-divider {
    font-size: 26px;
    font-weight: 900;
    color: #cbd5e1;
}

/* 表格 */
.section-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.mma-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-weight: bold;
    color: #475569;
}

.table-container {
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
}

.mma-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.mma-table th {
    background: #f8fafc;
    padding: 20px;
    font-size: 14px;
    color: #64748b;
    border-bottom: 2px solid #f1f5f9;
}

.mma-table td {
    padding: 20px;
    border-bottom: 1px solid #f1f5f9;
    text-align: center;
}

.error-row {
    background: #fff1f2;
}

/* 標籤小方塊 */
.pill {
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
}

.pill.blue {
    background: #dbeafe;
    color: #1e40af;
}

.pill.gray {
    background: #f1f5f9;
    color: #475569;
}

/* 按鈕系列 */
.mma-btn {
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: bold;
    cursor: pointer;
    border: none;
    transition: 0.2s;
}

.mma-btn.solid.primary {
    background: #1e293b;
    color: white;
}

.mma-btn.solid.secondary {
    background: #3b82f6;
    color: white;
}

.mma-btn.solid.danger {
    background: #ef4444;
    color: white;
}

.mma-btn.outline {
    background: white;
    border: 1px solid #e2e8f0;
    color: #475569;
}

.btn-save-mini {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 10px;
    font-weight: bold;
    cursor: pointer;
}

.mma-select {
    padding: 8px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    outline: none;
    font-weight: bold;
    margin-right: 10px;
}

.ok-text {
    color: #10b981;
    font-weight: 900;
}

.err-text {
    color: #ef4444;
    font-weight: 900;
}

.text-left {
    text-align: left !important;
}

.font-bold {
    font-weight: bold;
}

/* 🌟 新增：單句校正工具列樣式 */
.single-correction-box {
    margin-top: 30px;
    padding: 20px;
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 15px;
    color: #475569;
    font-weight: bold;
    animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 🌟 AI 實際回覆對話框樣式 */
.ai-reply-box {
    margin-top: 25px;
    padding: 15px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    text-align: left;
    font-size: 14px;
    color: #334155;
    line-height: 1.6;
}

.ai-reply-box.mixai-reply {
    background: #f0fdf4;
    /* 給新大腦一點淺綠色背景區分 */
    border-color: #bbf7d0;
}

.reply-label {
    display: block;
    font-weight: 800;
    color: #64748b;
    margin-bottom: 8px;
    font-size: 12px;
}

.reply-content {
    white-space: pre-wrap;
    /* 讓 AI 的換行能正常顯示 */
}
</style>