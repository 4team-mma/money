<template>
  <DashboardLayout>
    <div class="reports-page">
      <div class="page-header">
        <h1>報表匯出</h1>
        <p>生成並下載您的財務報表</p>
      </div>

      <div class="content-grid">
        <!-- Export Form -->
        <div class="export-form-card">
          <div class="card-header">
            <h2>報表設定</h2>
            <p>選擇報表類型和格式</p>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label>報表類型</label>
              <select v-model="reportType" class="form-select">
                <option value="monthly">月度報表</option>
                <option value="yearly">年度報表</option>
                <option value="quarterly">季度報表</option>
                <option value="custom">自訂範圍</option>
              </select>
            </div>

            <div class="form-group">
              <label>時間範圍</label>
              <select v-model="timeRange" class="form-select">
                <option value="current-month">本月</option>
                <option value="last-month">上月</option>
                <option value="current-year">今年</option>
                <option value="last-year">去年</option>
                <option value="last-3-months">最近3個月</option>
                <option value="last-6-months">最近6個月</option>
              </select>
            </div>

            <div class="form-group">
              <label>匯出格式</label>
              <select v-model="reportFormat" class="form-select">
                <option value="pdf">PDF</option>
                <option value="excel">Excel (XLSX)</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <button @click="handleExport" class="export-btn">
              <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              匯出報表
            </button>
          </div>
        </div>

        <!-- Report Contents Preview -->
        <div class="preview-card">
          <div class="card-header">
            <h2>報表內容</h2>
            <p>此報表將包含以下內容</p>
          </div>
          <div class="card-body">
            <div class="content-item">
              <div class="content-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                  <polyline points="16 7 22 7 22 13"></polyline>
                </svg>
              </div>
              <div>
                <div class="content-title">收支總覽</div>
                <p class="content-description">總收入、總支出、淨收入統計</p>
              </div>
            </div>

            <div class="content-item">
              <div class="content-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <div>
                <div class="content-title">類別分析</div>
                <p class="content-description">各類別詳細支出佔比</p>
              </div>
            </div>

            <div class="content-item">
              <div class="content-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <div class="content-title">時間趨勢</div>
                <p class="content-description">每日/每月收支變化圖表</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Reports -->
      <div class="recent-reports-card">
        <div class="card-header">
          <h2>最近的報表</h2>
          <p>您最近匯出的財務報表</p>
        </div>
        <div class="card-body">
          <div 
            v-for="report in recentReports" 
            :key="report.id"
            class="report-item"
          >
            <div class="report-info">
              <div class="report-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <div>
                <div class="report-name">{{ report.name }}</div>
                <div class="report-meta">
                  {{ report.date }} · {{ report.format }} · {{ report.size }}
                </div>
              </div>
            </div>
            <button class="download-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              下載
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref } from 'vue'
import DashboardLayout from '../src/components/DashboardLayout.vue'

const reportType = ref('monthly')
const reportFormat = ref('pdf')
const timeRange = ref('current-month')

const recentReports = ref([
  { id: 1, name: '2024年1月財務報表', date: '2024-02-01', format: 'PDF', size: '1.2 MB' },
  { id: 2, name: '2023年度總結報表', date: '2024-01-15', format: 'Excel', size: '2.5 MB' },
  { id: 3, name: '第四季度收支分析', date: '2024-01-01', format: 'PDF', size: '890 KB' },
  { id: 4, name: '2023年12月月報表', date: '2023-12-31', format: 'CSV', size: '156 KB' },
])

const handleExport = () => {
  const typeMap = {
    monthly: '月報表',
    yearly: '年度報表',
    quarterly: '季度報表',
    custom: '自訂報表'
  }
  
  alert(`正在匯出${typeMap[reportType.value]}為 ${reportFormat.value.toUpperCase()} 格式...`)
}
</script>

<style scoped>
.reports-page {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.page-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
}

.export-form-card,
.preview-card,
.recent-reports-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.card-header p {
  font-size: 0.875rem;
  color: #64748b;
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
}

.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  font-size: 0.95rem;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
}

.form-select:hover {
  border-color: #cbd5e1;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 0.5rem;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

.content-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.content-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.content-icon svg {
  width: 20px;
  height: 20px;
}

.content-title {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.content-description {
  font-size: 0.875rem;
  color: #64748b;
}

.report-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
}

.report-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.report-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #667eea;
}

.report-icon svg {
  width: 24px;
  height: 24px;
}

.report-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.report-meta {
  font-size: 0.875rem;
  color: #64748b;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.download-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.download-btn svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 768px) {
  .reports-page {
    padding: 1rem;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .report-item {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .download-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
