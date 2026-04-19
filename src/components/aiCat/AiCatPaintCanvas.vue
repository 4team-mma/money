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
    sprayPaint(e, false); // 第一下噴大點
};

// 🌟 修正後的繪圖邏輯：嚴格檢查滑鼠左鍵狀態
const handleMouseMove = (e) => {
    // 檢查 e.buttons，1 代表左鍵按住。如果沒按住，就強制停止繪圖
    if (!isDrawing.value || e.buttons !== 1) {
        isDrawing.value = false;
        return;
    }
    sprayPaint(e, true); // 拖拽中噴小點
};

const stopDrawing = () => {
    isDrawing.value = false;
};

const sprayPaint = (e, isDraggingFlag) => {
    if (paintDrops.value.length > 500) paintDrops.value.shift();
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', '#FF8ED4'];
    const size = isDraggingFlag ? (Math.random() * 10 + 5) : (Math.random() * 30 + 20);
    
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
            zIndex: 2147483645, // 比對話視窗低一點點
            transform: `rotate(${Math.random() * 360}deg)`
        }
    });
};

const clearCanvas = () => {
    paintDrops.value = [];
};

defineExpose({ clearCanvas });
</script>

<template>
    <div v-if="isTyping" class="spray-canvas" 
        @mousedown="startDrawing" 
        @mousemove="handleMouseMove" 
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing">
        <div v-for="drop in paintDrops" :key="drop.id" class="paint-drop" :style="drop.style"></div>
        <div class="spray-hint">AI 思考中... 按住左鍵亂噴發，發洩一下吧喵！🎨</div>
    </div>
</template>

<style scoped>
@import "@/assets/css/ai_painting.css";
.spray-canvas {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 2147483644; /* 超高層級 */
    cursor: crosshair;
}
.spray-hint {
    position: absolute;
    top: 20px; left: 50%;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.9);
    padding: 8px 20px;
    border-radius: 20px;
    color: #444;
    font-size: 14px;
    font-weight: bold;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>