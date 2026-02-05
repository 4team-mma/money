<script setup>
import Nav from '@/components/Nav.vue';
import Chart_Preface from '@/components/ChartPreface.vue';
import { ref, computed, onMounted, watch } from 'vue';
import { statsApi } from '@/api/stats';
import { calculatePeriodDays } from '@/utils/financeHelper';
import { getLocalDate, getLocalDateString } from '@/utils/dateHelper';
import Chart from 'chart.js/auto';

// 顯示當天日期
const today = computed(() => {
    const now = new Date();
    const weekMap = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
    return `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日・${weekMap[now.getDay()]}`;
})
const dailyChartRef = ref(null)

// 表格連動下拉選單設定
// 下拉選單控制，預設月
const period = ref('month')

// 初始化日期 (使用本地時間)
const now = new Date();

// 自訂區間
const startDate = ref(getLocalDateString(new Date(now.getFullYear(), now.getMonth(), 1)));
const endDate = ref(getLocalDate());

let chartInstance = null

// 狀態管理
const categoryTableData = ref([]) 
const is_loading = ref(false)

// 分組狀態
const groupBy = ref('add_class') // 預設依類別 (add_class, account, add_member, add_tag)

// 根據 groupBy 的值回傳對應的表格標題
const tableLabel = computed(() => {
    const labelMap = {
        'add_class': '類別',
        'account': '帳戶',
        'add_member': '成員',
        'add_tag': '標籤'
    }
    return labelMap[groupBy.value] || '項目'
})

/**
 * 🌟 核心：直接使用 statsApi 獲取結果
 */
const loadData = async () => {
    is_loading.value = true
    try {
        const params = {
            start_date: startDate.value,
            end_date: endDate.value,
            group_by_field: groupBy.value // 傳送分組參數給後端
        }
        const data = await statsApi.getIncomeCategoryStats(params)
        categoryTableData.value = data 
        renderChart()
    } catch (error) {
        console.error("統計資料讀取失敗:", error)
    } finally {
        is_loading.value = false
    }
}

onMounted(() => loadData())

// 🌟 計算屬性 (保留在前端，處理 UI 邏輯)
const periodDays = computed(() => calculatePeriodDays(period.value, startDate.value, endDate.value))
const totalAmount = computed(() => categoryTableData.value.reduce((sum, i) => sum + i.amount, 0))
const averagePerDay = computed(() => {
    const days = periodDays.value;
    return (totalAmount.value > 0 && days > 0) 
        ? Math.round(totalAmount.value / days) 
        : 0;
});

