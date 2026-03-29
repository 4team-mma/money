<script setup>
import { ref } from 'vue';
// 🌟 修正點 1：從 robot.js 引入你定義好的正確函式
import {
    compareAiIntents,
    runAiBatchTest,
    uploadAiTestExcel,
    clearAiTestFile
} from '@/api/robot';
import { ElMessage } from 'element-plus';

const testMessage = ref('');
const loading = ref(false);
const singleResult = ref(null);
const batchLoading = ref(false);
const batchReport = ref(null);
const hasCustomFile = ref(false);

// 1. 單句對比測試
// TestAI.vue 裡面的 runSingleTest 修正
const runSingleTest = async () => {
    if (!testMessage.value.trim()) return;
    loading.value = true;
    try {
        const res = await compareAiIntents(testMessage.value);
        // 🌟 這裡：如果你的 axios 有攔截器直接回傳 data，就用 res
        // 如果沒有，就用 res.data
        const responseData = res.data || res; 
        singleResult.value = responseData; 
        
        console.log("收到結果喵：", singleResult.value); // 在 Console 看一下有沒有東西
        ElMessage.success('對比完成喵！');
    } catch (err) {
        console.error("對比失敗：", err);
        ElMessage.error('伺服器開小差了喵...');
    } finally {
        loading.value = false;
    }
};

// 2. 批次掃描測試
const runBatchTest = async () => {
    batchLoading.value = true;
    try {
        // 🌟 修正點 3：改用 robot.js 的函式
        const res = await runAiBatchTest();
        batchReport.value = res.data;
        ElMessage.success('批次掃描完成喵！');
    } catch (err) {
        ElMessage.error('批次掃描失敗');
    } finally {
        batchLoading.value = false;
    }
};

// 3. 上傳檔案
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        // 🌟 修正點 4：改用 robot.js 的函式
        await uploadAiTestExcel(formData);
        hasCustomFile.value = true;
        ElMessage.success('測試檔上傳成功喵！');
    } catch (err) {
        ElMessage.error('上傳失敗');
    }
};

// 4. 清除檔案
const clearTempFile = async () => {
    try {
        // 🌟 修正點 5：改用 robot.js 的函式
        await clearAiTestFile();
        hasCustomFile.value = false;
        batchReport.value = null;
        ElMessage.success('已恢復為預設測試集喵。');
    } catch (err) {
        ElMessage.error('清除失敗');
    }
};

// 🎨 顏色邏輯不變
const getConfidenceColor = (score) => {
    if (score > 0.9) return '#10b981';
    if (score > 0.7) return '#f59e0b';
    return '#ef4444';
};

const getAccuracyColor = (acc) => {
    if (acc >= 0.95) return '#10b981';
    if (acc >= 0.8) return '#3b82f6';
    return '#ef4444';
};
</script>

