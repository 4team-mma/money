<script setup>
import { ref, nextTick, onMounted } from 'vue';
import AiCatActionCard from './AiCatActionCard.vue';

const props = defineProps({
    messages: { type: Array, required: true },
    isTyping: { type: Boolean, default: false },
    loadingText: { type: String, default: '思考中喵...' },
    catImg: { type: String, required: true }
});

const emit = defineEmits(['quick-reply', 'confirm-record', 'cancel-record', 'feedback']);

const messagesContainer = ref(null);

// 封裝捲動邏輯，供父組件透過 ref 調用
const scrollToBottom = () => {
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
    });
};

const formatTime = (isoStr) => new Date(isoStr).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (seconds) => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}m ${secs}s`;
};

// 暴露方法給父組件
defineExpose({ scrollToBottom });
</script>

<template>
    <div class="messages-container" ref="messagesContainer">
        <div v-for="message in messages" :key="message.id" :class="['msg-row', message.sender]">

            <div v-if="message.sender === 'bot'" class="avatar-container-msg">
                <img :src="catImg" class="msg-avatar" />
            </div>

            <div class="bubble">
                <p style="white-space: pre-wrap;">{{ message.text }}</p>

                <div v-if="message.quick_replies && message.quick_replies.length > 0" class="inline-quick-replies">
                    <button v-for="(replyText, idx) in message.quick_replies" :key="idx" class="inline-qr-btn"
                        @click="emit('quick-reply', replyText, message.id)">
                        {{ replyText }}
                    </button>
                </div>

                <template
                    v-if="message?.is_command && Array.isArray(message?.action_data) && message.action_data.length > 0">
                    <AiCatActionCard v-for="(actionItem, idx) in message.action_data" :key="idx"
                        :actionItem="actionItem" :index="idx" :totalLength="message.action_data.length"
                        :messageId="message.id" @confirm="(mId, i, item) => emit('confirm-record', mId, i, item)"
                        @cancel="(mId, i) => emit('cancel-record', mId, i)" />
                </template>

                <span class="time">
                    {{ formatTime(message.timestamp) }}
                    <span v-if="message.sender === 'bot' && message.duration" class="meta-info">
                        <span class="provider-tag" v-if="message.provider">[{{ message.provider.toUpperCase() }}]</span>
                        <span class="duration-tag">⏱️{{ formatDuration(message.duration) }}</span>
                    </span>

                    <span v-if="message.sender === 'bot'" class="feedback-actions">
                        <template v-if="!message.feedbackGiven">
                            <button class="feedback-btn" title="回答很棒"
                                @click="emit('feedback', message, true)">👍</button>
                            <button class="feedback-btn" title="回答有誤"
                                @click="emit('feedback', message, false)">👎</button>
                        </template>
                        <template v-else>
                            <span class="feedback-thanks">已回饋 ✓</span>
                        </template>
                    </span>
                </span>
            </div>
        </div>

        <div v-if="isTyping" class="msg-row bot">
            <div class="avatar-container-msg">
                <img :src="catImg" class="msg-avatar" />
            </div>
            <div class="bubble typing">{{ loadingText }}</div>
        </div>
    </div>
</template>

<style scoped>
/* 將原本 MoneyAIBot.vue 中關於訊息列表的 CSS 移到這裡 */
.messages-container {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    /* 讓中間可以捲動，而不是撐開 */
    display: flex;
    flex-direction: column;
    gap: 15px;
    background: #fff;
    min-height: 0;
    /* 關鍵：讓 flex 子元素能正確收縮 */
}

/* 這是控制喵喵頭像大小的關鍵 */
.avatar-container-msg {
    width: 30px;
    /* 限制寬度 */
    height: 30px;
    /* 限制高度 */
    flex-shrink: 0;
    margin-top: 5px;
}

.msg-avatar {
    width: 100%;
    height: 100%;
    object-fit: contain;
    /* 確保圖片縮小不變形 */
}

.msg-row {
    display: flex;
    gap: 10px;
    max-width: 85%;
}

.msg-row.user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.bubble {
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 0.9rem;
    line-height: 1.4;
    position: relative;
}

.bot .bubble {
    background: #f0f2f5;
    color: #333;
    border-top-left-radius: 2px;
}

.user .bubble {
    background: #3b82f6;
    color: white;
    border-top-right-radius: 2px;
}

.time {
    font-size: 0.7rem;
    opacity: 0.5;
    margin-top: 4px;
    display: block;
    text-align: right;
}

.typing {
    color: #888;
    font-style: italic;
    font-size: 0.85rem;
}

.meta-info {
    margin-left: 4px;
}

.provider-tag {
    color: #6366f1;
    font-weight: bold;
    margin-right: 2px;
}

.duration-tag {
    color: #9ca3af;
}

/* --- 🌟 對話框內的條列式按鈕樣式 --- */
.inline-quick-replies {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 12px;
}

.inline-qr-btn {
    background-color: #ffffff;
    border: 1px solid #c7d2fe;
    border-radius: 12px;
    padding: 8px 12px;
    font-size: 13px;
    color: #4f46e5;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.inline-qr-btn:hover {
    background-color: #e0e7ff;
    border-color: #818cf8;
    transform: translateY(-1px);
}

/* 🌟 新增的反饋按鈕樣式 */
.feedback-actions {
    margin-left: 8px;
    display: inline-flex;
    gap: 4px;
    align-items: center;
}

.feedback-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.4;
    transition: all 0.2s ease;
}

.feedback-btn:hover {
    opacity: 1;
    transform: scale(1.2) translateY(-2px);
}

.feedback-thanks {
    font-size: 12px;
    color: #10b981;
    margin-left: 4px;
    font-weight: bold;
}
</style>