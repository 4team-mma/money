<script setup>
import { onMounted, watch } from 'vue'
import { useAddRecord } from '@/composables/useAddRecord'
import { DatePicker } from 'v-calendar'
import 'v-calendar/style.css'
import Add_cato from './AddCato.vue'
import Add_cato_inn from './AddCatoInn.vue'
import Add_account from './AddAccount.vue'
import Add_member from './AddMember.vue'
import Add_tag from './AddTag.vue'

const props = defineProps({ initialData: Object })
const emit = defineEmits(['save-success', 'cancel'])

const { 
    form, setFormData, handleCatoUpdate, handleAccountUpdate,
    handleMemberUpdate, handleTagUpdate, 
    handleSave, isSubmitting 
} = useAddRecord()

onMounted(() => { if (props.initialData) setFormData(props.initialData) })
watch(() => props.initialData, (newVal) => { if (newVal) setFormData(newVal) })

const onSave = async () => {
    const res = await handleSave()
    if (res?.success) emit('save-success')
}
</script>

<template>
    <div class="edit-form-wrap">
        <div class="edit-header">
            <h3>{{ form.add_type ? '編輯收入' : '編輯支出' }}</h3>
            <DatePicker v-model="form.add_date" mode="date" :masks="{ title: 'YYYY年 MMM' }">
                <template #default="{ togglePopover, inputValue }">
                    <div class="date-trigger" @click="togglePopover">
                        <span class="icon">🗓️</span><span>{{ inputValue }}</span>
                    </div>
                </template>
            </DatePicker>
        </div>

        <div class="form-item">
            <label>交易金額</label>
            <div class="amount-input-box">
                <span class="currency">NT$</span>
                <input v-model.number="form.add_amount" type="number" class="main-amount" />
            </div>
        </div>

        <div class="form-grid">
            <div class="form-item">
                <label>{{ form.add_type ? '收入類別' : '消費類別' }}</label>
                <Add_cato_inn v-if="form.add_type === true" :modelValue="form.add_class" @update:model-value="handleCatoUpdate" />
                <Add_cato v-else :modelValue="form.add_class" @update:model-value="handleCatoUpdate" />
            </div>
            <div class="form-item">
                <label>帳戶</label>
                <Add_account :account="form.account" @update:account="handleAccountUpdate" />
            </div>
            <div class="form-item">
                <label>成員</label>
                <Add_member :modelValue="form.add_member" @update:model-value="handleMemberUpdate" />
            </div>
            <div class="form-item">
                <label>標籤</label>
                <Add_tag :modelValue="form.add_tag" @update:model-value="handleTagUpdate" />
            </div>
        </div>

        <div class="form-item">
            <div class="note-label">
                <label>備註內容</label>
            
            </div>
            <textarea v-model="form.add_note" placeholder="輸入備註" rows="2"></textarea>
        </div>

        <div class="actions">
            <button class="btn-cancel" @click="emit('cancel')">取消</button>
            <button class="btn-submit" @click="onSave" :disabled="isSubmitting">
                {{ isSubmitting ? '處理中...' : '更新紀錄' }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.edit-form-wrap { padding: 10px; font-family: sans-serif; }
.edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.date-trigger { cursor: pointer; background: #f8fafc; padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0; }

.form-item { margin-bottom: 16px; }
.form-item label { display: block; font-size: 14px; color: #64748b; margin-bottom: 6px; }

.amount-input-box { display: flex; align-items: center; border-bottom: 2px solid #3b82f6; padding: 4px 0; }
.currency { font-size: 18px; font-weight: bold; margin-right: 8px; color: #1e293b; }
.main-amount { border: none; outline: none; font-size: 28px; font-weight: bold; width: 100%; color: #1e293b; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }

.note-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.btn-auto { font-size: 12px; color: #3b82f6; background: #eff6ff; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; }
textarea { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-size: 14px; resize: none; box-sizing: border-box; }

.actions { display: flex; gap: 10px; margin-top: 10px; }
.btn-submit { flex: 2; background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-cancel { flex: 1; background: #f1f5f9; color: #64748b; border: none; padding: 12px; border-radius: 8px; cursor: pointer; }

.btn-submit:hover { background: #2563eb; }

.icon {
    font-size: 1.2rem;
    margin-right: 8px;
    vertical-align: middle; /* 讓圖示與文字對齊 */
    display: inline-block;
    transition: transform 0.2s; /* 增加懸停動畫 */
}

/* 滑鼠移上去時圖示稍微放大 */
.btn-icon:hover .icon {
    transform: scale(1.2);
}
</style>