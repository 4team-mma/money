<script setup>

</script>
<template>
   <nav class="navbar navbar-expand-lg bg-body-tertiary">
    <div class="nav">
      <a class="navbar-brand" href="#">Money</a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <!-- <a class="nav-link active" aria-current="page" href="#">首頁</a> -->
            <RouterLink class="nav-link" to="/">首頁</RouterLink>
          </li>
          <li class="nav-item">
            <!-- <a class="nav-link" href="#">帳本</a> -->
            <RouterLink class="nav-link" to="/Book">帳本</RouterLink>
          </li>
          <li class="nav-item">
            <!-- <a class="nav-link" href="#">帳戶</a> -->
            <RouterLink class="nav-link" to="/Account">帳戶</RouterLink>
          </li>
          <li class="nav-item">
            <!-- <a class="nav-link" href="#">記一筆</a> -->
            <RouterLink class="nav-link" to="/Add">記一筆</RouterLink>
          </li>
          <li class="nav-item">
            <!-- <a class="nav-link" href="#">圖表分析</a> -->
            <RouterLink class="nav-link" to="/Chart">圖表分析</RouterLink>
          </li>
        </ul>
        <form class="d-flex" role="search">
          <input class="search-textarea" type="search" placeholder="Search" aria-label="Search" />
          <button class="btn btn-outline-success" type="submit">Search</button>
        </form>
      </div>
    </div>
  </nav>
<hr>
</template>
<style scoped>
.nav {
  display: flex;
  justify-content: center;
  gap: 60px; /* 自動產生間距 */
  padding: 20px 0;
  padding-left:10rem;
  font-size: 18px;
  background-color: #f8f9fa;
  
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
.search-textarea {
    display: block;
    width: 50%;
    padding: .375rem .75rem;
    margin-right: 20px;
    font-size: 1rem;
    font-weight: 300;
    line-height: 1.5;
    color: var(--bs-body-color);
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-color: var(--bs-body-bg);
    background-clip: padding-box;
    border: var(--bs-border-width) solid var(--bs-border-color);
    border-radius: var(--bs-border-radius);
    transition: border-color .15s ease-in-out, box-shadow .15s ease-in-out;
}
.nav-link {
  padding-left: 1rem !important;
  padding-right: 2rem !important;
}    
</style>