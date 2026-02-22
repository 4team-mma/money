<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['refresh'])
const countdownText = ref('00:00:00')
let timer = null

const updateCountdown = () => {
    const now = new Date()
    const tomorrow = new Date()
    tomorrow.setHours(24, 0, 0, 0)
    const diff = tomorrow - now

    if (diff <= 0) {
        countdownText.value = '00:00:00'
        emit('refresh') // 通知父組件時間到了，該更新任務列表了
        return
    }

    const h = Math.floor(diff / 3600000).toString().padStart(2, '0')
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0')
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0')
    countdownText.value = `${h}:${m}:${s}`
}

onMounted(() => {
    updateCountdown()
    timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
    if (timer) clearInterval(timer)
})
</script>

<template>
    <span class="countdown-display">刷新倒數 {{ countdownText }}</span>
</template>

<style scoped>
.countdown-display {
    font-variant-numeric: tabular-nums; /* 確保數字寬度一致，避免跳動時閃爍 */
    color: #64748b;
    font-weight: 600;
}
</style>