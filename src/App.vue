
<script setup>
import { ref, onMounted } from 'vue'
// import MoneyAIBot from './components/MoneyAIBot.vue'
import { RouterView } from 'vue-router'
const isLoggedIn = ref(false)


onMounted(() => {
    isLoggedIn.value = window.location.pathname !== '/' &&
    window.location.pathname !== '/login'
})
</script>
<template>
    <div id="app">
        <router-view />
        <!-- <MoneyAIBot v-if="isLoggedIn" /> -->
    </div>
</template>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#app {
    width: 100%;
    min-height: 100vh;
}
/* 防止 Element Plus 的圖示爆走 */
.el-message__icon {
    font-size: 20px !important; /* 強制固定大小 */
    width: 20px !important;
}
.el-message {
    min-width: 300px !important; /* 確保彈窗寬度正常 */
}

</style>
