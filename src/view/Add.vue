<script setup>
import Nav from '@/components/Nav.vue'
import Add_bar from '@/components/AddBar.vue'
import Add_cato from '@/components/AddCato.vue'
import Add_account from '@/components/AddAccount.vue'
import Add_member from '@/components/AddMember.vue'
import Add_tag from '@/components/AddTag.vue'
import { useAddRecord } from '@/composables/useAddRecord'

// 月曆與通知套件
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';

// 調用 Composable，傳入 false (支出)
const { 
    form, handleCatoUpdate, handleAccountUpdate, 
    handleMemberUpdate, handleTagUpdate, handleSave, 
    handleSaveNext, formatNote 
} = useAddRecord(false)

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
                    <div style="">
                        <label>備註:  </label>
                        <button @click="formatNote"  class="btn btn-info"
                        style="margin-left: 20px;"
                        >自動整理</button>
                    </div>
                    <textarea v-model="form.add_note" placeholder="補充說明（選填）"></textarea>                   
                </div>

                <div class="actions">
                    <button  @click="handleSave" class="btn-primary">儲存支出</button>
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