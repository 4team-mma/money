<script setup>
/**
 * 邱比特大腦：意圖識別 A/B 測試擂台
 * 保留原始備註：手動與批次測試，支援 Money MMA 風格校正與登出功能
 */
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  compareAiIntents, 
  runAiBatchTest, 
  uploadAiTestExcel, 
  clearAiTestFile,
  updateCorrectedIntent 
} from '@/api/robot';
import { ElMessage } from 'element-plus';

const router = useRouter();

const testMessage = ref('');
const loading = ref(false);
const singleResult = ref(null);
const batchLoading = ref(false);
const batchReport = ref(null);
const hasCustomFile = ref(false);
const onlyShowErrors = ref(false);

const intentOptions = ['RECORD', 'QUERY', 'CHAT', 'ADVISOR', 'MULTI_RECORD', 'MULTI_QUERY', 'MULTI_KNOWLEDGE', 'KNOWLEDGE'];

// 🌟 計算屬性：根據開關過濾表格
const filteredBatchDetails = computed(() => {
    if (!batchReport.value) return [];
    if (onlyShowErrors.value) {
        return batchReport.value.details.filter(item => !item.is_correct);
    }
    return batchReport.value.details;
});

// 登出邏輯
const handleLogout = () => {
  localStorage.removeItem('user_token');
  localStorage.removeItem('currentUser');
  ElMessage.success('已安全登出喵！');
  router.push('/');
};

// 1. 單句對比測試 (修正 res.data 取值)
const runSingleTest = async () => {
    if (!testMessage.value.trim()) return;
    loading.value = true;
    try {
        const res = await compareAiIntents(testMessage.value);
        const responseData = res.data || res;
        singleResult.value = responseData;
        console.log("收到結果喵：", singleResult.value);
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
        const res = await runAiBatchTest();
        batchReport.value = res.data || res;
        ElMessage.success(`批次分析完成！目前準確率 ${(batchReport.value.accuracy * 100).toFixed(1)}%`);
    } catch (err) {
        console.error("批次失敗：", err);
        ElMessage.error('批次測試失敗：請檢查後端 temp/excel 資料夾是否有 golden_test.xlsx');
    } finally {
        batchLoading.value = false;
    }
};

// 🌟 修正存檔邏輯
const saveCorrection = async (item) => {
    try {
        await updateCorrectedIntent(item.review_id, item.correction);
        item.is_correct = (item.correction === item.pred);
        ElMessage.success('✅ 已成功將修正寫入資料庫！未來可用於重新訓練。');
    } catch (err) {
        ElMessage.error('修正失敗，請確認 API 是否正確。');
    }
};

// 3. 上傳檔案
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

// 4. 清除檔案
const clearTempFile = async () => {
    try {
        await clearAiTestFile();
        hasCustomFile.value = false;
        batchReport.value = null;
        ElMessage.success('已清空並恢復預設');
    } catch (err) { ElMessage.error('清空失敗'); }
};

