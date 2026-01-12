import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'

// initialType: false 為支出, true 為收入, 'transfer' 為轉帳
export function useAddRecord(initialType = false) {
    const router = useRouter()
    const isSubmitting = ref(false)

    const form = reactive({
        add_date: new Date(),
        add_amount: null,
        add_type: initialType,
        // 🌟 根據類型給預設類別，加入轉帳判斷
        add_class: initialType === true ? '薪資' : (initialType === 'transfer' ? '轉帳' : '飲食'),
        add_class_icon: initialType === true ? '💰' : (initialType === 'transfer' ? '🔄' : '🍔'),
        account: null,         // 這裡存放選中的帳戶物件 (支出/收入 或 轉帳目標)
        source_account: null,  // 🌟 轉帳用的來源帳戶物件
        add_member: '自己',
        add_tag: '一般',
        add_note: ''
    })

    // 同步子組件資料的方法
    const handleCatoUpdate = (item) => {
        if (item) {
            form.add_class = item.itemName
            form.add_class_icon = item.icon
        }
    }

    // 🌟 修正：改為儲存整個物件，這樣 submitData 才能讀到 account.account_id
    const handleAccountUpdate = (item) => { 
        if (item) form.account = item 
    }

    // 🌟 轉帳專用：更新來源帳戶
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
        // 驗證轉帳欄位
        if (!form.source_account?.account_id || !form.account?.account_id) {
            ElMessage.warning('請選擇轉出與轉入帳戶');
            return false;
        }
        
        // 建立轉帳專用的 Payload (對應後端 TransferCreate)
        const transferPayload = {
            transaction_date: safeDateString,
            from_account_id: form.source_account.account_id,
            to_account_id: form.account.account_id,
            amount: parseFloat(form.add_amount)
        };

        // 🌟 改發送到 /transfers/
        await api.post('/transfers/', transferPayload);

    } else {
        // 驗證收支欄位
        if (!form.account?.account_id) {
            ElMessage.warning('請選擇帳戶');
            return false;
        }

        const recordPayload = {
            add_date: safeDateString,
            add_amount: parseFloat(form.add_amount),
            add_type: form.add_type === true, // 轉回後端要求的布林值
            add_class: form.add_class,
            add_class_icon: form.add_class_icon,
            account_id: form.account.account_id,
            add_member: form.add_member,
            add_tag: form.add_tag,
            add_note: form.add_note
        };

        // 🌟 維持發送到 /records/
        await api.post('/records/', recordPayload);
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