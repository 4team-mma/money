<script setup>
import { reactive, ref, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'

// 1. 定義事件
const emit = defineEmits(['add-account'])

const showAddDialog = ref(false)

// 2. 靜態選項資料
const accountTypes = [
    { value: 'bank', label: '銀行帳戶' },
    { value: 'cash', label: '現金' },
    { value: 'credit', label: '信用卡' },
    { value: 'investment', label: '投資帳戶' }
]

const currencys = [
    { value: 'NT $', label: '新台幣 (TWD)' },
    { value: 'USD $', label: '美元 (USD)' },
    { value: 'EUR €', label: '歐元 (EUR)' },
    { value: 'JPY ¥', label: '日圓 (JPY)' }
]

const icons = ['💰', '💳', '💵','🏦', '📈', '📉', '🧾', '📱', '🪙', '🏃',"🐵", "🐶", "🐷", "🐻", "🐨", "🐮", "🦁", "🐯", "🐰", "🐭", "🦉", "🐸"]

// 3. 核心狀態：統一管理所有輸入欄位
const account = reactive({
    name: '',
    type: 'bank',
    currency: 'NT $',
    initial: 0,
    exclude: false,
    icon: '💰'
})

// 4. 重置邏輯 (呼叫一次即可清空全部)
const resetAccount = () => {
    Object.assign(account, {
    name: '',
    type: 'bank',
    currency: 'NT $',
    initial: 0,
    exclude: false,
    icon: '💰'
    })
}

// 5. 提交邏輯
const submit = () => {
  // 檢查名稱是否為空
    if (!account.name.trim()) {
    ElMessage.warning('請輸入帳戶名稱') // 使用 Element Plus 的警告
    return
    }

  // 發送資料 (確保第一個參數是字串 'add-account')
    emit('add-account', { ...account })

  // 關閉並重置
    showAddDialog.value = false
    resetAccount()
}
</script>


<template>
    <button @click="showAddDialog = true" class="add_account_button">
        <i class="bi bi-plus">新增帳戶</i>
    </button>

    <div v-if="showAddDialog" class="acc_modal_overlay " @click="showAddDialog = false" >
        <!-- 上面的@click="showAddDialog = false代表按背景跳出 -->
        <div class="add_acc_background acc_modal_content " @click.stop>
            <!-- 上面的@click.stop代表小框框內停止喧染 -->
            <div class="acc_head">
                <h3 class="acc_button_word">新增帳戶</h3>
                <button @click="showAddDialog = false" class="btn-icon">✕</button>
            </div>
            <hr>
            <div>
                <h4 class="acc_button_word_small">帳戶名稱:</h4>
                <input type="text" placeholder="例如：玉山銀行" v-model="account.name" class="textarea">
            </div>
            <br>
            <div>
                <label class="acc_button_word_small">帳戶類型:</label>
                <div>
                    <select v-model="account.type" class="textarea">
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
                    <select v-model="account.currency" class="textarea">
                        <option v-for="currency in currencys" :key="currency.value" :value="currency.value">
                            {{ currency.label }}
                        </option>
                    </select>
                </div>
            </div>
            <br>
            <div>
                <h4 class="acc_button_word_small">初始餘額:</h4>
                <input type="number" placeholder="0" v-model.number="account.initial" class="textarea">
            </div>
            <br>
                <h4 class="acc_button_word_small">是否計入資產:</h4>
                <span class="form-check form-switch ">
                    <input class="form-check-input" type="checkbox" role="switch" id="switchCheckDefault" v-model="account.exclude">
                </span>
            <br>
            <div>
                <label class="acc_button_word_small">圖示:</label>
                <div>
                    <button
                        v-for="(icon, index) in icons" 
                        :key="index" class="acc_button_color" 
                        :class="{ active: account.icon === icon }"
                        @click="account.icon = icon"
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

.form-switch .form-check-input {
    --bs-form-switch-bg: url(data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='rgba%280, 0, 0, 0.25%29'/%3e%3c/svg%3e);
    width: 4em;
    margin-left: -2.5em;
    background-image: var(--bs-form-switch-bg);
    background-position: left center;
    border-radius: 2em;
    transition: background-position .15s ease-in-out;
    padding: 15px;
}

.textarea {
        min-height: 3px;
        padding: 3px;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        resize: vertical;
    }

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
        z-index: 2000;
        padding: 20px;
    }

    .drag-bar {
    width: 40px;
    height: 5px;
    background: #cbd5e1;
    border-radius: 10px;
    margin: 8px auto;
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
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: hwb(0 100% 0% / 0) hwb(0 100% 0% / 0);
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
        margin: 8px;
        border-radius: 8px;
        transition: 0.2s;
    }

    .acc_button_color.active {
    outline: 2px solid #1e293b;
    outline-offset: 1px;
    background: #efefef;
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