<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

const props = defineProps({
    isTyping: Boolean
});
const emit = defineEmits(['send-message']);

const input = ref('');
const isRecording = ref(false);
const wasSpoken = ref(false);
const inputRef = ref(null);

let recognition = null;
let originalInput = '';

const handleSend = () => {
    if (!input.value.trim() || props.isTyping) return;
    // 將資料傳給父層，並清空本地輸入
    emit('send-message', { query: input.value, wasSpoken: wasSpoken.value });
    input.value = '';
    wasSpoken.value = false;
};

const toggleRecording = () => {
    if (isRecording.value && recognition) {
        recognition.stop();
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        ElMessage.warning('小主人的瀏覽器不支援語音辨識喵...請用 Chrome 或 Edge 瀏覽器！');
        return;
    }
    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onstart = () => {
            isRecording.value = true;
            originalInput = input.value;
        };
        recognition.onresult = (event) => {
            let currentTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript;
            }
            input.value = originalInput + currentTranscript;
            wasSpoken.value = true;
        };
        recognition.onerror = (event) => {
            isRecording.value = false;
            if (event.error === 'not-allowed') ElMessage.error('需要麥克風權限才能用語音喵！');
        };
        recognition.onend = () => { isRecording.value = false; };
    }
    recognition.start();
};

const focusInput = () => {
    if (inputRef.value) inputRef.value.focus();
};
defineExpose({ focusInput });
</script>

<template>
    <div class="input-area">
        <input ref="inputRef" v-model="input" placeholder="輸入訊息..." @keyup.enter.prevent="handleSend"
            @input="wasSpoken = false" :disabled="isTyping" />

        <button class="mic-btn" :class="{ 'is-recording': isRecording }" @click="toggleRecording" :disabled="isTyping"
            :title="isRecording ? '點擊停止錄音' : '語音輸入'">
            {{ isRecording ? '🎙️' : '🎤' }}
        </button>

        <button class="send-btn" @click="handleSend" :disabled="isTyping">🐾</button>
    </div>
</template>

<style scoped>
.input-area {
    padding: 12px;
    display: flex;
    gap: 8px;
    border-top: 1px solid #f0f0f0;
}

.input-area input {
    flex: 1;
    border: 1px solid #ddd;
    padding: 8px 12px;
    border-radius: 10px;
    outline: none;
}

.send-btn {
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    padding: 0 12px;
    color: white;
    cursor: pointer;
}

.mic-btn {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 8px;
    margin-right: 5px;
    border-radius: 50%;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mic-btn:hover {
    background: rgba(0, 0, 0, 0.05);
}

.mic-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.mic-btn.is-recording {
    animation: pulse-red 1.5s infinite;
    background: rgba(239, 68, 68, 0.1);
}

@keyframes pulse-red {
    0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
    }

    70% {
        box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
    }
}
</style>