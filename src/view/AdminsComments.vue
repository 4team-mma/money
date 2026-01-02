<script setup>
import { ref, computed } from 'vue'

// 模擬回饋數據
const comments = ref([
    {
        id: 1,
        username: 'user2',
        name: '測試者2',
        type: 'Bug回報',
        content: '在新增收支紀錄時，Emoji 圖標有時候會顯示不出來，希望能修復！',
        date: '2026-01-02 10:30',
        priority: '緊急',
        status: '待處理'
    },
    {
        id: 2,
        username: 'user',
        name: '測試者1',
        type: '功能建議',
        content: '希望可以增加一個「年度收支報表」的匯出功能，這樣報稅比較方便。',
        date: '2026-01-01 15:45',
        priority: '一般',
        status: '已解決'
    },
    {
        id: 3,
        username: 'user3',
        name: '小明',
        type: '介面優化',
        content: '深色模式下的字體顏色有點太暗了，看起來有點吃力。',
        date: '2025-12-30 09:20',
        priority: '建議',
        status: '處理中'
    }
])

// 狀態顏色對應
const statusStyle = (status) => {
    switch (status) {
        case '待處理': return { background: '#fee2e2', color: '#ef4444' }
        case '處理中': return { background: '#fef3c7', color: '#f59e0b' }
        case '已解決': return { background: '#dcfce7', color: '#10b981' }
        default: return {}
    }
}

// 優先級顏色
const priorityStyle = (p) => {
    if (p === '緊急') return { color: '#ef4444', fontWeight: 'bold' }
    return { color: '#64748b' }
}

const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val)
</script>

<template>
    <div class="comments-container">
        <div class="section-header">
            <h3>💬 使用者問題回饋 <small>User Feedback</small></h3>
        </div>

        <div class="feedback-filter">
            <button class="filter-btn active">全部 ({{ comments.length }})</button>
            <button class="filter-btn">待處理</button>
            <button class="filter-btn">已解決</button>
        </div>

        <div class="comments-grid">
            <div v-for="item in comments" :key="item.id" class="comment-card">
                <div class="comment-head">
                    <div class="user-info">
                        <span class="avatar">👤</span>
                        <div>
                            <span class="user-name">{{ item.name }}</span>
                            <span class="user-account">@{{ item.username }}</span>
                        </div>
                    </div>
                    <div class="status-badge" :style="statusStyle(item.status)">
                        {{ item.status }}
                    </div>
                </div>

                <div class="comment-body">
                    <div class="type-tag"># {{ item.type }}</div>
                    <p class="content">{{ item.content }}</p>
                </div>

                <div class="comment-foot">
                    <span class="date">{{ item.date }}</span>
                    <span class="priority" :style="priorityStyle(item.priority)">
                        優先級：{{ item.priority }}
                    </span>
                    <div class="action-group">
                        <button class="action-btn reply">回覆</button>
                        <button class="action-btn resolve" v-if="item.status !== '已解決'">標記完成</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
    background: #3b82f6;
    color: white;
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
    color: #3b82f6;
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
    margin-right: 15px;
}

.action-group {
    margin-left: auto;
    display: flex;
    gap: 8px;
}

.action-btn {
    padding: 6px 12px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 12px;
    transition: 0.2s;
}

.action-btn.reply {
    background: #3b82f6;
    color: white;
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

/* 適應電腦版寬度 */
@media (max-width: 1200px) {
    .comments-grid {
        grid-template-columns: 1fr;
    }
}
</style>