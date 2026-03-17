<script setup>
import Nav from './components/Nav.vue'
</script>

<template>
    <div id="app">
        <!-- 判斷是否隱藏導航欄 -->
        <template v-if="$route.meta.hideNav">
                <router-view />
        </template>
    
        <Nav v-else>
            <router-view />
        </Nav>
    </div>
</template>

<style scoped>

</style>
