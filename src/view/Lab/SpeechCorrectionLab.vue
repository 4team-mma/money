<script setup>
// SpeechCorrectionLab.vue
/**
 * 邱比特大腦：財經語音糾錯擂台 (LoRA 展示版)
 */
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { processSpeechCorrection, updateFinalCorrectedText } from '@/api/robot';
import { ElMessage,vLoading } from 'element-plus';

const router = useRouter();

// 語音辨識相關
const isRecording = ref(false);
let recognition = null;
const rawInput = ref(''); // 前端 Web Speech API 轉出來的草稿

// AI 糾錯結果相關
const loading = ref(false);
const correctionResult = ref(null); // 後端回傳 { log_id, raw_text, corrected_text, inference_time_ms }

// 人類確認/修正相關
const finalUserText = ref('');
const isEditingFinal = ref(false);

// 🌟 新增：判斷使用者是否有手動修改過文字 (判斷 AI 是否翻車)
const isAiFailed = computed(() => {
    if (!correctionResult.value) return false;
    // 只要最終確認的文字，跟 AI 剛算出來的文字不一樣，就代表人類介入了！
    return finalUserText.value !== correctionResult.value.corrected_text;
});


// Web Speech API 初始化
onMounted(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        ElMessage.error('瀏覽器不支援 Web Speech API，請使用 Chrome 或 Edge！');
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.interimResults = false; 
    recognition.continuous = false;

    recognition.onstart = () => {
        console.log("🎤 [Speech] 開始錄音...");
        isRecording.value = true;
        rawInput.value = '';
        correctionResult.value = null; 
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("🎤 [Speech] 原始辨識結果:", transcript);
        rawInput.value = transcript;
        ElMessage.success('語音接收完成，正在送往 RTX 4060 Ti 糾錯喵！');
        sendToBackendForCorrection(transcript); 
    };

    recognition.onerror = (event) => {
        console.error("❌ [Speech] 語音辨識錯誤:", event.error);
        isRecording.value = false;
        ElMessage.error('麥克風開小差了喵...');
    };

    recognition.onend = () => {
        console.log("🎤 [Speech] 錄音結束。");
        isRecording.value = false;
    };
});

// 切換錄音狀態
const toggleRecording = () => {
    if (isRecording.value) {
        recognition.stop();
    } else {
        recognition.start();
    }
};



// 送往後端 Qwen+LoRA 進行糾錯
const sendToBackendForCorrection = async (text) => {
    if (!text) return;
    console.log("📡 [API] 發送糾錯請求, 內容:", text);
    loading.value = true;
    try {
        const res = await processSpeechCorrection(text);
        console.log("✅ [API] 糾錯成功回傳:", res.data || res);
        
        correctionResult.value = res.data || res;
        finalUserText.value = correctionResult.value.corrected_text;

        ElMessage.success('QLoRA 糾錯完成喵！');
    } catch (err) {
        console.error("❌ [API] 糾錯失敗:", err.response || err);
        ElMessage.error('後端 AI 燒壞了喵...');
        correctionResult.value = {
            raw_text: text,
            corrected_text: '（AI 修正失敗）',
            inference_time_ms: 0
        }
    } finally {
        loading.value = false;
    }
};

// 手動輸入文字測試
const manualTestText = ref('');
const runManualTest = () => {
    if (!manualTestText.value.trim()) return;
    console.log("⌨️ [Manual] 手動測試輸入:", manualTestText.value);
    rawInput.value = manualTestText.value;
    sendToBackendForCorrection(manualTestText.value);
}

