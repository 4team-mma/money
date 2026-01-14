<script setup>
    import { Calendar } from "v-calendar";
    import { ref } from "vue";

    // 接收父層傳入的 props
    const props = defineProps({
        attributes: Array,
        today: String,
    });

    // 向父層回傳事件
    const emit = defineEmits(["select-date", "move-today", "update-date"]);

    const calendar = ref(null);

    // 點擊今天按鈕
    function moveToday() {
        calendar.value.move(props.today);
        emit("move-today");
    }

    const handlePageChange = (pages) => {
        if (pages && pages.length > 0) {
            const { month: newMonth, year: newYear } = pages[0];
            // 觸發事件，並把資料傳給父組件
            emit('update-date', { year: newYear, month: newMonth });
        }
    }
</script>

<template>
    <!-- 行事曆 -->
    <div class="calendar-section">
        <Calendar
            ref="calendar"
            expanded
            borderless
            :masks="{ title: 'YYYY年 MMM', dayPopover: 'YYYY年 MMM DD日, WWW' }"
            :attributes="props.attributes"
            locale="zh-TW"
            @dayclick="day => emit('select-date', day)"
            @did-move="handlePageChange"
        >
            <template #footer>
                <button class="btn-icon" @click="moveToday">今天</button>
            </template>
        </Calendar>
    </div>
</template>

<style scoped>
    .calendar-section {
        background: #fff;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .btn-icon {
        background: #2563eb;
        color: white;
        padding: 10px 20px;
        border: 0px;
        margin: 1px;
        border-radius: 10px;
        font-weight: 600;
    }

    :deep(.vc-day) {
        min-height: 50px;
    }

    :deep(.vc-title) {
        background: none;
    }

    :deep(.vc-arrow) {
        background: none;
    }
</style>