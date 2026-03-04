<script setup>
const props = defineProps({
    themes: Object,
    currentTheme: String
})
const emit = defineEmits(['set-theme'])
</script>

<template>
    <div class="content-glass-card">
        <h3>🎨 介面主題設置</h3>
        <div class="theme-grid">
            <button v-for="(theme, id) in themes" :key="id" 
                class="theme-card" :class="{ active: currentTheme === id }"
                :style="{ background: theme.cardBg || 'rgba(255,255,255,0.1)' }"
                @click="emit('set-theme', id)">
                <div class="theme-preview" :style="{ background: theme.bgGradient}"></div>
                <span :style="{ color: theme.color || 'inherit' }">
                    {{ theme.name }}
                </span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.content-glass-card {
    padding: 24px;
    background: var(--cardBg); /* 使用主題定義的卡片背景 */
    border-radius: 20px;
    border: 1px solid var(--border);
    backdrop-filter: blur(10px); /* 增加磨砂玻璃質感 */
}

.theme-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
    gap: 20px; 
    margin-top: 24px; 
}

.theme-card { 
    position: relative;
    border: 2px solid transparent; 
    padding: 12px; 
    border-radius: 16px; 
    cursor: pointer; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 平滑過渡 */
    display: flex;
    flex-direction: column;
    align-items: center;
}

.theme-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    filter: brightness(1.1);
}

.theme-card.active { 
    border-color: #3b82f6; 
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
    background: rgba(59, 130, 246, 0.1) !important; /* 選中時稍微染上主色調 */
}

.theme-card.active::after {
    content: '✓';
    position: absolute;
    top: -8px;
    right: -8px;
    background: #3b82f6;
    color: white;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--bg-card);
}

.theme-preview { 
    width: 100%;
    height: 70px; 
    border-radius: 10px; 
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1); /* 給預覽圖一個細邊框區分邊界 */
    box-shadow: inset 0 0 10px rgba(0,0,0,0.1);
}

.theme-card span {
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.5px;
}

</style>