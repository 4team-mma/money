<script setup>
import { ref } from 'vue';

const props = defineProps({
    isTyping: Boolean
});

// 🎨 噴漆畫圖功能
const paintDrops = ref([]);
const isDrawing = ref(false);

const startDrawing = (e) => {
    isDrawing.value = true;
    sprayPaint(e, false);
};
const draw = (e) => {
    if (isDrawing.value) sprayPaint(e, true);
};
const stopDrawing = () => {
    isDrawing.value = false;
};

const sprayPaint = (e, isDraggingFlag) => {
    if (paintDrops.value.length > 300) paintDrops.value.shift();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', '#FF8ED4'];
    const size = isDraggingFlag ? (Math.random() * 15 + 10) : (Math.random() * 50 + 30);
    paintDrops.value.push({
        id: Date.now() + Math.random(),
        style: {
            left: `${e.clientX - size / 2}px`,
            top: `${e.clientY - size / 2}px`,
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: '50%',
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
            transform: `rotate(${Math.random() * 360}deg)`
        }
    });
};

// 讓父組件可以呼叫清空畫布
const clearCanvas = () => {
    paintDrops.value = [];
};
defineExpose({ clearCanvas });
</script>

<template>
    <div v-if="isTyping" class="spray-canvas" @mousedown="startDrawing" @mousemove="draw" @mouseup="stopDrawing"
        @mouseleave="stopDrawing">
        <div v-for="drop in paintDrops" :key="drop.id" class="paint-drop" :style="drop.style"></div>
        <div class="spray-hint">AI 思考中... 點擊畫面亂噴發或按住滑鼠畫圖，發洩一下吧喵！🎨</div>
    </div>
</template>

<style scoped>
@import "/src/assets/css/ai_painting.css";
.spray-canvas {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9998;
    cursor: crosshair;
}

.spray-hint {
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.8);
    padding: 8px 16px;
    border-radius: 20px;
    color: #666;
    font-size: 14px;
    pointer-events: none;
}
</style>