<script setup>
import Nav from '@/components/Nav.vue';
</script>
<template>
    <Nav>
        <h2>圖表分析</h2>
        <div class="out">
            <div class="btn-group t-btn-group" role="group" aria-label="Basic outlined example">
                <RouterLink class="btn btn-outline-primary" to="/Add">淨資產趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/Inn">收支趨勢</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/Trans">支出分析</RouterLink>
                <RouterLink class="btn btn-outline-primary" to="/Trans">收入分析</RouterLink>
            </div>
        </div>





    </Nav>
</template>
<style scoped>
h2 {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
}
</style>