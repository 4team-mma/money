<script setup>

import { ref } from 'vue'
const showAddDialog = ref(false)

const accountTypes = ref([
    { value: 'bank', label: '銀行帳戶' },
    { value: 'cash', label: '現金' },
    { value: 'credit', label: '信用卡' },
    { value: 'investment', label: '投資帳戶' }
])
const selectedType = ref(accountTypes.value[0].value)


const currencys = ref([
    { value: 'TWD', label: '新台幣 (TWD)' },
    { value: 'USD', label: '美元 (USD)' },
    { value: 'EUR', label: '歐元 (EUR)' },
    { value: 'JPY', label: '日圓 (JPY)' }
])
const selectedCurrency = ref(currencys.value[0].value)


const icons = ["🐵", "🐶", "🐷", "🐻", "🐨", "🐮", "🦁", "🐯", "🐰", "🐭", "🦉", "🐸"]
//const icons = [
    //new URL('../assets/acc_picture/dog_3089505.png', import.meta.url).href,
    //new URL('../assets/acc_picture/kangaroo_2424371.png', import.meta.url).href,
    //new URL('../assets/acc_picture/squirrel_1635907.png', import.meta.url).href]
</script>

<template>
    <button @click="showAddDialog = true" class="add_account_button"><i class="bi bi-plus">新增帳戶</i></button>
    <div v-if="showAddDialog" class="acc_modal_overlay" @click="showAddDialog = false">
        <div class="acc_modal_content" @click.stop>
            <div class="acc_head">
                <H3 class="acc_button_word">新增帳戶</H3>
                <button @click="showAddDialog = false" class="btn-icon">✕</button>
            </div>
            <hr>
            <div>
                <h4 class="acc_button_word_small">帳戶名稱:</h4>
                <input type="text" placeholder="例如：玉山銀行">
            </div>
            <br>
            <div>
                <label class="acc_button_word_small">帳戶類型:</label>
                <div>
                    <select v-model="selectedType">
                        <option v-for="type in accountTypes" :key="type.value" :value="type.value">
                            {{ type.label }}
                        </option>
                    </select>
                </div>
            </div>
            <br>
            <div>
                <label class="acc_button_word_small">貨幣:</label>
                <div>
                    <select v-model="selectedCurrency">
                        <option v-for="currency in currencys" :key="currency.value" :value="currency.value">
                            {{ currency.label }}
                        </option>
                    </select>
                </div>
            </div>
            <br>
            <div>
                <h4 class="acc_button_word_small">初始餘額:</h4>
                <input type="number" placeholder="0">
            </div>
            <br>
            <div>
                <label class="acc_button_word_small">圖示:</label>
                <div>
                    <button v-for="(icon, index) in icons" :key="index" class="acc_button_color">
                        <span class="emoji">{{ icon }}</span>
                    </button>
                </div>
            </div>
            <br>
            <div class="submit_box_button">
                <button class="submit_button">新增帳戶</button>
            </div>
            
        </div>
    </div>
    
</template>

<style scoped>
@import '../assets/css/add.css';

    .add_account_button{
        background: white;
        font-size: 12px;
        border-radius: 16px;
        width: 80px;
        height: 40px;
        padding: 4px;
        border: 0.5px solid rgb(253, 253, 253);
        border-left: 2px solid;
        border-left-color: #e8ef28;
    }

    .acc_head{
        display: flex;
        justify-content: space-between;
        
    }

    .acc_modal_overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        padding: 20px;
    }

    .acc_modal_content {
    background: white;
    width: 90%;
    max-width: 440px;
    border-radius: 20px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    overflow: hidden;
    padding: 35px;
}

    .btn-icon {
        background-color: white;
        color: rgb(117, 114, 114);
        padding: 10px 20px;
        border: 0px;
        margin: 1px;
        border-radius: 10px;
        font-weight: 600;
        float: right;
    }

    .acc_button_word{
        font-size: 30px;
        font-weight: 600;
        color: #1e293b;
    }

    .acc_button_word_small{
        font-size: 20px;
        font-weight: 400;
        color: #626367;
    }

    .acc_button_color {
        background: none;
        border: none;
        cursor: pointer;
        margin: 5px;
    }


    /* 按下去 */
    .acc_button_color:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 #ccc;
    }

    .submit_box_button:active {
        transform: translateY(2px);
        box-shadow: 0 2px 0 #fffefe;
    }


    .submit_button{
        background-color: #1e293b;
        color: white;
        padding: 10px 20px;
        border: 0px;
        margin-top: 10px;
        border-radius: 10px;
        font-weight: 600;
    }

    .submit_box_button{
        align-items: center;
        display: flex;
        justify-content: center; 
    }

    .emoji{
        font-size: 24px;
    }
</style>