// 使用者確認並記帳 (Human-in-the-loop)
const confirmAndSaveLog = async () => {
    if (!correctionResult.value || !correctionResult.value.log_id) return;

    const logId = correctionResult.value.log_id;
    const finalText = finalUserText.value;

    try {
        console.log(`🚀 發送存檔請求 - ID: ${logId}`);
        // 🌟 直接呼叫 robot.js 的方法
        const res = await updateFinalCorrectedText(logId, finalText);
        
        console.log("🎯 伺服器成功回應");
        ElMessage.success('✅ 成效紀錄已入庫！');
    } catch (err) {
        // 🌟 終極大招：我們完全不判斷 err 的類型
        // 只用最原始的 JS 語法去試探它有沒有 response 屬性
        console.group("💥 發生存取異常");
        
        const errorStatus = err && err.response ? err.response.status : "無回應";
        const errorMessage = err && err.message ? err.message : "未知錯誤";
        
        console.error("狀態碼:", errorStatus);
        console.error("訊息:", errorMessage);
        console.groupEnd();

        ElMessage.error(`存入失敗: ${errorStatus} (${errorMessage})`);
    }
};


</script>

<template>
    <div class="mma-lab-page">
        <div class="mma-lab-content">
            <header class="mma-lab-header">
                <div class="header-main">
                    <div class="brand-box">
                        <div class="icon-wrapper blue-glow-icon">
                            <span class="sparkle">🎤</span>
                        </div>
                        <div class="brand-text">
                            <h1>邱比特語音擂台：QLoRA 糾錯實驗室</h1>
                            <p>Web Speech API (C++) vs <strong>MoneyMMA 財經糾錯模型 (Qwen2.5-LoRA)</strong></p>
                        </div>
                    </div>
                    <button class="nav-btn danger-hover" @click="router.push('/dashboard')">
                        <span class="btn-icon">🔙</span> 返回首頁
                    </button>
                </div>
            </header>

            <section class="glass-panel action-section text-center">
                <h2 class="section-title">小主人請講話喵 🐾</h2>

                <div class="mic-container">
                    <button class="mic-btn" :class="{ 'recording': isRecording }" @click="toggleRecording">
                        <span class="mic-icon">🎤</span>
                    </button>
                    <p class="status-text" :class="{ 'recording-text': isRecording }">
                        {{ isRecording ? '正在聆聽中... (請試著說「去全連刷溜溜卡買菜花了以前」)' : '點擊麥克風發動語音記帳' }}
                    </p>
                </div>

                <div class="manual-test-divider"><span>或</span></div>

                <div class="manual-test-box">
                    <input v-model="manualTestText" class="dark-input" placeholder="在此手動輸入錯字草稿進行測試..."
                        @keyup.enter="runManualTest" />
                    <button class="tech-btn blue-btn" @click="runManualTest">⚡ 手動發射</button>
                </div>
            </section>

            <section class="battle-arena-section" v-if="rawInput || loading">
                <div class="battle-arena">

                    <div class="arena-card legacy-card">
                        <div class="card-header legacy-header">
                            <span class="header-icon">🏠</span> 傳統語音辨識 (Web Speech)
                        </div>
                        <div class="text-content">
                            <p class="label">前端轉出的錯字草稿：</p>
                            <div class="result-box raw-box">
                                {{ rawInput || '（等待錄音中...）' }}
                            </div>
                        </div>
                        <div class="card-footer legacy-footer">
                            <span class="status-badge error">❌ 財經專用詞辨識率低</span>
                        </div>
                    </div>

                    <div class="vs-divider">
                        <div class="vs-circle">VS</div>
                        <span class="vs-arrow">修正為 ➔</span>
                    </div>

                    <div class="arena-card ai-card" v-loading="loading" element-loading-text="RTX 4060 Ti 正在思考喵..."
                        element-loading-background="rgba(15, 23, 42, 0.8)">
                        <div class="card-glow"></div>
                        <div class="card-header ai-header">
                            <span class="header-icon">✨</span> MoneyMMA QLoRA 模型
                        </div>
                        <div class="text-content relative-z">
                            <p class="label">後端修正後的記帳文字：</p>
                            <div class="result-box corrected-box" v-if="correctionResult">
                                {{ correctionResult.corrected_text }}
                            </div>
                        </div>
                        <div class="card-footer ai-footer relative-z" v-if="correctionResult">
                            <span class="status-badge success">⚡ 推論耗時：{{ correctionResult.inference_time_ms }} ms</span>
                        </div>
                        <div class="card-footer ai-footer relative-z" v-else>
                            <span class="status-badge pending">等待後端運算中...</span>
                        </div>
                    </div>

                </div>

                <div class="glass-panel final-confirmation-area" v-if="correctionResult">
                    <div class="confirm-title">🧐 小主人，AI 修正的結果正確嗎喵？</div>

                    <div class="final-input-row">
                        <input v-model="finalUserText" :disabled="!isEditingFinal" class="final-text-input"
                            :class="{ 'editing': isEditingFinal }" />
                        <button v-if="!isEditingFinal" class="tech-btn outline-btn" @click="isEditingFinal = true">
                            ✏️ 手動微調
                        </button>
                        <button v-else class="tech-btn green-btn" @click="isEditingFinal = false">
                            💾 完成修改
                        </button>
                    </div>

                    <div class="confirm-action-box">
                        <button class="tech-btn" :class="isAiFailed ? 'massive-warning-btn' : 'massive-primary-btn'"
                            @click="confirmAndSaveLog">
                            {{ isAiFailed ? '🛠️ 儲存人類修正 (這筆 AI 翻車了)' : '👍 確認正確，這筆算 AI 命中！' }}
                        </button>
                        <p class="hint">系統將紀錄最終文字至資料庫 (asr_correction_log)，用於計算期末系統準確率。</p>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
