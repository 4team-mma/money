<script setup>
import { ref, onMounted,computed } from 'vue'
import { 
    ElMessage, ElTabs, ElTabPane, ElTable, ElTableColumn, 
    ElTag, ElSelect, ElOption, ElButton, vLoading, ElPagination, ElTooltip
} from 'element-plus'
import api from '@/api'
import { updateCorrectedIntent, deleteAiReviewLog,clearAllPendingAiLogs } from '@/api/robot'

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

const oldestPendingDate = ref(null)
// 🌟 新增：計算距離今天有幾天
const oldestDaysCount = computed(() => {
    if (!oldestPendingDate.value) return 0;
    const diffTime = Math.abs(new Date() - new Date(oldestPendingDate.value));
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});


const fetchLogs = async () => {
    loading.value = true
    try {
        const isReviewed = activeTab.value === 'resolved' ? 1 : 0
        const res = await api.get(`/v1/ai/ai_test/admin_logs`, {
            params: {
                is_reviewed: isReviewed,
                page: currentPage.value,
                size: pageSize.value
            }
        })
        
        //  修正：應對 Axios 攔截器，確保能正確拿到物件
        const data = res.data || res || {}
        reviewLogs.value = data.details || []
        totalRows.value = data.total || 0

        // 🌟 接收最舊日期
        oldestPendingDate.value = data.oldest_date || null

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

// 新增一個忽略函式
const ignoreReview = async (row) => {
    try {
        // 呼叫 API，將這筆紀錄的 is_reviewed 設為 1，但 corrected_intent 設為原本的 predicted_intent
        await updateCorrectedIntent(row.review_id, row.predicted_intent);
        ElMessage.success(`✅ 已標記為判斷無誤，移出待處理區！`);
        fetchLogs();
    } catch (error) {
        ElMessage.error('操作失敗');
    }
}

const saveReview = async (row) => {
    if (!row.corrected_intent) return;
    try {
        await updateCorrectedIntent(row.review_id, row.corrected_intent);
        
        // 🌟 這裡可以多加一隻 API：將 (user_message, corrected_intent) 寫入 ChromaDB 向量庫
        // await addIntentToChromaDB(row.user_message, row.corrected_intent);
        
        ElMessage.success(`🧠 成功！已將「${row.user_message}」綁定為 ${row.corrected_intent} 並寫入大腦！`);
        fetchLogs();
    } catch (error) {
        ElMessage.error('儲存失敗');
    }
}

// 🌟 新增：單筆刪除函式
const deleteReview = async (row) => {
    if (!confirm('確定要刪除這筆無效紀錄嗎？刪除後無法恢復喔喵！')) return;
    
    try {
        await deleteAiReviewLog(row.review_id);
        ElMessage.success('🗑️ 紀錄已成功刪除！');
        fetchLogs(); // 重新整理表格
    } catch (error) {
        ElMessage.error('刪除失敗，請檢查後端 API 狀態');
    }
}

// 🌟 新增：一鍵清空所有待處理(未審核)紀錄
const clearAllLogs = async () => {
    // 雙重防呆，避免手滑
    if (!confirm('🚨 警告：確定要【清空所有】待處理的紀錄嗎？\n這通常用來清除舊系統留下的髒資料，刪除後無法恢復喔！')) return;
    if (!confirm('再次確認：真的要把目前 14 頁未審核的資料全部刪掉嗎？')) return;
    
    loading.value = true;
    try {
        await clearAllPendingAiLogs();
        ElMessage.success('💣 轟！所有歷史髒資料已經灰飛煙滅了！');
        fetchLogs(); // 重新整理表格
    } catch (error) {
        ElMessage.error('清理失敗，請確認後端 API 狀態');
    } finally {
        loading.value = false;
    }
}




// 🌟 1. 對話內容排版魔術師
const formatUserMessage = (rawMsg) => {
    if (!rawMsg) return '';
    // 去除 [台北時間 2026-xx-xx ...] 這種系統前綴
    let text = rawMsg.replace(/\[台北時間.*?\]\s*/g, '');
    
    // 幫小主人跟喵喵的對話加上換行與 Emoji，讓排版更清晰
    text = text.replace(/小主人：/g, '\n🧑 小主人：');
    text = text.replace(/喵喵：/g, '\n🐱 喵喵：');
    
    // 清除開頭多餘的空白與換行
    return text.trim();
}

// 🌟 2. 呼叫後端的一鍵清理 API
const clearOldLogs = async () => {
    if (!confirm('確定要清除 30 天前且未審核的無效紀錄嗎？這將釋放資料庫空間喵！')) return;
    
    loading.value = true;
    try {
        await api.delete('/v1/ai/ai_test/logs/cleanup');
        ElMessage.success('✅ 清理完成！系統瘦身成功！');
        fetchLogs();
    } catch (error) {
        ElMessage.error('清理失敗，請確認後端 API 狀態');
    } finally {
        loading.value = false;
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
                
                <el-table-column label="對話還原 (自動過濾系統標籤)" min-width="320">
                    <template #default="scope">
                        <div style="white-space: pre-wrap; line-height: 1.6; font-size: 13px; color: #334155; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            {{ formatUserMessage(scope.row.user_message) }}
                        </div>
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

                <el-table-column label="操作" width="220" align="center" v-if="activeTab === 'pending'">
                    <template #default="scope">
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; justify-content: center;">
                            <el-button 
                                type="primary" 
                                size="small" 
                                style="margin: 0;"
                                @click="saveReview(scope.row)"
                                :disabled="!scope.row.corrected_intent">
                                教導入庫
                            </el-button>
                            
                            <el-button 
                                type="success" 
                                plain
                                size="small" 
                                style="margin: 0;"
                                @click="ignoreReview(scope.row)">
                                判斷無誤
                            </el-button>

                            <el-button 
                                type="danger" 
                                plain
                                size="small" 
                                style="margin: 0;"
                                @click="deleteReview(scope.row)">
                                刪除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <div class="pagination-section" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
            <el-pagination
                background
                layout="total, prev, pager, next"
                :total="totalRows"
                :page-size="pageSize"
                v-model:current-page="currentPage"
                @current-change="handlePageChange"
            />

            <div style="display: flex; align-items: center; gap: 12px;" v-if="activeTab === 'pending'">
                <span v-if="oldestDaysCount > 0" style="font-size: 13px; color: #94a3b8;">
                    ⏳ 最早紀錄：{{ oldestDaysCount }} 天前
                </span>
                <el-button type="danger" plain size="small" @click="clearOldLogs">
                    🧹 清理 30 天前無效紀錄
                </el-button>
                <el-button type="danger" size="small" @click="clearAllLogs">
                    💣 一鍵清空所有未審核
                </el-button>
            </div>

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