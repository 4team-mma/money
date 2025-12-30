
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
</style>
