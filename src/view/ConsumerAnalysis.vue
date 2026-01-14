<script setup>
import Nav from '@/components/Nav.vue';
import { ref, onMounted, computed, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import api from '@/api'; // 請確認你的 api 設定正確
import { getCpiComparison } from '@/api/analysis';
// --- 狀態變數 ---
const loading = ref(true);
const errorMsg = ref('');
const chartCanvas = ref(null);
const chartInstance = ref(null);
const rawData = ref([]); // 存後端回傳的原始資料

const now = new Date();
const currentYear = ref(now.getFullYear());       // 自動抓 2026
const currentMonth = ref(now.getMonth() + 1);     // 自動抓 1 (JS月份是0-11所以要+1)

// --- 計算屬性 (讓數據卡片動態變化) ---
const totalSpending = computed(() => {
    return rawData.value.reduce((sum, item) => sum + item.my_spending, 0);
});

const maxCpiCategory = computed(() => {
    if (rawData.value.length === 0) return { category: '無', rate: 0 };
    // 找出 CPI 最高的類別
    return rawData.value.reduce((prev, current) =>
        (prev.gov_cpi_rate > current.gov_cpi_rate) ? prev : current
        , { category: '無', rate: 0 });
});

// --- 核心功能：載入資料並畫圖 ---
const fetchDataAndRender = async () => {
    loading.value = true;
    errorMsg.value = '';

    try {
        const res = await getCpiComparison({
            year: currentYear.value,
            month: currentMonth.value
        });

        // 處理資料格式
        if (Array.isArray(res)) {
            rawData.value = res;
        } else if (res.data && Array.isArray(res.data)) {
            rawData.value = res.data;
        } else {
            rawData.value = [];
        }

        if (rawData.value.length === 0) {
            errorMsg.value = "本月尚無消費紀錄或 CPI 資料";
        } else {
            // ✅ 關鍵修復：先讓 DOM 出現，再畫圖
            loading.value = false; // 1. 先關閉載入中，讓 v-else 的內容 (包含 canvas) 顯示出來
            await nextTick();      // 2. 等待 Vue 完成畫面更新
            renderChart(rawData.value); // 3. 畫布已經存在了，現在畫圖就不會報錯了！
        }

    } catch (err) {
        console.error("API 錯誤:", err);
        if (err.response && err.response.status === 401) {
            errorMsg.value = "登入逾時，請重新登入";
        } else {
            errorMsg.value = "資料載入失敗，請檢查網路或後端";
        }
    } finally {
        // loading.value = false; // ❌ 這行要拿掉，因為我們上面已經手動控制了
        if (errorMsg.value) loading.value = false; // 只有發生錯誤時才在這裡關閉
    }
};

const renderChart = (data) => {
    const ctx = chartCanvas.value.getContext('2d');

    if (chartInstance.value) {
        chartInstance.value.destroy();
    }

    chartInstance.value = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.category),
            datasets: [
                // 資料集 1: 你的花費 (長條圖)
                {
                    label: '我的花費 (TWD)',
                    data: data.map(item => item.my_spending),
                    // 使用漸層色讓長條圖更有質感
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(63, 94, 251, 0.8)'); // 上方深藍
                        gradient.addColorStop(1, 'rgba(70, 252, 244, 0.2)'); // 下方淺藍
                        return gradient;
                    },
                    borderRadius: 8,   // 圓角
                    barPercentage: 0.6, // 變瘦一點比較優雅
                    yAxisID: 'y',
                    order: 2
                },
                // 資料集 2: 全國 CPI (折線圖)
                {
                    label: '全國 CPI 年增率 (%)',
                    data: data.map(item => item.gov_cpi_rate),
                    type: 'line',
                    borderColor: '#FF6B6B', // 顯眼的珊瑚紅
                    backgroundColor: '#FF6B6B',
                    borderWidth: 4,         // 線條加粗
                    pointRadius: 6,         // 圓點加大
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'white', // 圓點中間白色
                    pointBorderWidth: 3,    // 圓點邊框
                    tension: 0.3,           // 微幅平滑曲線
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: 20 }, // 增加一點留白
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        font: { size: 14, family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif" },
                        usePointStyle: true // 使用圓點圖例代替方塊
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 16, weight: 'bold' },
                    bodyFont: { size: 14 },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        // 優化 Tooltip 顯示內容，加上單位
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.type === 'line') {
                                    label += context.parsed.y + '% 📈'; // 加上百分比符號
                                } else {
                                    label += '$' + context.parsed.y.toLocaleString(); // 加上金錢符號與千分位
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }, // 隱藏 X 軸網格比較乾淨
                    ticks: { font: { size: 14 } }
                },
                y: { // 左軸 (花費)
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: '消費金額 (TWD)', font: { weight: 'bold' } },
                    grid: { borderDash: [4, 4], color: '#e5e7eb' }, // 虛線網格
                    beginAtZero: true
                },
                y1: { // 右軸 (CPI) - 🔥 關鍵修改都在這裡
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'CPI 漲幅 (%)', font: { weight: 'bold', color: '#FF6B6B' } },
                    grid: { display: false },
                    // 🔥 強制設定刻度範圍，把紅線拉到中間
                    min: 0,
                    suggestedMax: 5, // 假設 CPI 通常不會超過 5%，這樣設定可以讓線條在圖表中上方波動
                    ticks: {
                        color: '#FF6B6B', // 刻度顏色跟著線條變紅
                        callback: function (value) {
                            return value + '%'; // 刻度加上 %
                        }
                    }
                }
            }
        }
    });
};

