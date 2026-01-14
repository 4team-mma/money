import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createRecord } from '@/api/record'
import { createTransfer } from '@/api/transfer'

export function useAddRecord(initialType = false) {
    const router = useRouter()
    const isSubmitting = ref(false)
// add_id跟user_id不傳,一個是自動遞增,一個是安全性考量
    const form = reactive({
        add_date: new Date(),
        add_amount: null,
        add_type: initialType,
        add_class: initialType === true ? '薪資' : (initialType === 'transfer' ? '轉帳' : '飲食'),
        add_class_icon: initialType === true ? '💰' : (initialType === 'transfer' ? '🔄' : '🍔'),
        account: null,         
        source_account: null,  
        add_member: '自己',
        add_tag: '一般',
        add_note: ''
    })

    const handleCatoUpdate = (item) => {
        if (item) {
            form.add_class = item.itemName
            form.add_class_icon = item.icon
        }
    }

    const handleAccountUpdate = (item) => { 
        if (item) form.account = item 
    }

    const handleSourceUpdate = (item) => {
        if (item) form.source_account = item
    }

    const handleMemberUpdate = (item) => { 
        if (item) form.add_member = item.itemName 
    }

    const handleTagUpdate = (items) => {
        if (items && Array.isArray(items)) {
            form.add_tag = items.map(i => i.itemName).join(', ')
        }
    }

    const submitData = async () => {
        if (form.add_amount <= 0 || !form.add_amount) {
            ElMessage.warning('請輸入有效的金額');
            return false;
        }

        const d = form.add_date;
        const safeDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        // 🚀 關鍵分流邏輯
        if (form.add_type === 'transfer') {
            if (!form.source_account?.account_id || !form.account?.account_id) {
                ElMessage.warning('請選擇轉出與轉入帳戶');
                return false;
            }
            
            const transferPayload = {
                transaction_date: safeDateString,
                from_account_id: form.source_account.account_id,
                to_account_id: form.account.account_id,
                amount: parseFloat(form.add_amount)
            };

            // 🌟 使用拆分後的 API
            await createTransfer(transferPayload);

        } else {
            if (!form.account?.account_id) {
                ElMessage.warning('請選擇帳戶');
                return false;
            }

            const recordPayload = {
                add_date: safeDateString,
                add_amount: parseFloat(form.add_amount),
                add_type: form.add_type === true, 
                add_class: form.add_class,
                add_class_icon: form.add_class_icon,
                account_id: form.account.account_id,
                add_member: form.add_member,
                add_tag: form.add_tag,
                add_note: form.add_note
            };

            // 🌟 使用拆分後的 API
            await createRecord(recordPayload);
        }
        return true;
    }

    const handleSave = async () => {
        if (isSubmitting.value) return;
        isSubmitting.value = true;
        try {
            if (await submitData()) {
                ElMessage.success('儲存成功！');
                router.push('/book')
            }
        } catch (err) {
            ElMessage.error('儲存失敗：' + (err.response?.data?.detail || '連線異常'));
        } finally {
            isSubmitting.value = false;
        }
    }

    const handleSaveNext = async () => {
        if (isSubmitting.value) return;
        isSubmitting.value = true;
        try {
            if (await submitData()) {
                ElMessage.success('已儲存，請繼續下一筆');
                form.add_amount = null
                form.add_note = ''
            }
        } catch (err) { ElMessage.error('儲存失敗'); }
        finally { isSubmitting.value = false; }
    }

    const formatNote = () => {
        if (!form.add_note) return;
        const rawLines = form.add_note.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const result = [];
        for (let line of rawLines) {
            const isPrice = line.includes('$') || line.includes('＄');
            if (isPrice && result.length > 0) result[result.length - 1] += ` ➔ ${line}`;
            else result.push(`🔹 ${line}`);
        }
        form.add_note = `【整理明細】\n${result.join('\n')}`;
        ElMessage.success('排版已優化');
    }

    return {
        form,
        handleCatoUpdate,
        handleAccountUpdate,
        handleSourceUpdate,
        handleMemberUpdate,
        handleTagUpdate,
        handleSave,
        handleSaveNext,
        isSubmitting,
        formatNote
    }
}