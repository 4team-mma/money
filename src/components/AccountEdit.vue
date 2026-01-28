
<script setup>
import { reactive, watch} from 'vue'
import { accountApi } from '../api/account'
import { ElMessage } from 'element-plus'

// 1. 定義接收與傳出
const props = defineProps({
    initialData: {
        type: Object,
        required: true
    }
})
const emit = defineEmits(['save-success'])

// 2. 靜態選項資料 (與新增一致)
const accountTypes = [
    { value: 'cash', label: '現金' },
    { value: 'bank', label: '銀行帳戶' },
    { value: 'investment', label: '投資帳戶' },
    { value: 'other', label: '其他資產' },
    { value: 'credit', label: '信用卡' },
    { value: 'loan', label: '貸款' },
    { value: 'installment', label: '分期付款' },
    { value: 'debt_other', label: '其他負債' }
]

const debtTypeValues = ['credit', 'loan', 'installment', 'debt_other'];

const currencys = [
    { value: 'NT $', label: '新台幣 (TWD)' },
    { value: 'USD $', label: '美元 (USD)' },
    { value: 'EUR €', label: '歐元 (EUR)' },
    { value: 'JPY ¥', label: '日圓 (JPY)' }
]

const icons = ['💰', '💳', '💵','🏦', '📈', '📉', '🧾', '📱', '🪙', '🏃',"🐵", "🐶", "🐷", "🐻", "🐨", "🐮", "🦁", "🐯", "🐰", "🐭", "🦉", "🐸"]

// 3. 核心狀態：使用傳進來的 initialData 初始化
// 這裡用 reactive 建立副本，這樣修改時不會直接動到父層原始資料
const account = reactive({ ...props.initialData })

// 4. 監聽 props 變化 (預防父層連續切換編輯不同項目)
watch(() => props.initialData, (newData) => {
    Object.assign(account, newData)
}, { deep: true })

// 5. 提交編輯邏輯
const submitEdit = async () => {
    if (!account.name || !account.name.trim()) {
        ElMessage.warning('帳戶名稱不能為空')
        return
    }

    try {
        // 🌟 修正點：確保所有欄位名稱與後端 Schema 100% 一致
        const payload = {
            account_name: account.name,
            account_type: account.type,
            currency: account.currency,
            // 確保餘額是數字，若沒填則不傳或給 0
            initial_balance: account.initial !== undefined ? Number(account.initial) : 0, 
            account_icon: account.icon,
            // 確保 checkbox 是 boolean
            exclude_from_assets: Boolean(account.exclude) 
        }

        console.log("送出的 Payload:", payload); // 除錯用

        // 呼叫 API
        await accountApi.update(account.id, payload)
        
        ElMessage.success('更新成功！')
        emit('save-success')
    } catch (err) {
        console.error('更新失敗詳情:', err.response?.data || err)
        ElMessage.error('儲存失敗，請檢查網路連線')
    }
}
</script>

<template>
    <div class="edit-form-wrap">
            <div class="acc_head">
            <h3 class="acc_button_word">編輯帳戶</h3>
            <button @click="$emit('save-success')" class="btn-icon">✕</button>
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
                <h4 class="acc_button_word_small" v-if="debtTypeValues.includes(account.type)" >初始負債:</h4>
                <h4 class="acc_button_word_small" v-else >初始餘額:</h4>
                <input type="number" placeholder="0" v-model.number="account.initial" class="textarea">
            </div>
            <br>
                <h4 class="acc_button_word_small">不計入資產:</h4>
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
            <button class="submit_button" @click="submitEdit">儲存變更</button>
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

.edit-form-wrap { padding: 10px; font-family: sans-serif; }
.edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }


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
        letter-spacing:2px ;
        font-size: 30px;
        font-weight: 500;
        color: #1e293b;
    }

    .acc_button_word_small{
        font-size: 20px;
        font-weight: 300;
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