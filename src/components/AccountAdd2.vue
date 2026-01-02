2

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


const icons = ref(["🐵", "🐶", "🐷", "🐻", "🐨", "🐮", "🦁", "🐯", "🐰", "🐭", "🦉", "🐸"])
const selectedIcon = ref(icons.value[0])


// 注意:較難的部分
const newAdd = ref('')
const initialBalance = ref(0)
const emit = defineEmits(['add-account'])

const submit = () => {
    if (!newAdd.value.trim()) {
    alert('請輸入帳戶名稱')
    return
    }

    emit('add-account',{
    name: newAdd.value,
    type: selectedType.value,
    currency: selectedCurrency.value,
    balance: initialBalance.value,
    icon: selectedIcon.value
    })

  // 清空表單
    newAdd.value = ''
    selectedType.value = accountTypes.value[0].value
    selectedCurrency.value = currencys.value[0].value
    selectedIcon.value = icons.value[0]

  // 關閉彈窗
    showAddDialog.value = false
    }

</script>

<template>
<div class="acc_head3"><button @click="showAddDialog = true" class="plus-icon">+</button></div>
    <div v-if="showAddDialog" class="acc_modal_overlay " @click="showAddDialog = false" >
        <!-- 上面的@click="showAddDialog = false代表按背景跳出 -->
        <div class="add_acc_background acc_modal_content " @click.stop>
            <!-- 上面的@click.stop代表小框框內停止喧染 -->
            <div class="acc_head">
                <H3 class="acc_button_word">新增帳戶</H3>
                <button @click="showAddDialog = false" class="btn-icon">✕</button>
            </div>
            <hr>
            <div>
                <h4 class="acc_button_word_small">帳戶名稱:</h4>
                <input type="text" placeholder="例如：玉山銀行" v-model="newAdd">
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
                <input type="number" placeholder="0" v-model.number="initialBalance">
            </div>
            <br>
            <div>
                <label class="acc_button_word_small">圖示:</label>
                <div>
                    <button
                        v-for="(icon, index) in icons" 
                        :key="index" class="acc_button_color" 
                        :class="{ 'is-selected': selectedIcon === icon }"
                        @click="selectedIcon = icon"
                        >
                        <span class="emoji">{{ icon }}</span>
                    </button>
                </div>
            </div>
            <br>
            <div class="submit_box_button">
                <button class="submit_button" @click="submit">新增帳戶</button>
            </div>
            
        </div>
    </div>
    
</template>

<style scoped>
@import '../assets/css/add.css';

    .acc_head3{
        display: flex;
        justify-content:center
    }

    .plus-icon {
        border-radius: 50%;
        font-size: 48px;
        font-weight: bold;
        line-height: 1;
        background-color: white;
        border-color: white;
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

.add_acc_background {
    min-height: 100vh;
    margin: 0;

    background-image:
        linear-gradient(
        rgba(255,255,255,0.9),
        rgba(255,255,255,0.9)
        ),
        url('../assets/新增帳戶背景圖.jpg');

    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
}

    .acc_modal_content {
    width: 90%;
    max-width: 440px;
    border-radius: 20px;
    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    overflow: hidden;
    padding: 35px;
    z-index: 2100;
}

    .btn-icon {
        opacity: 0.5;
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

    .is-selected {
    transform: scale(1.5);
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