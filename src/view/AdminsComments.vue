<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllFeedbacksApi, updateFeedbackStatusApi } from '@/api/feedback'

const comments = ref([])
const loading = ref(false)
const currentTab = ref(null)

const fetchFeedbacks = async () => {
    loading.ref = true
    try {
        const response = await getAllFeedbacksApi()
        // 假設後端回傳格式為 { data: [...] } 或直接是陣列
        comments.value = response.data || response 
    } catch (error) {
        console.error("獲取回饋失敗:", error)
        alert("無法讀取回饋列表，請稍後再試")
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchFeedbacks()
})

const filteredComments = computed(() => {
    if (currentTab.value === null) return comments.value
    return comments.value.filter(item => item.is_replied === currentTab.value)
})

// 狀態文字對應
const statusOptions = [
    { value: 0, label: '待處理' },
    { value: 1, label: '處理中' },
    { value: 2, label: '已解決' }
]

// 狀態顏色對應
const statusStyle = (status) => {
    switch (status) {
        case 0: return { background: '#fee2e2', color: '#ef4444' } // 待處理 (紅)
        case 1: return { background: '#fef3c7', color: '#f59e0b' } // 處理中 (黃)
        case 2: return { background: '#dcfce7', color: '#10b981' } // 已解決 (綠)
        default: return { background: '#f1f5f9', color: '#64748b' }
    }
}

const updateStatus = async (item) => {
    try {
        // 調用你定義的 updateFeedbackStatusApi
        // 根據你的 API 定義，需傳入 ID 與包含狀態的物件
        await updateFeedbackStatusApi(item.feedback_id, { 
            is_replied: item.is_replied,
            admin_answer: item.admin_answer || "" // 如果有回覆內容欄位可一併帶入
        })
        console.log(`回饋 ID ${item.feedback_id} 狀態同步成功`)
    } catch (error) {
        console.error("狀態更新失敗:", error)
        alert("更新失敗，請檢查網路連線")
        // 若失敗，可以考慮重新 fetch 以還原前端狀態
        fetchFeedbacks()
    }
}

// 💡 點擊回覆：開啟信箱並將狀態暫時設為「處理中」
const handleReply = async (item) => {
    const email = item.user?.email;
    const subject = `關於您的問題回饋：${item.feedback_name}`;
    
    if (email) {
        window.location.href = `mailto:${email}?subject=Re: ${encodeURIComponent(subject)}`;
        
        // 如果原本是待處理，自動轉為「處理中」並同步到後端
        if (item.is_replied === 0) {
            item.is_replied = 1;
            await updateStatus(item);
        }
    } else {
        alert('找不到該使用者的電子信箱');
    }
};

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val)
</script>

<template>
    <div class="comments-container">
        <div class="section-header">
            <h3>💬 使用者問題回饋 <small>User Feedback</small></h3>
            <hr>
            <button class="refresh-btn" @click="fetchFeedbacks" :disabled="loading">
                {{ loading ? '讀取中...' : '🔄 重新整理' }}
            </button>
        </div>
        <hr class="header-divider">

        <div class="feedback-filter">
            <button class="filter-btn" :class="{ active: currentTab === null }" @click="currentTab = null">
                全部 ({{ comments.length }})
            </button>
            <button v-for="opt in statusOptions" :key="opt.value"
                class="filter-btn" 
                :class="{ active: currentTab === opt.value }" 
                @click="currentTab = opt.value"
            >
                {{ opt.label }} ({{ comments.filter(c => c.is_replied === opt.value).length }})
            </button>
        </div>

        <div class="comments-grid">
            <div v-if="loading" class="loading-state">資料加載中...</div>

            <div v-else v-for="item in filteredComments" :key="item.feedback_id" class="comment-card">
                <div class="comment-head">
                    <div class="user-info">
                        <span class="avatar">👤</span>
                        <div>
                            <span class="user-name">{{ item.user?.username }}</span>
                            <span class="user-account">@{{ item.user?.username || 'unknown' }}</span>
                        </div>
                    </div>
                    <select 
                        v-model="item.is_replied" 
                        class="status-select" 
                        :style="statusStyle(item.is_replied)"
                        @change="updateStatus(item)"
                    >
                        <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>

                <div class="comment-body">
                    <div class="type-tag"># {{ item.question_type }}</div>
                    <p class="content">{{ item.content }}</p>
                    
                    <div class="admin-reply-area">
                        <textarea 
                            v-model="item.admin_answer" 
                            placeholder="輸入官方回覆內容記錄..."
                            @blur="updateStatus(item)"
                        ></textarea>
                    </div>
                </div>

                <div class="comment-foot">
                    <span class="date">{{ item.created_at }}</span>
                    <div class="action-group">
                        <button class="action-btn reply" @click="handleReply(item)">
                            📧 郵件聯絡
                        </button>
                        <button 
                            class="action-btn resolve" 
                            v-if="item.is_replied !== 2"
                            @click="item.is_replied = 2; updateStatus(item)"
                        >
                            ✅ 標記完成
                        </button>
                    </div>
                </div>
            </div>
            
            <div v-if="!loading && filteredComments.length === 0" class="no-data">
                目前沒有符合此狀態的回饋內容。
            </div>
        </div>
    </div>
