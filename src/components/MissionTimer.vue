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
        
        // 增加一個簡單的鎖，避免在一秒內重複觸發多次 refresh
        if (!window.isRefreshing) {
            window.isRefreshing = true
            emit('refresh')
            // 5秒後解鎖，給 fetchMissions 足夠時間完成
            setTimeout(() => { window.isRefreshing = false }, 5000)
        }
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