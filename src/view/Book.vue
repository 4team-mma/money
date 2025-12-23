<script setup>
    import Nav from '@/components/Nav.vue';

    import { Calendar, DatePicker } from 'v-calendar';
    import 'v-calendar/style.css';
    import { ref } from 'vue';

    // DatePicker 綁定的日期
    const date = ref(new Date());
</script>

<template>
    <Nav>
        <h1>行事曆</h1>
        <!-- 日期選擇器 --><DatePicker v-model="date" />
        <!-- 月曆 --><Calendar />
    </Nav>
</template>

<style scoped>

</style>
