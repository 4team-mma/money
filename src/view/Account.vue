<script setup>
import { ref } from 'vue';
import Nav from '@/components/Nav.vue';
import AccountAdd1 from '@/components/AccountAdd1.vue';
import AccountAdd2 from '@/components/AccountAdd2.vue';

// 重要
const accounts = ref([])
const addAccount = (account) => {
    accounts.value.push(account)
}
</script>

<template>
    <Nav>
<br>
<div class="acc_head1">
    <p class="transparent-text">(空白)</p>
    <div>  
        <h1 class="page-title">帳戶管理</h1>
    </div>

    <AccountAdd1 @add-account="addAccount" />
    
</div>
<p class="page-subtitle">管理您的所有帳戶與資產</p>
<br>
<br>
<div class="acc_head2">
    <div class="box assets-card">
        <div class="acc_head1">
            <p class="card-title">總資產 &nbsp;&nbsp;</p><svg class="icon assets-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline></svg>
        </div>
        <br>
        <h3 class="amount">NT$ 583,500</h3>
        <p class="change-text">所有正資產總和</p>
    </div>
    <div class="box debt-card">
        <div class="acc_head1">
            <p class="card-title">總負債 &nbsp;&nbsp;</p><svg class="icon debt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
            <polyline points="17 18 23 18 23 12"></polyline></svg>
        </div>
        <br>
        <h3 class="amount">NT$ 12,300</h3>
        <p class="change-text">所有負債總和</p>
    </div>
    <div class="box value-card">
        <div class="acc_head1">
            <p class="card-title">總淨值 &nbsp;&nbsp;</p><svg class="icon value-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
        </div>
        <br>
        <h3 class="amount">NT$ 571,200</h3>
        <p class="change-text">總資產減去總負債</p>
    </div>
</div>
<br>
<br>
<br>

<!-- 重要 -->
<div class="sec_box">
    <div>
        <h3>帳戶清單</h3>
        <p class="change-text">所有帳戶</p>
    </div>
    <br>
    
    <div>
        <div class="account-list">
            <div class="account-card" v-for="(acc, index) in accounts" :key="index">
                    <span class="emoji">{{ acc.icon }}</span>
                    <div>
                        <div>{{ acc.name }}</div>
                        <div>{{ acc.type }} · {{ acc.currency }}</div>
                    </div>
                        
            
                <div class="world_right"> {{ acc.currency }} {{ acc.balance }}</div>
            </div>    
            
        </div>
    </div>
<br>  
<AccountAdd2 @add-account="addAccount" />
</div>
</Nav>
</template>






<style scoped>

.world_right {
    margin-left: auto;   /* 🔑 這行讓餘額跑到最右邊 */
    text-align: right;
    font-weight: bold;
    font-size: 20px;
}
    .account-card {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 12px;
    margin-top: 10px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }

    .card-title {
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    }

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

    .acc_head1{
        display: flex;
        justify-content:space-between
    }

        .acc_head3{
        display: flex;
        justify-content:center
    }

    .acc_head2{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
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
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        border-left: 4px solid;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .sec_box{
        margin: auto;
        border-radius: 40px;
        border: 0.05px solid darkgrey;
        padding: 25px;
        background-color: white;
    }
    .account-icon-wrapper{
        padding: 1rem;
    }

    .value-card {
    border-left-color: #000000;
    }

    .assets-card {
    border-left-color: #3b82f6;
    }

    .debt-card {
    border-left-color: #ef4444;
    }

    .icon {
    width: 20px;
    height: 20px;
    stroke-width: 2;
    }

    .value-icon {
    color: #000000 ;
    }

    .assets-icon {
    color: #3b82f6 ;
    }

    .debt-icon {
    color:#ef4444;
    }

    .plus-icon {
    font-size: 48px;
    font-weight: bold;
    line-height: 1;
    background-color: white;
    border-color: white;
    }

    .emoji{
        font-size: 50px;
    }

    

</style>