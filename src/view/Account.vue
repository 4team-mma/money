<script setup>
import { ref } from 'node:process';
import Nav from '@/components/Nav.vue';

</script>
<template>
    <Nav>
<div class="acc_head">
    <div>  
        <h1>帳戶管理</h1>
        <p>管理您的所有帳戶與資產</p>
    </div>
    <button class="add_account_button"><i class="bi bi-plus">新增帳戶</i></button>
</div>
<br>
<div class="acc_head">
    <div class="box">
        <h5>總淨值 &nbsp;&nbsp;<span class="bi bi-suitcase-lg-fill"></span></h5>
        <h3>NT$ 571,200</h3>
        <p>總資產減去總負債</p>
    </div>
    <div class="box">
        <h5>總資產 &nbsp;&nbsp;<span class="bi bi-graph-up-arrow"></span></h5>
        <h3>NT$ 583,500</h3>
        <p>所有正資產總和</p>
    </div>
    <div class="box">
        <h5>總負債 &nbsp;&nbsp;<span class="bi bi-graph-down-arrow"></span></h5>
        <h3>NT$ 12,300</h3>
        <p>所有負債總和</p>
    </div>
</div>
<br>
<br>
<br>
<h2>帳戶清單</h2>
<br>
<div class="sec_box">
    <div class="sec_head">
        <div class="account-icon-wrapper">
            <i class="bi bi-cash-coin"></i>
        </div>
        <div>
            <h5>現金</h5><p>TWD</p>
        </div>
    </div>
    <div>
        <button class="three_dots_button"> ⋮ </button>
    </div>
</div>

<br>
<div class="sec_box">
    <div class="sec_head">
        <div class="account-icon-wrapper">
            <i class="bi bi-bank2"></i>
        </div>
        <div>
            <h5>銀行</h5><p>TWD</p>
        </div>
    </div>
    <div>
        <button class="three_dots_button"> ⋮ </button>
    </div>
</div>

<br>
<div class="sec_box">
    <div class="sec_head">
        <div class="account-icon-wrapper">
            <i class="bi bi-credit-card-2-back-fill"></i>
        </div>
        <div>
            <h5>信用卡</h5><p>TWD</p>
        </div>
    </div>
    <div>
        <button class="three_dots_button"> ⋮ </button>
    </div>
</div>


<!-- 按鈕 -->
<div>
    <H3>新增帳戶</H3>
    <button>✕</button>
</div>
<hr>
<div>
    <h4>帳戶名稱</h4>
    <input type="text" placeholder="例如：玉山銀行">
</div>
<br>
<div>
    <h4>帳戶類型</h4>
    <option value="account_type"></option>
</div>
<br>
<div>
    <h4>貨幣</h4>
    <option value="currency"></option>
</div>
<br>
<div>
    <h4>初始餘額</h4>
    <input type="number" placeholder="0">
</div>
<br>
<div>
    <h4>圖示</h4>
    <option value="icon_id"></option>
</div>
<br>

</Nav>
</template>






<style scoped>
    .acc_head{
        display: flex;
        justify-content: space-between;
        
    }

    .sec_head{
        display: flex;
        justify-content: flex-start
    }

    .add_account_button{
        border-radius: 30px;
        width: 100px;
        margin: 15px;
        border: 0.5px solid gray;
        background-color: oldlace;
    }

    .three_dots_button{
        border: none;
        background-color: white;
        font-size: 20px;
    }

    .box{
        border-radius: 40px;
        border: 1px solid darkgrey;
        width: 300px;
        padding: 25px;
        background-color: white;
    }

    .sec_box{
        margin: auto;
        display: flex;
        justify-content: space-between;
        border-radius: 40px;
        border: 0.05px solid darkgrey;
        padding: 25px;
        background-color: white;
    }
    .account-icon-wrapper{
        padding: 1rem;
    }
</style>