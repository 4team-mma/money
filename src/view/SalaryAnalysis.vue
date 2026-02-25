<script setup>
import Nav from '@/components/Nav.vue';
import { ref, onMounted, computed, nextTick, watch } from 'vue';
import Chart from 'chart.js/auto';
import { getSalaryComparison, getRealSalaryTrend } from '@/api/analysis';
import { triggerMissionAction } from '@/api/gamification';
// --- 官方行業清單 (請確保與資料庫中的 industry 欄位完全一致) ---
const INDUSTRIES = [
    "教育業",
    "製造業",
    "批發及零售業",
    "資訊軟體及資訊服務業(尚在開發中)",
    "醫療保健及社會工作服務業",
    "住宿及餐飲業",
    "金融及保險業",
    "藝術娛樂及休閒服務業(尚在開發中)",
    "營建工程業",
    "運輸及倉儲業",
    "不動產業",
    "專業科學及技術服務業",
    "出版影音製作傳播及資通訊服務業(尚在開發中)",
    "支援服務業",

];

// --- 狀態與變數 ---
const loading = ref(true);
const errorMsg = ref('');
const trendChartCanvas = ref(null);
const trendChartInstance = ref(null);

// 使用者選擇的行業 (預設為教育業)
const selectedIndustry = ref("教育業");

// 資料狀態
const salaryData = ref(null);      // 個人收入資料
const trendData = ref([]);        // 12個月趨勢與基準資料

// 日期選擇
const now = new Date();
const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth() + 1);

// --- 計算屬性 ---
// 💡 修正：直接從趨勢數據中提取最新的「名目薪資」作為行業平均基準
const industryBenchmark = computed(() => {
    if (trendData.value.length === 0) return 0;
    // 取最後一筆 (最新月份) 的名目薪資
    return trendData.value[trendData.value.length - 1].nominal_salary;
});

const myRealSalary = computed(() => {
    // 如果個人收入是 0，實質薪資理所當然就是 0
    if (!salaryData.value || salaryData.value.user_income === 0) return 0;

    // 取得最新月份的通膨調整比例 (實質 / 名目)
    if (trendData.value.length === 0) return 0;
    const latest = trendData.value[trendData.value.length - 1];
    const inflationFactor = latest.real_salary / latest.nominal_salary;

    // 用個人的收入去乘這個比例，才是個人的實質薪資
    return salaryData.value.user_income * inflationFactor;
});



// 計算個人收入與行業平均的差距
const performanceRatio = computed(() => {
    if (!salaryData.value || industryBenchmark.value === 0) return 0;
    return ((salaryData.value.user_income / industryBenchmark.value) * 100 - 100).toFixed(1);
});

// 最新一個月的購買力 (實質薪資)
const currentRealSalary = computed(() => {
    if (trendData.value.length === 0) return 0;
    return trendData.value[trendData.value.length - 1].real_salary;
});

// --- API 請求與畫圖 ---
const fetchData = async () => {
    loading.value = true;
    errorMsg.value = '';

    try {
        // 1. 獲取個人當月收入 (不論職業為何，只取 user_income)
        const comparisonRes = await getSalaryComparison({
            year: currentYear.value.toString(),
            month: currentMonth.value.toString()
        });
        salaryData.value = comparisonRes;

        // 2. 根據所選行業獲取趨勢 (包含名目與實質薪資)
        const trendRes = await getRealSalaryTrend({
            industry: selectedIndustry.value
        });
        trendData.value = trendRes;

        loading.value = false;

        if (trendData.value.length > 0) {
            await nextTick();
            renderTrendChart(trendData.value);
        } else {
            errorMsg.value = `目前資料庫中尚無「${selectedIndustry.value}」的相關數據`;
        }
    } catch (err) {
        loading.value = false;
        errorMsg.value = "資料庫連線失敗，請檢查後端服務";
        console.error(err);
    }
};

// 監聽選擇變動
watch([selectedIndustry, currentYear, currentMonth], () => {
    fetchData();
});

const renderTrendChart = (data) => {
    const ctx = trendChartCanvas.value.getContext('2d');
    if (trendChartInstance.value) trendChartInstance.value.destroy();

    trendChartInstance.value = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.period),
            datasets: [
                {
                    label: '名目薪資 (行業平均)',
                    data: data.map(item => item.nominal_salary),
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3
                },
                {
                    label: '實質薪資 (扣除通膨)',
                    data: data.map(item => item.real_salary),
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    tension: 0.4,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: { callback: (val) => '$' + val.toLocaleString() },
                    title: { display: true, text: '金額 (TWD)' }
                }
            }
        }
    });
};

onMounted(() => {
    fetchData();
    // 🌟 核心修改：進入頁面即觸發「了解行情」任務進度
    triggerMissionAction('view_salary');
});
</script>

