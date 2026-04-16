<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateTo = (path) => {
    router.push(path);
};
</script>

<template>
    <div class="mma-lab-page">
        <div class="mma-lab-content">
            <header class="mma-lab-header mma-card-shadow">
                <div class="header-main">
                    <div class="brand-box">
                        <span class="sparkle">🔬</span>
                        <div class="brand-text">
                            <h1>邱比特 AI 實驗室大廳</h1>
                            <p>請選擇您要進行測試的模組</p>
                        </div>
                    </div>
                    <button class="mma-btn outline" @click="navigateTo('/dashboard')">🔙 返回系統首頁</button>
                </div>
            </header>

            <section class="module-cards-container">
                <div class="mma-card-shadow action-card" @click="navigateTo('/SpeechCorrectionLab')">
                    <div class="card-icon">🎤</div>
                    <h2>語音糾錯擂台</h2>
                    <p>Web Speech API 對決 MoneyMMA Qwen2.5-LoRA 模型，測試財經語音辨識與糾錯能力。</p>
                    <button class="mma-btn solid primary mt-3">進入測試 🐾</button>
                </div>

                <div class="mma-card-shadow action-card" @click="navigateTo('/TestAI')">
                    <div class="card-icon">🧠</div>
                    <h2>大腦競技場 (意圖識別)</h2>
                    <p>傳統 Regex、V1 ONNX 模型與 V2 混合路由的三強對決，支援單句與批次 Excel 盲測。</p>
                    <button class="mma-btn solid primary mt-3">進入對決 🐾</button>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.module-cards-container {
    display: flex;
    gap: 30px;
    margin-top: 20px;
    justify-content: center;
}

.action-card {
    flex: 1;
    max-width: 400px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border-top: 4px solid #3b82f6; /* 可以依據模組換顏色 */
}

.action-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.card-icon {
    font-size: 4rem;
    margin-bottom: 15px;
}

.mt-3 {
    margin-top: 20px;
}
</style>