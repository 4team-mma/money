<script setup>
import { ref } from 'vue';
import Nav from '@/components/Nav.vue';
import Account_add from '@/components/AccountAdd.vue';
</script>

<template>
    <Nav>
<div class="acc_head">
    <p class="transparent-text">(空白)</p>
    <div>  
        <h1 class="page-title">帳戶管理</h1>
        <p class="page-subtitle">管理您的所有帳戶與資產</p>
    </div>
    <Account_add />
</div>
<br>
<br>
<div class="acc_head">
    <div class="box value-card">
        <div class="acc_head"><h5>總淨值 &nbsp;&nbsp;</h5><span class="bi bi-suitcase-lg-fill"></span></div>
        <h3 class="amount">NT$ 571,200</h3>
        <p class="change-text">總資產減去總負債</p>
    </div>
    <div class="box assets-card">
        <div class="acc_head"><h5>總資產 &nbsp;&nbsp;</h5><span class="bi bi-graph-up-arrow"></span></div>
        <h3 class="amount">NT$ 583,500</h3>
        <p class="change-text">所有正資產總和</p>
    </div>
    <div class="box debt-card">
        <div class="acc_head"><h5>總負債 &nbsp;&nbsp;</h5><span class="bi bi-graph-down-arrow"></span></div>
        <h3 class="amount">NT$ 12,300</h3>
        <p class="change-text">所有負債總和</p>
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

</Nav>
</template>






<style scoped>

    .transparent-text {
    opacity: 0;
    }

    .page-title {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    }

    .page-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
    }

    .amount {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 10px;
    }

    .change-text{
    font-size: 12px;
    color: #64748b;
    margin: 0;
    }

    .acc_head{
        display: flex;
        justify-content: space-between;
        
    }

    .sec_head{
        display: flex;
        justify-content: flex-start
    }



    .three_dots_button{
        border: none;
        background-color: white;
        font-size: 20px;
    }

    .box{
        background: white;
        border-radius: 16px;
        width: 250px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        border-left: 4px solid;
        transition: transform 0.2s, box-shadow 0.2s;
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

    .value-card {
    border-left-color: #3b82f6;
    }

    .assets-card {
    border-left-color: #ef4444;
    }

    .debt-card {
    border-left-color: #0ea5e9;
    }
</style>