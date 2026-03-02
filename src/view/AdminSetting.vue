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
                @click="emit('set-theme', id)">
                <div class="theme-preview" :style="{ background: theme.bgGradient }"></div>
                <span>{{ theme.name }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; margin-top: 20px; }
.theme-card { border: 2px solid transparent; padding: 10px; border-radius: 12px; cursor: pointer; background: rgba(255,255,255,0.1); }
.theme-card.active { border-color: #3b82f6; }
.theme-preview { height: 60px; border-radius: 8px; margin-bottom: 8px; }
</style>