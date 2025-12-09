<script setup>
import { RouterView } from 'vue-router';


</script>

<template>
  <nav class="nav">
    <RouterLink class="nav-link" to="/">首頁</RouterLink>
    <RouterLink class="nav-link" to="/Book">帳本</RouterLink>
    <RouterLink class="nav-link" to="/Account">帳戶</RouterLink>
    <RouterLink class="nav-link" to="/Add">記一筆</RouterLink>
    <RouterLink class="nav-link" to="/Chart">圖表分析</RouterLink>
  </nav>


<hr>
<div>
<RouterView/>
</div>
</template>

<style scoped>

.nav {
  display: flex;
  justify-content: center;
  gap: 60px; /* 自動產生間距 */
  padding: 20px 0;
  font-size: 18px;
}
.nav-link,
.nav-link:visited,
.nav-link:active {
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

/* hover 效果 */
.nav-link:hover {
  color: #409eff;
}
</style>
