<template>
  <div class="p-4">
    <h3 class="text-lg font-bold mb-4">📅 行程詳情</h3>
    <div class="space-y-3">
      <p><b>名稱：</b>{{ initialData.summary }}</p>
      <p><b>時間：</b>{{ initialData.add_note }}</p>
      <p><b>日期：</b>{{ initialData.add_date }}</p>
    </div>
    <div class="mt-6 flex justify-end">
      <el-button @click="$emit('cancel')">關閉</el-button>
    </div>
  </div>
</template>
<script setup>
defineProps(['initialData']);
defineEmits(['cancel']);
</script>