// 🎨 顏色邏輯
const getConfidenceColor = (score) => {
    if (score > 0.9) return '#10b981';
    if (score > 0.7) return '#f59e0b';
    return '#ef4444';
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
              <h1>🚀 邱比特大腦：意圖識別 A/B 測試擂台</h1>
              <p>比較「傳統關鍵字」與「ONNX + V10 攔截器」的差異</p>
            </div>
          </div>
          <div class="header-right">
            <div class="mode-info">
              <span class="mode-tag" :class="{ 'is-custom': hasCustomFile }">
                模式：{{ hasCustomFile ? '📁 自定義測試檔' : '🏆 預設黃金測試集' }}
              </span>
              <button class="mma-btn outline" @click="$refs.fileInput.click()">📤 上傳新題庫</button>
              <button v-if="hasCustomFile" class="mma-btn outline danger" @click="clearTempFile">🗑️ 恢復預設</button>
              <input type="file" ref="fileInput" @change="handleFileUpload" accept=".xlsx" hidden />
            </div>
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
            <span class="label">V2 準確率</span>
            <span class="val" :class="batchReport.accuracy >= 0.9 ? 'green' : 'orange'">
              {{ (batchReport.accuracy * 100).toFixed(1) }}%
            </span>
          </div>
        </div>
      </header>

      <section class="mma-card-shadow arena-section">
        <div class="search-group">
          <input 
            v-model="testMessage" 
            placeholder="請輸入測試語句，按 Enter 發動進攻..." 
            @keyup.enter="runSingleTest"
          />
          <button class="mma-btn solid primary" @click="runSingleTest" :disabled="loading">
            發動對比 🐾
          </button>
        </div>

        <div class="battle-arena" v-if="singleResult">
          <div class="arena-card legacy">
            <div class="card-title">🏠 傳統喵喵</div>
            <div class="result-box">{{ singleResult.legacy.intent }}</div>
            <div class="card-footer">純關鍵字匹配邏輯</div>
          </div>

          <div class="vs-divider">VS</div>

          <div class="arena-card mixai">
            <div class="card-title">✨ 邱比特大腦 (混合版)</div>
            <div class="result-box highlight">{{ singleResult.mix_ai.intent }}</div>
            <div class="conf-info">
              信心度：<b :style="{ color: getConfidenceColor(singleResult.mix_ai.confidence) }">
                {{ (singleResult.mix_ai.confidence * 100).toFixed(2) }}%
              </b>
            </div>
            <div class="card-footer">ONNX 模型 + V10 行為路由器</div>
          </div>
        </div>
      </section>

      <section class="mma-card-shadow batch-section">
        <div class="section-title-row">
          <h2>📊 批次自動測試報告</h2>
          <div class="title-actions">
            <label class="mma-checkbox">
              <input type="checkbox" v-model="onlyShowErrors" />
              <span class="box"></span> 僅顯示失敗項
            </label>
            <button class="mma-btn solid secondary" @click="runBatchTest" :disabled="batchLoading">
              {{ batchLoading ? '掃描中...' : '🏃 執行全自動掃描' }}
            </button>
          </div>
        </div>

        <div class="table-container" v-if="batchReport">
          <table class="mma-table">
            <thead>
              <tr>
                <th class="text-left">測試語句</th>
                <th>V1 判定</th>
                <th>V2 判定</th>
                <th>信心度</th>
                <th>狀態</th>
                <th>🛠️ 校正 (入資料庫)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredBatchDetails" :key="item.review_id" :class="{ 'error-row': !item.is_correct }">
                <td class="text-left font-bold">{{ item.text }}</td>
                <td><span class="pill gray">{{ item.legacy_pred }}</span></td>
                <td><span class="pill blue">{{ item.pred }}</span></td>
                <td>{{ (item.conf * 100).toFixed(1) }}%</td>
                <td :class="item.is_correct ? 'ok-text' : 'err-text'">{{ item.is_correct ? '✅' : '❌' }}</td>
                <td class="fix-cell">
                  <select v-model="item.correction" class="mma-select">
                    <option v-for="opt in intentOptions" :key="opt" :value="opt">{{ opt }}</option>
                  </select>
                  <button class="btn-save-mini" @click="saveCorrection(item)">儲存</button>
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
  background-color: #f1f5f9; min-height: 100vh; padding: 50px 20px;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}
.mma-lab-content { max-width: 1300px; margin: 0 auto; }
.mma-card-shadow { background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); margin-bottom: 30px; padding: 35px; border: 1px solid #f1f5f9; }

/* Header */
.mma-lab-header { display: flex; flex-direction: column; gap: 20px; }
.header-main { display: flex; justify-content: space-between; align-items: center; }
.brand-box { display: flex; align-items: center; gap: 20px; }
.sparkle { font-size: 32px; background: #eff6ff; padding: 12px; border-radius: 16px; }
.brand-text h1 { margin: 0; font-size: 26px; color: #1e293b; }
.brand-text p { margin: 5px 0 0 0; color: #64748b; font-size: 15px; }

.header-right { display: flex; gap: 20px; align-items: center; }
.mode-info { display: flex; align-items: center; gap: 10px; }
.mode-tag { font-size: 12px; font-weight: 800; padding: 6px 15px; border-radius: 20px; background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.mode-tag.is-custom { background: #dcfce7; color: #166534; border-color: #bbf7d0; }

/* 統計數字欄 */
.header-stats { display: flex; align-items: center; justify-content: center; gap: 50px; background: #f8fafc; padding: 15px; border-radius: 16px; border: 1px solid #e2e8f0; }
.stat-unit { text-align: center; }
.stat-unit .label { display: block; font-size: 12px; color: #94a3b8; font-weight: bold; margin-bottom: 5px; }
.stat-unit .val { font-size: 24px; font-weight: 900; color: #1e293b; }
.stat-sep { width: 1px; height: 35px; background: #e2e8f0; }

/* 搜尋框與擂台 */
.search-group { display: flex; gap: 15px; background: #f8fafc; padding: 10px; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 50px; }
.search-group input { flex: 1; border: none; background: transparent; padding: 0 20px; font-size: 18px; outline: none; }

.battle-arena { display: flex; justify-content: center; align-items: center; gap: 40px; }
.arena-card { flex: 1; padding: 40px 30px; border-radius: 24px; background: #fff; border: 1px solid #f1f5f9; text-align: center; }
.arena-card.mixai { border: 2px solid #3b82f6; background: linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); }
.arena-card .card-title { font-size: 13px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 20px; }
.arena-card .result-box { font-size: 44px; font-weight: 900; margin-bottom: 20px; letter-spacing: 1px; }
.arena-card .result-box.highlight { color: #3b82f6; }
.arena-card .card-footer { font-size: 13px; color: #94a3b8; }
.vs-divider { font-size: 26px; font-weight: 900; color: #cbd5e1; }

/* 表格 */
.section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.mma-checkbox { display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: bold; color: #475569; }
.table-container { border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; }
.mma-table { width: 100%; border-collapse: collapse; background: white; }
.mma-table th { background: #f8fafc; padding: 20px; font-size: 14px; color: #64748b; border-bottom: 2px solid #f1f5f9; }
.mma-table td { padding: 20px; border-bottom: 1px solid #f1f5f9; text-align: center; }
.error-row { background: #fff1f2; }

/* 標籤小方塊 */
.pill { padding: 5px 12px; border-radius: 8px; font-size: 12px; font-weight: bold; }
.pill.blue { background: #dbeafe; color: #1e40af; }
.pill.gray { background: #f1f5f9; color: #475569; }

/* 按鈕系列 */
.mma-btn { padding: 12px 24px; border-radius: 12px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s; }
.mma-btn.solid.primary { background: #1e293b; color: white; }
.mma-btn.solid.secondary { background: #3b82f6; color: white; }
.mma-btn.solid.danger { background: #ef4444; color: white; }
.mma-btn.outline { background: white; border: 1px solid #e2e8f0; color: #475569; }
.btn-save-mini { background: #10b981; color: white; border: none; padding: 8px 15px; border-radius: 10px; font-weight: bold; cursor: pointer; }

.mma-select { padding: 8px; border-radius: 10px; border: 1px solid #cbd5e1; outline: none; font-weight: bold; margin-right: 10px; }
.ok-text { color: #10b981; font-weight: 900; }
.err-text { color: #ef4444; font-weight: 900; }
.text-left { text-align: left !important; }
.font-bold { font-weight: bold; }
</style>