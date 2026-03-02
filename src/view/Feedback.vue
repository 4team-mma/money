<script setup>
import Nav from '@/components/Nav.vue';
import { reactive, ref, onMounted } from 'vue';
import { submitFeedbackApi, getFeedbackHistoryApi } from '@/api/feedback';
import { getProfile } from '@/api/user';

const success = ref(false)
const errorMessage = ref('')
const history = ref([]);

const form = reactive({
    name: '',
    type: '',
    page: '',
    message: '',
})

const fetchUserData = async () => {
    try {
        const response = await getProfile();
        if (response && response.name) {
            form.name = response.name;
        } else if (response.data && response.data.name) {
            form.name = response.data.name;
        }
    } catch (error) {
        console.error("抓取使用者資料失敗：", error);
        form.name = localStorage.getItem('name') || '';
    }
};

const fetchHistory = async () => {
    try {
        const response = await getFeedbackHistoryApi();
        const data = response.data || response || [];
        history.value = [...data].reverse();
    } catch (error) {
        console.error("獲取歷史紀錄失敗：", error);
    }
};

onMounted(() => {
    fetchUserData();
    fetchHistory();
});

// 💡 進階建議：自動捲動到底部(當新的訊息排到最下面時，如果紀錄很多，讓頁面在更新後自動捲動)
const scrollToBottom = () => {
    nextTick(() => {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    });
};

const handleFormSubmit = async () => {
    success.value = false;
    errorMessage.value = '';
    try {
        const postData = {
            feedback_name: form.name,
            question_type: form.type,
            use_page: form.page,
            content: form.message
        };
        await submitFeedbackApi(postData);
        alert("送出成功");
        success.value = true;
        form.type = '';
        form.page = '';
        form.message = '';
        fetchHistory(); // 重新整理歷史紀錄
        scrollToBottom();
    } catch (error) {
        errorMessage.value = error.response?.data?.detail || "送出失敗，請稍後再試";
    }
};
</script>

<template>
    <Nav>
        <div class="card">
            <h1 class="page-title">問題回饋</h1>

            <div class="feedback-container">
                <form @submit.prevent="handleFormSubmit">
                    <label>
                        暱稱
                        <input type="text" v-model="form.name" required readonly class="input-field readonly-input">
                    </label>

                    <label>
                        問題類型
                        <select v-model="form.type" required class="input-field">
                            <option disabled value="">請選擇</option>
                            <option>Bug 回報</option>
                            <option>功能建議</option>
                            <option>操作問題</option>
                            <option>其他</option>
                        </select>
                    </label>

                    <label>
                        使用頁面
                        <select v-model="form.page" required class="input-field">
                            <option disabled value="">請選擇</option>
                            <option>行事曆</option>
                            <option>儀表板</option>
                            <option>帳戶管理</option>
                            <option>記一筆</option>
                            <option>圖表分析</option>
                            <option>成就系統</option>
                            <option>問題回饋</option>
                            <option>設定</option>
                            <option>其他</option>
                        </select>
                    </label>

                    <label>
                        問題內容
                        <textarea v-model="form.message" placeholder="請描述您的問題(最多200字)" maxlength="200" required
                            class="input-field content-area"></textarea>
                    </label>

                    <button type="submit" class="submit_button">送出回饋</button>
                </form>

                <div v-if="success" class="success-box">
                    <p class="success-text">🎉 送出成功！</p>
                    <p class="notice-text">我們已收到您的回饋，將於 1-3 個工作天內回覆於下方。</p>
                </div>
                <p v-if="errorMessage" class="error-msg">{{ errorMessage }}</p>
            </div>

            <hr class="divider" />
            <br>
            <div class="history-section">
                <p class="section-title">我的回饋紀錄</p>
                <br>
                <div v-if="history.length === 0" class="empty-history">目前尚無回饋紀錄</div>

                <div v-for="item in history" :key="item.feedback_id" class="history-group">
                    <div class="chat-row user-row">
                        <div class="chat-bubble user-bubble">
                            <div class="feedback-meta">
                                <span class="meta-badge"># {{ item.question_type }}</span>
                                <span class="meta-badge">📍 {{ item.use_page }}</span>
                            </div>
                            <p class="chat-text">{{ item.content }}</p>
                            <small class="chat-date">{{ item.created_at }}</small>
                        </div>
                        <span class="chat-tag q-tag">問</span>
                    </div>

                    <div v-if="item.admin_answer" class="chat-row admin-row">
                        <span class="chat-tag a-tag">管</span>
                        <div class="chat-bubble admin-bubble">
                            <p class="chat-text">{{ item.admin_answer }}</p>
                            <small class="chat-date">回覆時間：{{ item.replied_at || '最近' }}</small>
                        </div>
                    </div>

                    <div v-else class="status-pending">🕒 管理員正在處理中...</div>
                </div>
            </div>
        </div>
    </Nav>