</template>

<style scoped>
.section-header {
    display: flex;            
    justify-content: space-between; 
    align-items: center;       
    margin-bottom: 15px;      
}

/* 確保 h3 不會擠壓到按鈕 */
.section-header h3 {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 8px; /* 標題與英文小字的間距 */
}

.no-data {
    grid-column: 1 / -1;
    text-align: center;
    padding: 50px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    backdrop-filter: blur(5px);
}

.status-select {
    padding: 6px 10px;
    border-radius: 12px;
    border: none;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    text-align: center;
    transition: all 0.3s ease;
    min-width: 80px;
}

.status-select:hover {
    filter: brightness(0.95);
    transform: scale(1.05);
}

.refresh-btn {
    padding: 8px 16px;
    border-radius: 15px;
    background: var(--primary); /* 淡淡的藍色背景 */
    border: 0.5px solid ;
    border-color: var(--text);
    color: var(--text);
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    white-space: nowrap; /* 避免文字換行 */
}

.refresh-btn:hover:not(:disabled) {
    background: var(--primary);
    color: var(--text);
    transform: translateY(-2px);
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.header-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    margin: 10px 0 20px 0;
}

.admin-reply-area {
    margin-top: 15px;
}

.admin-reply-area textarea {
    width: 100%;
    min-height: 80px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--primary);
    font-size: 14px;
    resize: vertical;
    outline: none;
    transition: 0.3s;
}

.admin-reply-area textarea:focus {
    background: var(--primary);
    border-color: var(--border);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.loading-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 40px;
    color: #64748b;
}

.comments-container {
    animation: fadeIn 0.5s ease;
}

.feedback-filter {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
}

.filter-btn {
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    font-size: 14px;
    transition: 0.3s;
}

.filter-btn.active {
    background: var(--primary);
    color: var(--text);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.comments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 20px;
}

.comment-card {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 24px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    transition: transform 0.3s, box-shadow 0.3s;
}

.comment-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.05);
    background: rgba(255, 255, 255, 0.7);
}

.comment-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.user-name {
    display: block;
    font-weight: 800;
    font-size: 16px;
}

.user-account {
    font-size: 12px;
    color: #64748b;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
}

.type-tag {
    font-size: 12px;
    color: var(--text);
    font-weight: 700;
    margin-bottom: 8px;
}

.content {
    font-size: 15px;
    line-height: 1.6;
    color: #334155;
}

.comment-foot {
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    font-size: 12px;
}

.date {
    color: #94a3b8;
}

.action-group {
    margin-left: auto;
    display: flex;
    gap: 8px;
}

.action-btn {
    border-color: var(--text);
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px;
    cursor: pointer;
    font-weight: 700;
    font-size: 12px;
    transition: 0.2s;
}

.action-btn.reply {
    background: var(--primary);
    color: var(--text);
    border:1px solid black;
}

.action-btn.resolve {
    background: white;
    color: #10b981;
    border: 1px solid #10b981;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
    .comments-grid {
        grid-template-columns: 1fr;
    }
}
</style>