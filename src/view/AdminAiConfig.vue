<script setup>
import { ref, onMounted } from 'vue'
import { 
    ElMessage, ElTabs, ElTabPane, ElTable, ElTableColumn, 
    ElTag, ElSelect, ElOption, ElButton, vLoading, ElPagination, ElTooltip
} from 'element-plus'
import api from '@/api'
import { updateCorrectedIntent } from '@/api/robot'

const activeTab = ref('pending')
const loading = ref(false)
const reviewLogs = ref([])

// --- 分頁狀態 ---
const currentPage = ref(1)
const pageSize = ref(10)
const totalRows = ref(0)

const intentOptions = [
    'RECORD', 'MULTI_RECORD', 'QUERY', 'MULTI_QUERY', 
    'CHAT', 'MULTI_CHAT', 'ADVISOR', 'MULTI_ADVISOR', 
    'KNOWLEDGE', 'MULTI_KNOWLEDGE'
]

const fetchLogs = async () => {
    loading.value = true
    try {
        const isReviewed = activeTab.value === 'resolved' ? 1 : 0
        // 🌟 傳送分頁參數給後端
        const res = await api.get(`/v1/ai/ai_test/admin_logs`, {
            params: {
                is_reviewed: isReviewed,
                page: currentPage.value,
                size: pageSize.value
            }
        })
        const data = res.data || {}
        reviewLogs.value = data.details || []
        totalRows.value = data.total || 0
    } catch (error) {
        ElMessage.error('獲取資料失敗，請確認 API 是否已開啟')
    } finally {
        loading.value = false
    }
}

// 處理頁碼改變
const handlePageChange = (val) => {
    currentPage.value = val
    fetchLogs()
}

const saveReview = async (row) => {
    if (!row.corrected_intent) {
        ElMessage.warning('請選擇正確的意圖！')
        return
    }
    try {
        await updateCorrectedIntent(row.review_id, row.corrected_intent)
        ElMessage.success(`✅ 已教育 AI！`)
        // 審核完後重新整理目前頁面
        fetchLogs()
    } catch (error) {
        ElMessage.error('儲存失敗')
    }
}

onMounted(fetchLogs)
</script>

<template>
    <div class="review-container">
        <div class="header-section">
            <h2>🧠 AI 意圖與回覆審核中心</h2>
            <p class="subtitle">監控真實用戶對話，即時修正模型偏誤與 LLM 幻覺</p>
        </div>
        
        <el-tabs v-model="activeTab" @tab-change="() => { currentPage = 1; fetchLogs(); }">
            <el-tab-pane label="待處理 (未審核)" name="pending"></el-tab-pane>
            <el-tab-pane label="已解決 (已入庫)" name="resolved"></el-tab-pane>
        </el-tabs>

        <div class="table-wrapper">
            <el-table :data="reviewLogs" v-loading="loading" stripe border height="100%">
                <el-table-column prop="created_at" label="時間" width="160" sortable />
                
                <el-table-column label="小主人輸入" min-width="200">
                    <template #default="scope">
                        <span class="msg-text">{{ scope.row.user_message }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="AI 實際回覆 (llm_response)" min-width="250">
                    <template #default="scope">
                        <el-tooltip :content="scope.row.llm_response" placement="top" :disabled="!scope.row.llm_response">
                            <span class="ai-res-text">{{ scope.row.llm_response || '(無紀錄)' }}</span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                
                <el-table-column label="AI 預測" width="140">
                    <template #default="scope">
                        <el-tag size="small" type="info">{{ scope.row.predicted_intent }}</el-tag>
                        <div class="conf-text">信心: {{ (scope.row.confidence_score * 100).toFixed(1) }}%</div>
                    </template>
                </el-table-column>

                <el-table-column label="人類導師修正" width="180">
                    <template #default="scope">
                        <el-select v-model="scope.row.corrected_intent" placeholder="選擇正解" size="small" :disabled="activeTab === 'resolved'">
                            <el-option v-for="opt in intentOptions" :key="opt" :label="opt" :value="opt" />
                        </el-select>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="120" align="center" v-if="activeTab === 'pending'">
                    <template #default="scope">
                        <el-button type="primary" size="small" @click="saveReview(scope.row)">學習</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <div class="pagination-section">
            <el-pagination
                background
                layout="total, prev, pager, next"
                :total="totalRows"
                :page-size="pageSize"
                v-model:current-page="currentPage"
                @current-change="handlePageChange"
            />
        </div>
    </div>
</template>

<style scoped>
.review-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 20px;
}
.header-section h2 { margin: 0; font-size: 1.5rem; }
.subtitle { color: #64748b; font-size: 0.9rem; margin: 5px 0 15px; }

.table-wrapper {
    flex: 1;
    overflow: hidden; /* 讓 el-table 內部滾動 */
    margin-bottom: 20px;
}

.msg-text { font-weight: 600; color: #1e293b; }

/* 讓 AI 回覆文字如果太長會變省略號，滑鼠移上去看完整內容 */
.ai-res-text {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #475569;
    font-size: 0.85rem;
    font-style: italic;
}

.conf-text { font-size: 11px; color: #94a3b8; margin-top: 4px; }

.pagination-section {
    display: flex;
    justify-content: center;
    padding-bottom: 10px;
}

:deep(.el-table__header) { background-color: #f8fafc; }
</style>