</template>

<style scoped>
/* --- 基礎卡片與佈局 --- */
.card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 32px;
    box-shadow: var(--shadow-card);
    max-width: 550px;
    margin: 40px auto;
}

.page-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--text-primary);
    text-align: center;
    margin-bottom: 24px;
}

.feedback-container {
    max-width: 420px;
    margin: 0 auto;
}

/* --- 表單元件 --- */
label {
    display: block;
    margin-bottom: 15px;
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.input-field {
    width: 100%;
    margin-top: 6px;
    padding: 12px;
    border-radius: 10px;
    border: 2px solid var(--border-color);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.2s;
}

.input-field:focus {
    outline: none;
    border-color: var(--color-primary);
}

.content-area {
    min-height: 100px;
    resize: vertical;
}

.readonly-input {
    background-color: var(--bg-hover);
    cursor: not-allowed;
    opacity: 0.8;
}

.submit_button {
    width: 100%;
    background: var(--color-primary);
    color: var(--text-inverse);
    padding: 12px;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 10px;
    transition: opacity 0.2s;
}

.submit_button:hover {
    opacity: 0.9;
}

/* --- 狀態訊息 --- */
.success-box {
    margin-top: 20px;
    padding: 15px;
    background-color: #f0fff4;
    border-radius: 12px;
    border: 1px solid #c6f6d5;
    text-align: center;
}

.success-text { color: #2f855a; font-weight: bold; }
.notice-text { font-size: 12px; color: #4a5568; margin-top: 4px; }
.error-msg { color: var(--color-danger); text-align: center; font-size: 14px; margin-top: 10px; }

.divider {
    border: 0;
    border-top: 5px dashed var(--border-color);
    margin: 40px 0;
}

/* --- 歷史紀錄 (對話 UI) --- */
.section-title {
    font-size: 26px;
    font-weight: 800;
    margin-bottom: 20px;
    color: var(--text-primary);
}

.history-group {
    margin-bottom: 30px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.chat-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    max-width: 90%;
}

.user-row { align-self: flex-end; }
.admin-row { align-self: flex-start; }

.chat-bubble {
    padding: 12px 16px;
    border-radius: 18px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
}

.user-bubble {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-bottom-right-radius: 4px;
}

.admin-bubble {
    background: var(--bg-sidebar);
    border: 2px solid var(--border-color);
    color: var(--text-primary);
    border-top-left-radius: 4px;
}

.chat-text {
    margin: 6px 0 !important;
    font-size: 14px;
    line-height: 1.5;
    font-weight: 500;
}

.chat-date {
    font-size: 10px;
    opacity: 0.7;
    display: block;
}

/* 標籤小貼紙 (問/管) */
.chat-tag {
    font-size: 11px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-weight: 900;
    flex-shrink: 0;
    margin-top: 4px;
}

.q-tag { background: var(--color-primary); color: var(--text-inverse); }
.a-tag { background: var(--bg-hover); color: var(--color-primary); }

/* 氣泡內的 Meta 標籤 */
.feedback-meta {
    display: flex;
    gap: 6px;
    margin-bottom: 4px;
}

.meta-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--bg-hover);
    font-weight: bold;
}

.admin-bubble .meta-badge {
    background: var(--bg-hover);
    color: var(--text-secondary);
}

.status-pending {
    font-size: 12px;
    color: var(--text-secondary);
    text-align: center;
    font-style: italic;
    background: var(--bg-hover);
    padding: 6px;
    border-radius: 20px;
    width: 180px;
    margin: 0 auto;
}

.empty-history {
    text-align: center;
    color: var(--text-secondary);
    font-size: 14px;
}
</style>