<template>
    <Nav>
        <div class="page-container">
            <header class="header-section">
                <div>
                    <h1 class="page-title">💲 薪資分析</h1>
                    <p class="subtitle">針對不同行業進行薪資水平與通膨比對</p>
                </div>
                <div class="controls-group">
                    <select v-model="selectedIndustry" class="industry-select">
                        <option v-for="job in INDUSTRIES" :key="job" :value="job">{{ job }}</option>
                    </select>
                    <div class="date-controls">
                        <select v-model="currentYear" class="date-select">
                            <option v-for="y in [2024, 2025, 2026]" :key="y" :value="y">{{ y }}年</option>
                        </select>
                        <select v-model="currentMonth" class="date-select">
                            <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                        </select>
                    </div>
                </div>
            </header>

            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>正在分析數據...
            </div>
            <div v-else-if="errorMsg" class="error-state">⚠️ {{ errorMsg }}</div>

            <div v-else class="content-grid">
                <div class="stats-cards">
                    <div class="card stat-card">
                        <div class="stat-icon">💰</div>
                        <div class="stat-info">
                            <h3>個人月收入</h3>
                            <p class="stat-value">${{ salaryData.user_income.toLocaleString() }}</p>
                            <span :class="['trend-tag', performanceRatio >= 0 ? 'up' : 'down']">
                                {{ performanceRatio >= 0 ? '領先' : '落後' }}行業平均 {{ Math.abs(performanceRatio) }}%
                            </span>
                        </div>
                    </div>
                    <div class="card stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-info">
                            <h3>{{ selectedIndustry }} 平均</h3>
                            <p class="stat-value">${{ industryBenchmark.toLocaleString() }}</p>
                            <span class="trend-tag neutral">名目薪資基準</span>
                        </div>
                    </div>
                </div>

                <div class="card chart-section">
                    <div class="chart-header">
                        <h3>📉 實質薪資趨勢 ({{ selectedIndustry }})</h3>
                        <div class="legend">
                            <span class="dot nominal"></span> 名目薪資
                            <span class="dot real"></span> 實質薪資 (扣除通膨)
                        </div>
                    </div>
                    <div class="chart-container"><canvas ref="trendChartCanvas"></canvas></div>
                </div>
                <br>
                <div class="card ai-section">
                    <div class="ai-header">🚁 <h3>理財建議:</h3>
                    </div>
                    <div class="ai-content">
                        <h4 :class="performanceRatio >= 0 ? 'text-success' : 'text-danger'">
                            {{ performanceRatio >= 0 ? ' 財務表現優於同業🎉' : ' 購買力面臨挑戰⚠️' }}
                        </h4>

                        <p>
                            您的實質購買力為 <strong>${{ Math.round(myRealSalary).toLocaleString() }}</strong>。
                            雖然通膨率為 {{ ((1 - (currentRealSalary / industryBenchmark)) * 100).toFixed(1) }}%，
                            但因為您的薪資高出平均 <strong>{{ performanceRatio }}%</strong>，
                            這抵消了大部分的物價漲幅。
                        </p>

                        <div class="strategy-box" >
                            <strong style="color: var(--text-secondary)">🚀 專屬策略：</strong>
                            <span v-if="performanceRatio > 20" style="color: var(--text-secondary);">
                                您的收入增長已跑贏通膨！建議將薪資的 20% 投入抗通膨資產（如美股 ETF 或房地產 REITs），發揮複利效應。
                            </span>
                            <span v-else-if="performanceRatio >= 0" style="color: var(--text-secondary);">
                                目前處於穩健階段。建議維持記帳習慣，確保實質薪資的增長不被隨之擴張的慾望抵銷。
                            </span>
                            <span v-else style="color: var(--text-secondary);">
                                目前的薪資增長跟不上物價。建議重新審視訂閱服務或餐飲支出，並規劃轉職或技能進修以突破薪資天花板。
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Nav>
</template>

<style scoped>
.legend{color: var(--text-primary);}
p{color: var(--text-primary);}
h3{color: var(--text-primary);}
.subtitle{color: var(--text-primary);}
.page-title{
    color: var(--text-primary);
}

.stat-info{
    text-align: center;
}

.page-container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 20px;
}

.header-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}

.controls-group {
    display: flex;
    gap: 10px;
    align-items: center;
}

.industry-select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #4f46e5;
    background: #f5f3ff;
    color: #4338ca;
    font-weight: 600;
    cursor: pointer;
}

.date-select {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    margin-left: 5px;
    cursor: pointer;
    background-color: var(--bg-card);
    color: var(--text-primary)
}

.stats-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.card {
    background-color: var(--bg-card);;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 20px;
}

.stat-icon {
    font-size: 32px;
    background: #f1f5f9;
    padding: 12px;
    border-radius: 12px;
}

.stat-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    text-align: center;
}

.trend-tag {
    font-size: 12px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    display: inline-block;
    margin-top: 8px;
    
}

.up {
    background: #dcfce7;
    color: #166534;
}

.down {
    background: #fee2e2;
    color: #991b1b;
}

.neutral {
    background: #f1f5f9;
    color: #475569;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
}

.dot.nominal {
    background: #4f46e5;
}

.dot.real {
    background: #10b981;
}

.chart-container {
    height: 350px;
}

.ai-section {
    border-left: 5px solid #10b981;
    background: var(--bg-card);
}

.ai-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: #166534;
}

.ai-content {
    line-height: 1.6;
    color: #374151;
}

.loading-state {
    text-align: center;
    padding: 80px;
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
    100% {
        transform: rotate(360deg);
    }
}
</style>