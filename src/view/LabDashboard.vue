<script setup>
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
const router = useRouter();

// const navigateTo = (path) => {
//     router.push(path);
// };

const navigateTo = (path) => {
    console.log(`🚀 [LabDashboard] 準備跳轉至: ${path}`);
    router.push(path).then(() => {
        console.log(`✅ [LabDashboard] 跳轉成功！`);
    }).catch(err => {
        console.error(`❌ [LabDashboard] 跳轉失敗，原因:`, err);
    });
};


const handleLogout = () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('currentUser');
    ElMessage.success('已安全登出喵！');
    router.push('/');
};

</script>

<template>
    <div class="mma-lab-page">
        <div class="mma-lab-content">
            <header class="mma-lab-header">
                <div class="header-main">
                    <div class="brand-box">
                        <div class="icon-wrapper">
                            <span class="sparkle">🔬</span>
                        </div>
                        <div class="brand-text">
                            <h1>邱比特 AI 實驗室大廳</h1>
                            <p>MoneyMMA 核心模型效能測試與驗證中心</p>
                        </div>
                    </div>
                    <button class="nav-btn danger-hover" @click="handleLogout">
                        🚪 登出
                    </button>
                </div>
            </header>

            <section class="module-cards-container">

                <div class="tech-card action-card" @click="navigateTo('/SpeechCorrectionLab')">
                    <div class="card-glow blue-glow"></div>
                    <div class="card-content">
                        <div class="card-icon-container blue-bg">
                            <span class="card-icon">🎤</span>
                        </div>
                        <h2>語音糾錯擂台</h2>
                        <p class="desc">Web Speech API 對決 Qwen2.5-LoRA 模型，測試財經情境之語音辨識與糾錯能力。</p>
                        <div class="card-footer">
                            <button class="action-btn blue-btn">進入測試 ⚡</button>
                        </div>
                    </div>
                </div>

                <div class="tech-card action-card" @click="navigateTo('/TestAI')">
                    <div class="card-glow purple-glow"></div>
                    <div class="card-content">
                        <div class="card-icon-container purple-bg">
                            <span class="card-icon">🧠</span>
                        </div>
                        <h2>大腦競技場 <span class="subtitle">(意圖識別)</span></h2>
                        <p class="desc">傳統 Regex、V1 ONNX 與 V2 混合路由三強對決。支援單句測試與批次 Excel 盲測。</p>
                        <div class="card-footer">
                            <button class="action-btn purple-btn">進入對決 ⚡</button>
                        </div>
                    </div>
                </div>
<!-- RagSandbox -->

                <div class="tech-card action-card" @click="navigateTo('/RagSandbox')">
    <div class="card-glow silver-glow"></div> <div class="card-content">
        <div class="card-icon-container silver-bg"> <span class="card-icon">🧪</span>
        </div>
        <h2>B1 向量機房實驗室</h2>
        <p class="desc">微調 HNSW 索引參數，監測 RTX 4060 Ti 即時效能。 HNSW Parameter Tuning & Inference Monitor.</p>
        <div class="card-footer">
            <button class="action-btn silver-btn">進入沙盒 | ENTER SANDBOX ⚡</button> </div>
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
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    padding: 40px 20px;
    display: flex;
    justify-content: center;
}

.mma-lab-content {
    width: 100%;
    max-width: 1200px;
}

/* Header 設計 */
.mma-lab-header {
    margin-bottom: 50px;
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
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.05);
}

.brand-text h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 5px 0;
    background: linear-gradient(to right, #ffffff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.brand-text p {
    margin: 0;
    color: #94a3b8;
    font-size: 0.95rem;
    letter-spacing: 0.5px;
}

/* 返回按鈕 */
.nav-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.nav-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-3px);
}

/* 卡片容器 */
.module-cards-container {
    display: flex;
    gap: 30px;
    justify-content: center;
    flex-wrap: wrap;
}

/* 科技風卡片本體 */
.tech-card {
    flex: 1;
    min-width: 300px;
    max-width: 380px;
    position: relative;
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 30px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 懸浮效果 */
.tech-card:hover {
    transform: translateY(-8px);
    border-color: rgba(255, 255, 255, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* 卡片背景光暈 */
.card-glow {
    position: absolute;
    top: -50px;
    right: -50px;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: 0;
}

.tech-card:hover .card-glow {
    opacity: 0.5;
}

.blue-glow {
    background: #3b82f6;
}

.purple-glow {
    background: #a855f7;
}

/* 卡片內容層 (確保在光暈上方) */
.card-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
}

/* 圓形 Icon 容器 */
.card-icon-container {
    width: 70px;
    height: 70px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    margin-bottom: 25px;
}

.blue-bg {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
}

.purple-bg {
    background: rgba(168, 85, 247, 0.1);
    border: 1px solid rgba(168, 85, 247, 0.2);
}

.tech-card h2 {
    font-size: 1.5rem;
    margin: 0 0 15px 0;
    font-weight: 600;
}

.subtitle {
    font-size: 1rem;
    color: #94a3b8;
    font-weight: 400;
}

.desc {
    color: #cbd5e1;
    line-height: 1.6;
    margin: 0;
    flex-grow: 1;
    font-size: 0.95rem;
}

/* 底部操作按鈕 */
.card-footer {
    margin-top: 30px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 20px;
}

.action-btn {
    width: 100%;
    padding: 12px;
    border-radius: 12px;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
}

.blue-btn {
    background: linear-gradient(135deg, #2563eb, #3b82f6);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
}

.blue-btn:hover {
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
}

.purple-btn {
    background: linear-gradient(135deg, #7e22ce, #a855f7);
    box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
}

.purple-btn:hover {
    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
}

/* 響應式設計 */
@media (max-width: 768px) {
    .header-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 20px;
    }

    .module-cards-container {
        flex-direction: column;
    }

    .tech-card {
        max-width: 100%;
    }
}
/* 🌟 科技銀按鈕 (Silver Metallic Gradient) */
.silver-btn {
    background: linear-gradient(135deg, #f8fafc, #94a3b8) !important;
    box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
    color: #0f172a !important; /* 深色文字增加對比 */
    font-weight: 800;
    border-radius: 12px;
    transition: all 0.3s;
}

.silver-btn:hover {
    background: linear-gradient(135deg, #ffffff, #cbd5e1) !important;
    box-shadow: 0 6px 20px rgba(255, 255, 255, 0.25);
    transform: translateY(-3px);
}

/* 🌟 科技銀發光效果 */
.silver-glow { 
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
}

/* 🌟 科技銀 Icon 容器 */
.silver-bg {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>