onMounted(() => {
    fetchDataAndRender();
});
</script>

<template>
    <Nav>
        <div class="page-container">
            <header class="header-section">
                <div>
                    <h1 class="page-title">📊 消費趨勢分析</h1>
                    <p class="subtitle">比較您的個人消費與全國物價指數 (CPI)</p>
                </div>
                <div class="date-controls">
                    <select v-model="currentYear" @change="fetchDataAndRender" class="date-select">
                        <option :value="2024">2024年</option>
                        <option :value="2025">2025年</option>
                        <option :value="2026">2026年</option>
                    </select>
                    <select v-model="currentMonth" @change="fetchDataAndRender" class="date-select">
                        <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                    </select>
                    <button @click="fetchDataAndRender" class="refresh-btn">🔄 重新整理</button>
                </div>
            </header>

            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>數據分析中...</p>
            </div>

            <div v-else-if="errorMsg" class="error-state">
                ⚠️ {{ errorMsg }}
            </div>

            <div v-else class="content-grid">

                <div class="stats-cards">
                    <div class="card stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <h3>本月總花費</h3>
                            <p class="stat-value">${{ totalSpending.toLocaleString() }}</p>
                        </div>
                    </div>

                    <div class="card stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <h3>通膨最嚴重類別</h3>
                            <p class="stat-value warning">
                                {{ maxCpiCategory.category }} (+{{ maxCpiCategory.gov_cpi_rate }}%)
                            </p>
                        </div>
                    </div>
                </div>

                <div class="card chart-section">
                    <div class="chart-container">
                        <canvas ref="chartCanvas"></canvas>
                    </div>
                </div>

                <div class="card ai-section">
                    <div class="ai-header">
                        <span class="ai-avatar">🤖</span>
                        <h3>AI 理財教練建議</h3>
                    </div>
                    <div class="ai-content">
                        <p>
                            根據數據顯示，您的 <strong>{{ maxCpiCategory.category }}</strong> 支出與全國通膨趨勢高度相關。
                            全國該類別漲幅為 {{ maxCpiCategory.gov_cpi_rate }}%，建議您可以檢視是否能夠尋找替代方案，
                            或是利用優惠券來抵銷通膨影響。
                        </p>
                    </div>
                </div>

            </div>
        </div>
    </Nav>
</template>

<style scoped>
/* 全局容器 */
.page-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', sans-serif;
}

/* 標題區 */
.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 15px;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0;
}

.subtitle {
    color: #7f8c8d;
    margin: 5px 0 0 0;
    font-size: 14px;
}

.date-badge {
    background: #e0e7ff;
    color: #4338ca;
    padding: 6px 12px;
    border-radius: 20px;
    font-weight: 600;
    margin-right: 10px;
}

.refresh-btn {
    background: #fff;
    border: 1px solid #ddd;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-btn:hover {
    background: #f9fafb;
}

/* 卡片通用樣式 */
.card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    border: 1px solid rgba(0, 0, 0, 0.02);
}

/* 數據卡片區 */
.stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 15px;
}

.stat-icon {
    font-size: 32px;
    background: #f3f4f6;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
}

.stat-info h3 {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
}

.stat-value {
    margin: 5px 0 0 0;
    font-size: 24px;
    font-weight: 800;
    color: #111827;
}

.stat-value.warning {
    color: #ef4444;
}

/* 圖表區 */
.chart-section {
    margin-bottom: 20px;
}

.chart-container {
    position: relative;
    height: 400px;
    /* 固定高度讓 chart.js 適應 */
    width: 100%;
}

/* AI 建議區 */
.ai-section {
    background: linear-gradient(135deg, #fdfbf7 0%, #fff 100%);
    border: 2px solid #fef3c7;
}

.ai-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.ai-avatar {
    font-size: 24px;
}

.ai-header h3 {
    margin: 0;
    color: #d97706;
}

.ai-content p {
    line-height: 1.6;
    color: #4b5563;
    margin: 0;
}

/* 載入與錯誤狀態 */
.loading-state,
.error-state {
    text-align: center;
    padding: 50px;
    color: #6b7280;
}

.error-state {
    color: #ef4444;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* RWD */
@media (max-width: 768px) {
    .header-section {
        justify-content: center;
        text-align: center;
    }

    .chart-container {
        height: 300px;
    }
}

.date-select {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: white;
    margin-right: 8px;
    font-size: 14px;
    cursor: pointer;
}

.date-select:hover {
    border-color: #4f46e5;
}
</style>