const renderChart = () => {
    if (!dailyChartRef.value) return
    if (chartInstance) chartInstance.destroy()
    const chartData = categoryTableData.value
    if (chartData.length === 0) return
    // 判斷是否為標籤模式
    const isTagMode = groupBy.value === 'add_tag'
    
    chartInstance = new Chart(dailyChartRef.value, {
        // 標籤用橫向長條圖 (indexAxis: 'y')，其他維持圓餅圖
        type: isTagMode ? 'bar' : 'doughnut',
        data: {
            labels: chartData.map(i => i.category),
            datasets: [{
                label: '支出金額', // 長條圖需要 label
                data: chartData.map(i => i.amount),
                backgroundColor: isTagMode ? '#36A2EB' : ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
                borderWidth: 1,
                borderRadius: isTagMode ? 4 : 0 // 加點圓角的長條圖
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            indexAxis: isTagMode ? 'y' : 'x', // 讓長條圖橫向轉動
            plugins: { 
                legend: { 
                    display: !isTagMode, // 標籤模式下關閉圖例（因為 Y 軸已經有名字）
                    position: 'right' 
                } 
            },
            scales: isTagMode ? {
                x: { beginAtZero: true, grid: { display: false } },
                y: { grid: { display: false } }
            } : {}
        }
    })
}

function validateDateRange() {
    if (startDate.value && endDate.value) {
        if (startDate.value > endDate.value) {
            alert("結束日期不能早於起始日期！")
            // 自動把結束日期調整為起始日期
            endDate.value = startDate.value
        }
    }
}

watch([period, startDate, endDate, groupBy], (newVal, oldVal) => {
    const currentNow = new Date();
    const periodChanged = newVal[0] !== oldVal[0];

    if (periodChanged && period.value === 'month') {
        startDate.value = getLocalDateString(new Date(currentNow.getFullYear(), currentNow.getMonth(), 1));
        endDate.value = getLocalDate();
        return;
    } else if (periodChanged && period.value === 'year') {
        startDate.value = `${currentNow.getFullYear()}-01-01`;
        endDate.value = getLocalDate();
        return;
    }

    // 🌟 新增：只有在 custom 時做日期合法性檢查
    if (period.value === 'custom') {
        validateDateRange();
    }

    loadData();
});


</script>
<template>
    <Nav>
        <Chart_Preface />

        <!-- overview 小卡 -->
        <div style="display: flex; min-height: 100vh;">
            <!-- 本月收入 -->
            <div class="dashboard-container_1" style="flex: 1;">
                <h3>收入分析</h3>
                <span class="date">{{ today }}</span>
                <hr>
                <!-- 收入分析頁面 -->
                <!-- 收入分析圖表_(圓餅圖收入項目分析) -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header chart-description">
                            <!-- 切換分析維度 -->
                            <span>分析維度：</span>
                            <select class="my-select" v-model="groupBy" style="margin-right: 15px;">
                                <option value="add_class">按類別</option>
                                <option value="account">按帳戶</option>
                                <option value="add_member">按成員</option>
                                <option value="add_tag">按標籤</option>
                            </select>
                            <!-- 下拉選單 -->
                            <span>檢視期間：</span>
                            <select class="my-select" v-model="period">
                                <option value="month">當月</option>
                                <option value="year">當年</option>
                                <option value="custom">自訂</option>
                            </select>
                            <div v-if="period === 'custom'">
                                <span>起始日期 </span>
                                <input type="date" v-model="startDate" class="custom-select" />
                                <span style="margin: 0 6px;">～</span>
                                <span>結束日期 </span>
                                <input type="date" v-model="endDate" class="custom-select" />
                            </div>
                        </div>
                        <div class="chart-wrapper" style="position: relative; height: 350px; width: 100%;">
                            <div v-if="is_loading" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">加載中...</div>
                            <canvas ref="dailyChartRef"></canvas>
                        </div>
                        <div class="summary">
                            <div>合計：NT${{ totalAmount.toLocaleString() }}</div>
                            <div>平均每天：NT${{ averagePerDay.toLocaleString() }}</div>
                        </div>
                    </div>
                </div>
                <!-- 收入_文字 -->
                <table class="money-table">
                    <thead>
                        <tr>
                            <th>排序</th>
                            <th>{{ tableLabel }}</th>
                            <th>金額</th>
                            <th>比例</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in categoryTableData" :key="row.category">
                            <td>{{ row.id }}</td>
                            <td>{{ row.category  }}</td>
                            <td>NT${{ row.amount.toLocaleString() }}</td>
                            <td>{{ row.ratio.toFixed(1) }}%</td>
                        </tr>
                        <tr v-if="categoryTableData.length === 0 && !is_loading">
                            <td colspan="4" style="text-align: center; padding: 40px; color: #999;">此期間尚無收入資料</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>



    </Nav>
</template>
<style scoped>
@import '../assets/css/dashboard.css';

.PageTurn {
    display: flex;
    justify-content: center;
}

h2 {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
}

.page {
    max-width: 820px;
    margin: 0 auto;
    /* padding: 24px; */
    background: linear-gradient(135deg, rgba(69, 179, 243, 0.05), rgba(161, 187, 243, 0.05));
    padding: 1rem;
    border-radius: 12px;
    /* height: 100vh; */
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
}

.chart-card {
    background: linear-gradient(135deg, #fafafa 0%, #ffffff 100%);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid #e5e7eb;
}

.chart-header {
    margin-bottom: 20px;
}

.chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.chart-description {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
}

.chart-wrapper {
    position: relative;
    width: 100%;
    height: 350px;
}

/* 文字趨勢_日期的格式 */
.TitleForm {
    font-size: 18px;
    background-color: #779FBF;
    color: white;
    margin: 20px;
    padding: 3px;
    line-height: 30px;
    font-weight: 700;
    letter-spacing: 0.5em;
    text-indent: 1em;
    text-align: center;
}

/* 表格格式 */
.money-table {
    table-layout: fixed;
    text-align: center;
    /* width: 100%;
    max-width: 1290px; */
    margin: 20px;
    line-height: 10px;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
    width: 100%;
    margin-left: 1px;
}

.money-table th {
    background-color: #779FBF;
    color: white;
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
    padding: 12px 24px;
}

.money-table td {
    border-bottom: 1px solid rgba(119, 159, 191, 0.35);
    /* 每列底線 */
    padding: 12px 24px;
}

/* 最上面（thead 第一列）不要線 */
.money-table thead tr:first-child th {
    border-top: none;
}

/* 最下面（tbody 最後一列）不要線 */
.money-table tbody tr:last-child td {
    border-bottom: none;
}

/* 合計/平均每天統計的樣式 */
.summary {
    width: 100%;
    /* 跟表格同寬 */
    margin: 0 auto;
    /* 整排置中 */
    display: grid;
    grid-template-columns: 1fr 1fr;
    /* 兩欄等寬 */
    text-align: center;
    font-weight: 700;
}

.summary>div {
    padding: 8px 0;
}

.summary>div:first-child {
    border-right: 1px solid #ccc;
    /* 中間那條直線 */
}

.dashboard-container_1 {
    padding: 12px 24px 24px 24px;
    max-width: 1400px;
    margin: 0 auto;
    background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
    min-height: 100vh;
}

/* 下拉選單格式 */
.my-select {
    width: 5em;
    /* 約 3 個中文字 */
    padding: 1px 0px 1px 0px;
    border: 0.5px solid #94a3b8;
    /* 邊框顏色 */
    border-radius: 6px;
    /* 框內背景色 */
    background-color: #ffffff;
    /* 文字設定 */
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
}

.custom-select {
    width: 10em;
    padding: 1px 0px 1px 0px;
    border: 0.5px solid #94a3b8;
    border-radius: 6px;
    background-color: #ffffff;
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    letter-spacing: 0.15em;
    margin-top: 5pt;
}

.custom-select:focus {
    border-color: #94a3b8;
    outline: none;
}
</style>