<template>
    <div class="test-ai-container">
        <div class="test-header">
            <div class="title-section">
                <h1>🚀 邱比特大腦：意圖識別 A/B 測試擂台</h1>
                <p class="subtitle">比較「傳統關鍵字」與「ONNX + V10 攔截器」的差異</p>
            </div>

            <div class="file-management">
                <div class="file-status" :class="{ 'has-file': hasCustomFile }">
                    模式：{{ hasCustomFile ? '📁 自定義測試檔' : '🏆 預設黃金測試集' }}
                </div>
                <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx" hidden />
                <button class="action-btn upload" @click="$refs.fileInput.click()">📤 上傳 Excel</button>
                <button v-if="hasCustomFile" class="action-btn clear" @click="clearTempFile">🗑️ 清除</button>
            </div>
        </div>

        <div class="input-panel">
            <input v-model="testMessage" placeholder="輸入小主人語句進行單次測試..." @keyup.enter="runSingleTest"
                :disabled="loading" />
            <button @click="runSingleTest" :disabled="loading">
                {{ loading ? '運算中...' : '發動對比 🐾' }}
            </button>
        </div>

        <div class="arena" v-if="singleResult">
            <div class="bot-card legacy">
                <div class="bot-tag">🏠 傳統喵喵</div>
                <div class="intent-box">{{ singleResult.legacy.intent }}</div>
                <div class="bot-desc">純關鍵字匹配邏輯</div>
            </div>

            <div class="vs-divider">VS</div>

            <div class="bot-card mix-ai">
                <div class="bot-tag">✨ 邱比特大腦 (混合版)</div>
                <div class="intent-box highlight">{{ singleResult.mix_ai.intent }}</div>

                <div class="metrics">
                    <div class="metric-item">
                        <span>信心度：</span>
                        <b :style="{ color: getConfidenceColor(singleResult.mix_ai.confidence) }">
                            {{ (singleResult.mix_ai.confidence * 100).toFixed(2) }}%
                        </b>
                    </div>
                    <div class="metric-item">
                        <span>原始直覺：</span>
                        <small>{{ singleResult.mix_ai.raw_ai_guess }}</small>
                    </div>
                </div>
                <div class="bot-desc">ONNX 模型 + V10 行為路由器</div>
            </div>
        </div>

        <div class="batch-panel">
            <div class="panel-header">
                <h3>📊 批次自動測試報告</h3>
                <button @click="runBatchTest" class="batch-run-btn" :disabled="batchLoading">
                    {{ batchLoading ? '測試中...' : '🏃 執行全自動掃描' }}
                </button>
            </div>

            <div v-if="batchReport" class="report-stats">
                <div class="stat-card">
                    <span class="label">總測試題數</span>
                    <span class="value">{{ batchReport.total }}</span>
                </div>
                <div class="stat-card">
                    <span class="label">準確率 (Accuracy)</span>
                    <span class="value" :style="{ color: getAccuracyColor(batchReport.accuracy) }">
                        {{ (batchReport.accuracy * 100).toFixed(1) }}%
                    </span>
                </div>
            </div>

            <div v-if="batchReport" class="report-table-wrapper">
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>測試語句</th>
                            <th>預期意圖</th>
                            <th>AI 預測</th>
                            <th>信心度</th>
                            <th>結果</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in batchReport.details" :key="idx">
                            <td class="text-left">{{ item.text }}</td>
                            <td><span class="badge true">{{ item.true }}</span></td>
                            <td><span class="badge pred">{{ item.pred }}</span></td>
                            <td>{{ (item.conf * 100).toFixed(1) }}%</td>
                            <td :class="item.is_correct ? 'correct' : 'wrong'">
                                {{ item.is_correct ? '✅ 成功' : '❌ 誤判' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>



<style scoped>
/* 樣式部分採用乾淨、專業的科技感設計 */
.test-ai-container {
    max-width: 1000px;
    margin: 40px auto;
    padding: 20px;
    font-family: 'Segoe UI', system-ui, sans-serif;
}

.test-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 30px;
}

.file-management {
    display: flex;
    gap: 10px;
    align-items: center;
}

.file-status {
    font-size: 0.85rem;
    padding: 5px 12px;
    background: #eee;
    border-radius: 20px;
    color: #666;
}

.file-status.has-file {
    background: #e0f2fe;
    color: #0369a1;
    font-weight: bold;
}

.input-panel {
    display: flex;
    gap: 10px;
    margin-bottom: 40px;
}

.input-panel input {
    flex: 1;
    padding: 15px 20px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1.1rem;
}

.arena {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 50px;
}

.bot-card {
    flex: 1;
    background: white;
    padding: 30px;
    border-radius: 24px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    text-align: center;
    border: 1px solid #f1f5f9;
}

.intent-box {
    font-size: 2.2rem;
    font-weight: 900;
    color: #64748b;
    margin: 20px 0;
}

.intent-box.highlight {
    color: #3b82f6;
}

.vs-divider {
    width: 60px;
    height: 60px;
    background: #1e293b;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin: 0 20px;
}

.report-table-wrapper {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.report-table {
    width: 100%;
    border-collapse: collapse;
}

.report-table th {
    background: #f8fafc;
    padding: 12px;
    font-size: 0.9rem;
    color: #64748b;
}

.report-table td {
    padding: 12px;
    border-bottom: 1px solid #f1f5f9;
    text-align: center;
}

.badge {
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: bold;
}

.badge.true {
    background: #dcfce7;
    color: #166534;
}

.badge.pred {
    background: #dbeafe;
    color: #1e40af;
}

.correct {
    color: #10b981;
    font-weight: bold;
}

.wrong {
    color: #ef4444;
    font-weight: bold;
}
</style>