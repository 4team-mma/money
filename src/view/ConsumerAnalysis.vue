<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import { getCpiComparison } from '@/api/analysis';

// --- 狀態與變數 ---
const loading = ref(true);
const errorMsg = ref('');
const chartCanvas = ref(null);
const chartInstance = ref(null);
const rawData = ref([]); 

const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth() + 1);

// --- 計算屬性 ---
const totalSpending = computed(() => {
    return rawData.value.reduce((sum, item) => sum + item.my_spending, 0);
});

// 取得資料狀態備註 (顯示在 UI 頂部)
const statusInfo = computed(() => {
    if (rawData.value.length === 0) return { note: '尚無資料', isFallback: false };
    return {
        note: rawData.value[0].note,
        isFallback: rawData.value[0].is_fallback
    };
});

const maxCpiCategory = computed(() => {
    if (rawData.value.length === 0) return { category: '無', rate: 0 };
    return rawData.value.reduce((prev, current) =>
        (prev.gov_cpi_rate > current.gov_cpi_rate) ? prev : current
    );
});

// --- API 請求與畫圖 ---
const fetchDataAndRender = async () => {
    loading.value = true;
    errorMsg.value = '';

    try {
        const res = await getCpiComparison({
            year: currentYear.value.toString(),
            month: currentMonth.value.toString()
        });

        rawData.value = Array.isArray(res) ? res : (res.data || []);

        if (rawData.value.length === 0) {
            errorMsg.value = "本月尚無消費紀錄";
        } else {
            loading.value = false;
            await nextTick();
            renderChart(rawData.value);
        }
    } catch (err) {
        errorMsg.value = "連線失敗，請檢查後端服務";
        console.error(err);
    } finally {
        if (errorMsg.value) loading.value = false;
    }
};

const renderChart = (data) => {
    const ctx = chartCanvas.value.getContext('2d');
    if (chartInstance.value) chartInstance.value.destroy();

    chartInstance.value = new Chart(ctx, {
        data: {
            labels: data.map(item => item.category),
            datasets: [
                {
                    type: 'bar',
                    label: '我的花費 (NT$)',
                    data: data.map(item => item.my_spending),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)', // 專業藍
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 8,
                    yAxisID: 'y', // 對應左軸
                    barPercentage: 0.6,
                },
                {
                    type: 'line',
                    label: '全國 CPI 年增率 (%)',
                    data: data.map(item => item.gov_cpi_rate),
                    borderColor: '#ef4444', // 警示紅
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.4, // 圓滑曲線
                    fill: false, // 妳可以改為 true 變成面積圖
                    yAxisID: 'y1', // 對應右軸
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, padding: 20 }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.datasetIndex === 0) {
                                label += new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', maximumFractionDigits: 0 }).format(context.parsed.y);
                            } else {
                                label += context.parsed.y + '%';
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: '我的消費金額 (元)', color: '#3b82f6', font: { weight: 'bold' } },
                    ticks: { color: '#3b82f6' },
                    grid: { drawOnChartArea: true } // 只顯示左軸的格線
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: '全國物價漲幅 (%)', color: '#ef4444', font: { weight: 'bold' } },
                    ticks: { 
                        color: '#ef4444',
                        callback: (val) => val + '%' 
                    },
                    grid: { drawOnChartArea: false }, // 🌟 關鍵：關閉右軸格線，避免與左軸重疊誤導
                    // 🌟 強制讓 0 軸對齊，避免視覺偏差
                    beginAtZero: false 
                }
            }
        }
    });
};

onMounted(fetchDataAndRender);
</script>

<template>
        <div class="page-container">
            <header class="header-section">
                <div>
                    <h1 class="page-title">📊 消費趨勢分析</h1>
                    <p class="subtitle">比較個人消費與官方 CPI 物價指數</p>
                </div>
                <div class="date-controls">
                    <select v-model="currentYear" @change="fetchDataAndRender" class="date-select">
                        <option v-for="y in [2024, 2025, 2026]" :key="y" :value="y">{{ y }}年</option>
                    </select>
                    <select v-model="currentMonth" @change="fetchDataAndRender" class="date-select">
                        <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                    </select>
                </div>
            </header>

            <div v-if="!loading && rawData.length > 0" class="status-banner">
                <span :class="['badge', statusInfo.isFallback ? 'fallback' : 'fresh']">
                    {{ statusInfo.note }}
                </span>
            </div>

            <div v-if="loading" class="loading-state"><div class="spinner"></div>正在分析數據...</div>
            <div v-else-if="errorMsg" class="error-state">⚠️ {{ errorMsg }}</div>

            <div v-else class="content-grid">
                <div class="stats-cards">
                    <div class="card stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <h3>本月總花費</h3>
                            <p class="stat-value">${{ totalSpending.toLocaleString() }} </p>
                        </div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-info">
                            <h3>通膨最嚴重類別</h3>
                            <p class="stat-value warning">{{ maxCpiCategory.category }} (+{{ maxCpiCategory.gov_cpi_rate }}%)</p>
                        </div>
                    </div>
                </div>

                <div class="card chart-section">
                    <div class="chart-container"><canvas ref="chartCanvas"></canvas></div>
                </div>
                <br>
                <div class="card ai-section">
                    <div class="ai-header">🚁 <h3>理財建議 :</h3></div>
                    <div class="ai-content">
                        <p>
                            本月 <strong>{{ maxCpiCategory.category }}</strong> 全國漲幅達 {{ maxCpiCategory.gov_cpi_rate }}%。
                            建議檢視此項支出是否能尋找替代品，或調整消費策略以應對通膨。
                        </p>
                    </div>
                </div>
            </div>
        </div>
</template>

<style scoped>
p{color: var(--text-primary);}
h3{color: var(--text-primary);}
.subtitle{color: var(--text-primary);}
.page-container { max-width: 1000px; margin: 0 auto; padding: 20px; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; color: var(--text-primary); margin: 0; font-weight: 700;}
.date-select { padding: 8px; border-radius: 6px; border: 1px solid #cbd5e1; margin-left: 10px; background-color: var(--bg-card); color: var(--text-primary)}

/* 狀態標籤樣式 */
.status-banner { margin-bottom: 20px; }
.badge { padding: 6px 16px; border-radius: 50px; font-size: 13px; font-weight: 600; }
.fresh { background: #dcfce7; color: #166534; }
.fallback { background: #fef3c7; color: #92400e; }

.stats-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.card { background: var(--bg-card); border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
.stat-card { display: flex; align-items: center; gap: 15px; }
.stat-icon { font-size: 30px; }
.stat-value { font-size: 22px; font-weight: 700; margin: 0; text-align: center; color: var(--text-primary);}
.stat-value.warning { color: #ef4444; }

.chart-container { height: 350px; }
.ai-section { border-left: 5px solid #fbbf24; background: var(--bg-card); }
.ai-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: #b45309; }

.loading-state { text-align: center; padding: 50px; }
.spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>