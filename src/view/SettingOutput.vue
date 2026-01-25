<script setup>
import { ref, computed, watch } from 'vue'
import { settingApi } from '@/api/setting';
import { ElMessage } from 'element-plus';

// --- 狀態定義 ---
const reportType = ref('monthly')
const timeRange = ref('current-month') 
const reportFormat = ref('excel') 
const isExporting = ref(false);

// --- STEP 1: 報表類型選項 (移除自訂範圍，維持 3 欄對齊) ---
const typeOptions = [
    { id: 'monthly', label: '月度報表', icon: '📅' },
    { id: 'yearly', label: '年度報表', icon: '🏆' },
    { id: 'quarterly', label: '季度報表', icon: '📈' }
]

// --- STEP 2: 🌟 動態連動時間區段邏輯 (妳要求的核心功能) ---
const timeRangeOptions = computed(() => {
    const now = new Date();
    const currentYear = now.getFullYear();

    if (reportType.value === 'monthly') {
        return [
            { label: '本月數據資料', value: 'current-month' },
            { label: '上月歷史紀錄', value: 'last-month' }
        ]
    } else if (reportType.value === 'yearly') {
        // 動態生成最近三年年份
        return [
            { label: `${currentYear} 年度彙整`, value: `year-${currentYear}` },
            { label: `${currentYear - 1} 年度彙整`, value: `year-${currentYear - 1}` },
            { label: `${currentYear - 2} 年度彙整`, value: `year-${currentYear - 2}` }
        ]
    } else if (reportType.value === 'quarterly') {
        return [
            { label: '本季度數據', value: 'current-quarter' },
            { label: '上季度歷史', value: 'last-quarter' }
        ]
    }
    return []
})

// 當切換報表類型時，自動選中該類型的第一個選項
watch(reportType, (newType) => {
    timeRange.value = timeRangeOptions.value[0].value;
})

// --- 🌟 檔案下載與檔名邏輯 ---
const handleExport = async () => {
    try {
        isExporting.value = true;
        
        // 1. 呼叫 API
        const response = await settingApi.exportReport(
            reportType.value, 
            reportFormat.value, 
            timeRange.value
        );
        
        // 2. 🌟 修復 TypeError：直接使用 response 作為 Blob 資料
        // 因為攔截器通常已經幫妳處理了 .data
        const blob = new Blob([response]); 
        const url = window.URL.createObjectURL(blob);
        
        // 3. 🌟 生成智慧檔名
        const selectedLabel = timeRangeOptions.value.find(opt => opt.value === timeRange.value)?.label || '報表';
        const typeLabel = typeOptions.find(opt => opt.id === reportType.value)?.label || '';
        const ext = reportFormat.value === 'excel' ? 'xlsx' : reportFormat.value;
        const finalFilename = `MoneyMMA_${selectedLabel}_${typeLabel}.${ext}`;
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', finalFilename);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        ElMessage.success(`${selectedLabel} 匯出成功！`);
    } catch (error) {
        console.error('匯出失敗：', error);
        ElMessage.error('匯出失敗，該時段可能尚無帳務紀錄。');
    } finally {
        isExporting.value = false;
    }
};
</script>

<template>
    <div class="output-wrapper">
        <div class="header-banner">
            <div class="banner-content">
                <h2>數據匯出中心</h2>
                <p>選擇報表參數，產生專業財務分析檔案</p>
            </div>
        </div>

        <div class="export-main-container">
            <div class="step-section">
                <label class="step-label">STEP 1. 選擇報表類型</label>
                <div class="type-button-group">
                    <button v-for="item in typeOptions" :key="item.id"
                        :class="['type-btn', { active: reportType === item.id }]" @click="reportType = item.id">
                        <span class="type-icon">{{ item.icon }}</span>
                        {{ item.label }}
                    </button>
                </div>
            </div>

            <div class="divider"></div>

            <div class="settings-row">
                <div class="setting-item time-setting">
                    <label class="step-label">STEP 2. 時間區段</label>
                    <div class="select-container">
                        <select v-model="timeRange" class="modern-select">
                            <option v-for="opt in timeRangeOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="setting-item format-setting">
                    <label class="step-label">STEP 3. 匯出格式</label>
                    <div class="format-card-group">
                        <div class="format-mini-card" :class="{ active: reportFormat === 'pdf' }" @click="reportFormat = 'pdf'">
                            <div class="f-icon pdf">PDF</div>
                            <span>專業文件</span>
                        </div>
                        <div class="format-mini-card" :class="{ active: reportFormat === 'excel' }" @click="reportFormat = 'excel'">
                            <div class="f-icon xls">XLS</div>
                            <span>數據試算</span>
                        </div>
                        <div class="format-mini-card" :class="{ active: reportFormat === 'csv' }" @click="reportFormat = 'csv'">
                            <div class="f-icon csv">CSV</div>
                            <span>原始資料</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="action-footer">
                <button class="primary-download-btn" @click="handleExport" :disabled="isExporting">
                    <template v-if="!isExporting">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>產生並下載報表</span>
                    </template>
                    <template v-else>
                        <span class="loading-spinner">⏳</span>
                        <span>系統處理中...</span>
                    </template>
                </button>
                <p class="hint-text">系統將根據您的選擇自動彙整帳務資訊</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import '../assets/css/setting.css';

.output-wrapper {
    max-width: 1100px;
    margin: 0 auto;
    padding: 20px;
}

.header-banner { margin-bottom: 24px; }
.header-banner h2 { font-size: 24px; color: #1e293b; margin-bottom: 4px; }
.header-banner p { color: #64748b; font-size: 14px; }

.export-main-container {
    background: #ffffff;
    border-radius: 20px;
    padding: 32px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.step-label {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    margin-bottom: 16px;
    letter-spacing: 0.5px;
}

.type-button-group {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
}

.type-btn {
    padding: 14px;
    background: #f8fafc;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    color: #475569;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.type-btn.active {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #2563eb;
}

.divider { height: 1px; background: #f1f5f9; margin: 32px 0; }

.settings-row {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 40px;
}

.modern-select {
    width: 100%;
    padding: 12px 16px;
    border-radius: 12px;
    border: 2px solid #f1f5f9;
    background: #f8fafc;
    font-size: 15px;
    cursor: pointer;
}

.format-card-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

.format-mini-card {
    padding: 16px;
    border: 2px solid #f1f5f9;
    border-radius: 14px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.format-mini-card.active {
    background: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.15);
}

.f-icon {
    font-size: 11px;
    font-weight: 800;
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-block;
    margin-bottom: 8px;
}

.pdf { background: #fee2e2; color: #b91c1c; }
.xls { background: #dcfce7; color: #15803d; }
.csv { background: #fef9c3; color: #a16207; }

.action-footer {
    margin-top: 40px;
    text-align: center;
}

.primary-download-btn {
    background: #2563eb;
    color: white;
    border: none;
    padding: 14px 48px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    transition: all 0.2s;
    min-width: 280px; /* 防止載入時按鈕縮短 */
}

.primary-download-btn:hover:not(:disabled) {
    background: #1d4ed8;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.primary-download-btn:disabled {
    background: #94a3b8;
    cursor: not-allowed;
}

.loading-spinner {
    animation: rotate 2s linear infinite;
    display: inline-block;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.hint-text { font-size: 12px; color: #94a3b8; margin-top: 12px; }
</style>