<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import Nav from '@/components/Nav.vue'
import Add_bar from '@/components/AddBar.vue'
import Add_cato from '@/components/AddCato.vue'
import Add_account from '@/components/AddAccount.vue'
import Add_member from '@/components/AddMember.vue'
import Add_tag from '@/components/AddTag.vue'

// 月曆與通知套件
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import api from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 1. 定義響應式表單資料結構 (與後端 AddRecordCreate Schema 對接)
const form = reactive({
    add_date: new Date(),
    add_amount: null,
    add_type: false,      // False 為支出 //True為收入
    add_class: '飲食',    // 預設值，會被子組件更新
    add_class_icon: '🍔',
    account_id: null,
    add_member: '自己',
    add_tag: '一般',
    add_note: ''
})

/* ---------- 子組件回傳事件處理 (Data Sync) ---------- */

// 處理類別更新 (從 Add_cato.vue)
const handleCatoUpdate = (item) => {
    form.add_class = item.itemName
    form.add_class_icon = item.icon
}

// 處理帳戶更新 (從 Add_account.vue)
const handleAccountUpdate = (item) => {
    form.account_id = item.id
}

// 處理成員更新 (從 Add_member.vue)
const handleMemberUpdate = (item) => {
    form.add_member = item.itemName
}

// 處理標籤更新 (從 Add_tag.vue)
// 因為標籤是多選，將其轉為字串存入 add_tag 欄位
const handleTagUpdate = (items) => {
    form.add_tag = items.map(i => i.itemName).join(', ')
}

/* ---------- 儲存邏輯 ---------- */

// 通用發送函式
const submitData = async () => {
    if (form.add_amount <= 0) {
        ElMessage.warning('請輸入有效的金額');
        return false;
    }
    if (!form.account_id) {
        ElMessage.warning('請選擇帳戶');
        return false;
    }

    const payload = {
        ...form,
        // 日期轉化為 YYYY-MM-DD
        add_date: form.add_date.toISOString().split('T')[0],
        add_amount: parseFloat(form.add_amount)
    }

    await api.post('/records/', payload)
    return true
}

// 情況 A：儲存並返回帳本頁面
const handleSave = async () => {
    try {
        const success = await submitData()
        if (success) {
            ElMessage.success('儲存成功！');
            router.push('/book')
        }
    } catch (err) {
        ElMessage.error('儲存失敗：' + (err.response?.data?.detail || '後端連線異常'));
    }
}

// 情況 B：再記一筆 (留在原頁面並重設部分欄位)
const handleSaveNext = async () => {
    try {
        const success = await submitData()
        if (success) {
            ElMessage.success('已儲存，請繼續輸入下一筆');
            // 只重置金額與備註，保留類別、帳戶等選擇，加快連續輸入速度
            form.add_amount = null
            form.add_note = ''
        }
    } catch (err) {
        ElMessage.error('儲存失敗');
    }
}

const formatNote = () => {
    if (!form.add_note) return;

    // 1. 先將文字拆分，並進行「去空白」與「過濾空行」
    // .filter(line => line.length > 0) 確保不會出現只有 - 的空行
    const rawLines = form.add_note.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0); 

    const result = [];

    for (let i = 0; i < rawLines.length; i++) {
        let current = rawLines[i];
        
        // 判斷這行是否為金額 (包含 $ 符號)
        const isPrice = current.includes('$') || current.includes('＄');

        if (isPrice && result.length > 0) {
            // 🌟 核心邏輯：如果是金額，就合併到上一行的尾巴
            const lastIndex = result.length - 1;
            result[lastIndex] = `${result[lastIndex]} ➔ ${current}`;
        } else {
            // 如果是一般品項，前面加上藍色小圖示
            result.push(`🔹 ${current}`);
        }
    }

    // 2. 重新組合內容
    form.add_note = `【整理明細】\n${result.join('\n')}`;

    ElMessage.success('排版已優化，已自動剔除空行');
}

</script>

<template>
    <Nav>
        <div class="page">
            <Add_bar />

            <div class="card">
                <div class="header">
                    <h2>新增支出</h2>
                    <DatePicker v-model="form.add_date">
                        <template #default="{ togglePopover, inputValue, inputEvents }">
                            <div>
                                <button @click="togglePopover" style="border:0; cursor:pointer">🗓</button>
                                <input :value="inputValue" v-on="inputEvents" readonly class="date-display-input" />
                            </div>
                        </template>
                    </DatePicker>
                </div>

                <div class="form-group">
                    <label>支出金額</label>
                    <input v-model.number="form.add_amount" type="number" placeholder="NT$ 0" class="amount-input" />
                </div>

                <div class="grid">
                    <div class="form-group">
                        <label>類別</label>
                        <Add_cato @update:model-value="handleCatoUpdate" />
                    </div>

                    <div class="form-group">
                        <label>帳戶</label>
                        <Add_account @update:model-value="handleAccountUpdate" />
                    </div>

                    <div class="form-group">
                        <label>成員</label>
                        <Add_member @update:model-value="handleMemberUpdate" />
                    </div>

                    <div class="form-group">
                        <label>標籤</label>
                        <Add_tag @update:model-value="handleTagUpdate" />
                    </div>
                </div>

                <div class="form-group">
                        
                </div>

                <div class="form-group">
                    <div style="">
                        <label>備註  </label>
                        <button @click="formatNote"  class="btn btn-info"
                        style="margin-left: 20px;"
                        >自動整理</button>
                    </div>
                    <textarea v-model="form.add_note" placeholder="補充說明（選填）"></textarea>                   
                </div>

                <div class="actions">
                    <button @click="handleSave" class="btn-primary">儲存</button>
                    <button @click="handleSaveNext" class="btn-secondary">再記一筆</button>
                </div>
            </div>
        </div>
    </Nav>
</template>


<style scoped>
@import '../assets/css/add.css';

.card {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06);
}

.header {
    margin-bottom: 24px;
}

.header h2 {
    margin: 0;
    font-size: 1.5rem;
}

.date {
    font-size: 0.9rem;
    color: #64748b;
}



label {
    font-size: 0.85rem;
    color: #475569;
}

/* 金額 */
.amount-input {
    height: 52px;
    font-size: 1.4rem;
    font-weight: 600;
    padding: 0 16px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
}

/* textarea */
textarea {
    min-height: 120px;
    padding: 12px;
    border-radius: 12px;
    border: 2px solid #e2e8f0;
    resize: vertical;
}

/* Actions */
.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}

.btn-primary {
    background: #2563eb;
    color: white;
    padding: 10px 20px;
    border: 0px;
    border-radius: 10px;
    font-weight: 600;

}

.btn-secondary {
    background: #e7eef5;
    color: #334155;
    padding: 10px 20px;
    border-radius: 10px;
    border: 0px;
}
</style>