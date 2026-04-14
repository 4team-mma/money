<script setup>
/**
 * 邱比特大腦：財經語音糾錯擂台 (LoRA 展示版)
 */
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// 隊長，請確保你有在 api/ robot.js 新增後端的 /api/ai/correct/process 接口
import { processSpeechCorrection, updateFinalCorrectedText } from '@/api/robot';
import { ElMessage } from 'element-plus';

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

// Web Speech API 初始化
onMounted(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        ElMessage.error('瀏覽器不支援 Web Speech API，請使用 Chrome 或 Edge！');
        return;
    }
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.interimResults = false; // 為了展示對比，我們講完一次送出，不要即時上字
    recognition.continuous = false;

    recognition.onstart = () => {
        isRecording.value = true;
        rawInput.value = '';
        correctionResult.value = null; // 清空上次結果
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        rawInput.value = transcript;
        ElMessage.success('語音接收完成，正在送往 RTX 4060 Ti 糾錯喵！');
        sendToBackendForCorrection(transcript); // 拿到草稿直接送後端
    };

    recognition.onerror = (event) => {
        console.error("語音辨識錯誤:", event.error);
        isRecording.value = false;
        ElMessage.error('麥克風開小差了喵...');
    };

    recognition.onend = () => {
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
    loading.value = true;
    try {
        const res = await processSpeechCorrection(text);
        correctionResult.value = res.data || res;

        // 預設將 AI 的答案作為最終結果
        finalUserText.value = correctionResult.value.corrected_text;

        ElMessage.success('QLoRA 糾錯完成喵！');
    } catch (err) {
        console.error("糾錯失敗:", err);
        ElMessage.error('後端 AI 燒壞了喵...');
        // 失敗時，結果顯示原始文字
        correctionResult.value = {
            raw_text: text,
            corrected_text: '（AI 修正失敗）',
            inference_time_ms: 0
        }
    } finally {
        loading.value = false;
    }
};

// 手動輸入文字測試 (如果不方便錄音時)
const manualTestText = ref('');
const runManualTest = () => {
    if (!manualTestText.value.trim()) return;
    rawInput.value = manualTestText.value;
    sendToBackendForCorrection(manualTestText.value);
}

// 使用者確認並記帳 (Human-in-the-loop)
const confirmAndSaveLog = async () => {
    if (!correctionResult.value || !correctionResult.value.log_id) return;

    try {
        // 更新資料庫中的 final_user_text，用來計算準確率
        await updateFinalCorrectedText(correctionResult.value.log_id, finalUserText.value);

        ElMessage.success('✅ 成效紀錄已入庫！(評審這筆算我們命中)');
        // 隊長，這裡之後可以接原本的記帳邏輯
    } catch (err) {
        ElMessage.error('存入成效失敗。');
    }
};

</script>

<template>
    <div class="mma-lab-page">
        <div class="mma-lab-content">
            <header class="mma-lab-header mma-card-shadow">
                <div class="header-main">
                    <div class="brand-box">
                        <span class="sparkle">🎤</span>
                        <div class="brand-text">
                            <h1>🚀 邱比特語音擂台：QLoRA 糾錯實驗室</h1>
                            <p>Web Speech API (C++) vs <strong>MoneyMMA 財經糾錯模型 (Qwen2.5-LoRA)</strong></p>
                        </div>
                    </div>
                    <button class="mma-btn solid danger" @click="router.push('/dashboard')">🔙 返回首頁</button>
                </div>
            </header>

            <section class="mma-card-shadow arena-section input-area text-center">
                <h2>小主人請講話喵：</h2>
                <button class="mic-btn" :class="{ 'recording': isRecording }" @click="toggleRecording">
                    <span v-if="!isRecording">🎤 開始錄音</span>
                    <span v-else>🛑 停止錄音</span>
                </button>
                <p class="status-text">{{ isRecording ? '正在聆聽中... 請說 "去全連刷溜溜卡買菜花了以前"' : '點擊按鈕發動語音記帳' }}</p>

                <div class="manual-test">
                    <input v-model="manualTestText" placeholder="或者手動輸入錯字草稿測試..." @keyup.enter="runManualTest" />
                    <button @click="runManualTest">手動測試</button>
                </div>
            </section>

            <section class="mma-card-shadow arena-section battle-arena-container" v-if="rawInput || loading">

                <div class="battle-arena" style="display: flex; gap: 30px; align-items: stretch;">

                    <div class="arena-card legacy" style="flex: 1;">
                        <div class="card-header legacy-header">🏠 傳統語音辨識 (Web Speech)</div>
                        <div class="text-content">
                            <p class="label">前端轉出的錯字草稿：</p>
                            <div class="raw-box">{{ rawInput || '（等待錄音中...）' }}</div>
                        </div>
                        <div class="card-footer">❌ 財經專用詞辨識率低</div>
                    </div>

                    <div class="vs-divider">👉 修正為 👉</div>

                    <div class="arena-card mixai" style="flex: 1;" v-loading="loading"
                        element-loading-text="RTX 4060 Ti 正在思考喵...">
                        <div class="card-header mixai-header">✨ MoneyMMA QLoRA 模型</div>
                        <div class="text-content">
                            <p class="label">後端修正後的記帳文字：</p>
                            <div class="corrected-box highlight" v-if="correctionResult">
                                {{ correctionResult.corrected_text }}
                            </div>
                        </div>
                        <div class="card-footer" v-if="correctionResult">
                            ⚡ 推論耗時：<b>{{ correctionResult.inference_time_ms }} ms</b>
                        </div>
                        <div class="card-footer" v-else>
                            等待後端運算...
                        </div>
                    </div>

                </div>

                <div class="final-confirmation-area mma-card-shadow" v-if="correctionResult">
                    <div class="confrim-title">🧐 小主人，AI 修正的結果正確嗎喵？</div>

                    <div class="final-input-row">
                        <input v-model="finalUserText" :disabled="!isEditingFinal" class="final-text-input"
                            :class="{ 'editing': isEditingFinal }" />
                        <button v-if="!isEditingFinal" class="mma-btn outline" @click="isEditingFinal = true">✏️
                            手動修改</button>
                        <button v-else class="mma-btn solid success" @click="isEditingFinal = false">💾 完成修改</button>
                    </div>

                    <button class="mma-btn solid primary confirm-btn" @click="confirmAndSaveLog">
                        👍 確認正確，這筆算 AI 命中！
                    </button>
                    <p class="hint">(此操作會將最終文字存入 asr_correction_log.final_user_text，用來計算期末準確率)</p>
                </div>

            </section>
        </div>
    </div>
</template>

<style scoped></style>