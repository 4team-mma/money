<script setup>
import Add_bar from '@/components/Add_bar.vue'
import Add_cato from '@/components/Add_cato.vue';
import Add_account from '@/components/Add_account.vue';
import Add_member from '@/components/Add_member.vue';
import Add_tag from '@/components/Add_tag.vue';

</script>

<template>
    <Add_bar />

    <h4>2025年12月25日 周四</h4>

    <div class="form">
        金額 : <input type="number" placeholder="金額輸入" method="post" />
        <br><br>

        類別:&nbsp;
        <Add_cato></Add_cato>&nbsp;&nbsp;&nbsp;

        帳戶:&nbsp;
        <Add_account></Add_account>&nbsp;&nbsp;&nbsp;
        成員:&nbsp;
        <Add_member></Add_member>&nbsp;&nbsp;&nbsp;
        標籤:&nbsp;
        <Add_tag></Add_tag>
        <p></p>
        照片:
        <input type="file">
        <p></p>
        <textarea name="textarea" id=""></textarea>&nbsp;<br>
        <button>儲存</button>&nbsp;&nbsp;
        <button>再記一筆</button>


    </div>

    <router-view />
</template>

<style scoped>
@import "../assets/css/add_nav.css";

h4 {
    text-align: center;
}

.form {
    text-align: center;
}

/* textarea */
textarea {
    width: 50%;
    min-height: 80px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #ccc;
    resize: vertical;
}
</style>
