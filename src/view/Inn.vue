<script setup>

</script>
<template>
<br>
<div class="out">
    
    <button><RouterLink class="R" to="/Add">支出</RouterLink></button>
    <button><RouterLink class="R" to="/Inn">收入</RouterLink></button>
    <button><RouterLink class="R" to="/Trans">轉帳</RouterLink></button>
</div>
<h1>Inn收入頁面</h1>
</template>
<style scoped>
        div{
        text-align: center;
        border: 2px solid rgb(210, 210, 211);
        border-radius: 10px;
        background: linear-gradient(to bottom,
    rgba(200, 200, 200, 0.5),
    rgba(201, 200, 200, 0.705) );
        
        width: 60%;
        margin: auto;
    
        
    }
    .out{
        opacity: 70%;
    }
    button{
        margin: 30px;
        border-radius: 30px;
        font-size: 24px;
        padding: 14px 40px;
    }
    .R{
        text-decoration: none;
        color: black;
    }
</style>