/* 整體頁面設定：深色科技風 */
.mma-lab-page {
    min-height: 100vh;
    background: radial-gradient(circle at top center, #1e293b 0%, #0f172a 100%);
    color: #f8fafc;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 40px 20px;
    display: flex;
    justify-content: center;
}

.mma-lab-content {
    width: 100%;
    max-width: 1100px;
}

/* Header 設計 */
.mma-lab-header {
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.icon-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 16px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
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

.brand-text strong {
    color: #60a5fa;
}

/* 按鈕共用設定 */
.nav-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.nav-btn.danger-hover:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
}

/* 玻璃透視面板 */
.glass-panel {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 35px;
    margin-bottom: 30px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* 操作區 (麥克風與手動輸入) */
.action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.section-title {
    font-size: 1.3rem;
    color: #e2e8f0;
    margin-bottom: 25px;
    font-weight: 600;
}

/* 麥克風按鈕特效 */
.mic-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.mic-btn {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    border: none;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    font-size: 2.5rem;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;
    box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
}

.mic-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 15px 35px rgba(37, 99, 235, 0.6);
}

/* 錄音中紅色呼吸燈 */
.mic-btn.recording {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    animation: pulse-red 1.5s infinite;
}

@keyframes pulse-red {
    0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }

    70% {
        box-shadow: 0 0 0 25px rgba(239, 68, 68, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
}

.status-text {
    color: #94a3b8;
    font-size: 0.95rem;
}

.recording-text {
    color: #fca5a5;
    font-weight: 600;
}

.manual-test-divider {
    margin: 30px 0;
    width: 100%;
    position: relative;
    text-align: center;
}

.manual-test-divider::before {
    content: '';
    position: absolute;
    left: 20%;
    right: 20%;
    top: 50%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
}

.manual-test-divider span {
    background: #1e293b;
    padding: 0 15px;
    color: #64748b;
    position: relative;
    font-size: 0.9rem;
}

/* 手動輸入框 */
.manual-test-box {
    display: flex;
    gap: 15px;
    width: 100%;
    max-width: 600px;
}

.dark-input {
    flex: 1;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 12px 20px;
    color: #f8fafc;
    font-size: 1rem;
    transition: border-color 0.3s;
}

.dark-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(0, 0, 0, 0.3);
}

.tech-btn {
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    color: white;
}

.blue-btn {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.blue-btn:hover {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
    transform: translateY(-2px);
}

.green-btn {
    background: linear-gradient(135deg, #059669, #10b981);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.green-btn:hover {
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    transform: translateY(-2px);
}

/* 擂台區塊 */
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
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.legacy-card {
    border: 1px solid rgba(148, 163, 184, 0.2);
}

.ai-card {
    border: 1px solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 10px 30px rgba(59, 130, 246, 0.1);
}

/* AI 發光背景 */
.card-glow {
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    background: #3b82f6;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.2;
    z-index: 0;
}

.relative-z {
    position: relative;
    z-index: 1;
}

.card-header {
    padding: 15px 20px;
    font-weight: 600;
    font-size: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    background: rgba(0, 0, 0, 0.2);
}

.legacy-header {
    color: #94a3b8;
}

.ai-header {
    color: #60a5fa;
}

.text-content {
    padding: 25px 20px;
    flex-grow: 1;
}

.label {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 10px;
}

.result-box {
    font-size: 1.25rem;
    line-height: 1.6;
    min-height: 80px;
    word-break: break-all;
}

.raw-box {
    color: #cbd5e1;
    font-style: italic;
}

.corrected-box {
    color: #f8fafc;
    font-weight: 600;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.card-footer {
    padding: 15px 20px;
    background: rgba(0, 0, 0, 0.3);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.status-badge {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-badge.error {
    background: rgba(239, 68, 68, 0.1);
    color: #fca5a5;
    border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-badge.success {
    background: rgba(59, 130, 246, 0.1);
    color: #93c5fd;
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-badge.pending {
    background: rgba(148, 163, 184, 0.1);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.2);
}

/* VS 分隔符號 */
.vs-divider {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 10px;
    padding: 0 10px;
}

.vs-circle {
    width: 45px;
    height: 45px;
    background: #1e293b;
    border: 2px solid #334155;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 800;
    color: #94a3b8;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.vs-arrow {
    color: #475569;
    font-size: 0.85rem;
    font-weight: 600;
    letter-spacing: 1px;
}

/* 最終確認區塊 */
.final-confirmation-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}

.confirm-title {
    font-size: 1.2rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 20px;
}

.final-input-row {
    display: flex;
    gap: 15px;
    width: 100%;
    max-width: 800px;
    margin-bottom: 30px;
}

/* 文字框狀態切換：平時像純文字，編輯時像輸入框 */
.final-text-input {
    flex: 1;
    background: transparent;
    border: 1px solid transparent;
    color: #60a5fa;
    font-size: 1.3rem;
    font-weight: 700;
    text-align: center;
    padding: 12px;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.final-text-input.editing {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #3b82f6;
    color: #f8fafc;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
}

.outline-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #cbd5e1;
}

.outline-btn:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.4);
}

.confirm-action-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
}

.massive-primary-btn {
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    padding: 16px 40px;
    font-size: 1.15rem;
    border-radius: 50px;
    box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
}

.massive-primary-btn:hover {
    box-shadow: 0 15px 35px rgba(99, 102, 241, 0.6);
    transform: translateY(-3px);
}

.hint {
    color: #64748b;
    font-size: 0.85rem;
    margin: 0;
}

/* 響應式 */
@media (max-width: 900px) {
    .battle-arena {
        flex-direction: column;
    }

    .vs-divider {
        flex-direction: row;
        padding: 15px 0;
    }

    .vs-arrow {
        transform: rotate(90deg);
    }

    .final-input-row {
        flex-direction: column;
    }
}

/* 🌟 AI 翻車時的人類修正按鈕 (橘黃色系) */
.massive-warning-btn {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    padding: 16px 40px;
    font-size: 1.15rem;
    border-radius: 50px;
    box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4);
    color: white;
}

.massive-warning-btn:hover {
    box-shadow: 0 15px 35px rgba(245, 158, 11, 0.6);
    transform: translateY(-3px);
}

</style>