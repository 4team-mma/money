<script setup>

</script>
<template>

  <h2>記一筆</h2>
  <div class="out">
  <div class="btn-group t-btn-group" role="group" aria-label="Basic outlined example">
    <RouterLink  class="btn btn-outline-primary" to="/Add"
    active-class="active"
    >支出</RouterLink>
    <RouterLink class="btn btn-outline-primary" to="/AddIncome"
    active-class="active"
    >收入</RouterLink>
    <RouterLink class="btn btn-outline-primary" to="/AddTrans"
    active-class="active"
    >轉帳</RouterLink>
  </div>
</div>
</template>

<style scoped>

h2 {
    text-align: center;
    margin-top: 20px;
    margin-bottom: 20px;
}
.out {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
}
</style>