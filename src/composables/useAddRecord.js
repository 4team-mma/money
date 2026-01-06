import { reactive,ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'
import { ElMessage } from 'element-plus'
import Loading from 'element-plus/es/components/loading/src/service'

// initialType: false 為支出, true 為收入
export function useAddRecord(initialType = false) {
    const router = useRouter()

    const isSubmitting =ref(false)

    const form = reactive({
        add_date: new Date(),
        add_amount: null,
        add_type: initialType,
        add_class: initialType ? '薪資' : '飲食', // 根據類型給預設類別
        add_class_icon: initialType ? '💰' : '🍔',
        account_id: 1,
        add_member: '自己',
        add_tag: '一般',
        add_note: ''
    })

    // 同步子組件資料的方法
    const handleCatoUpdate = (item) => {
        form.add_class = item.itemName
        form.add_class_icon = item.icon
    }
    const handleAccountUpdate = (item) => { form.account_id = item.id }
    const handleMemberUpdate = (item) => { form.add_member = item.itemName }
    const handleTagUpdate = (items) => {
        form.add_tag = items.map(i => i.itemName).join(', ')
    }

    const submitData = async () => {
        if (form.add_amount <= 0 || !form.add_amount) {
            ElMessage.warning('請輸入有效的金額');
            return false;
        }
        if (!form.account_id) {
            ElMessage.warning('請選擇帳戶');
            return false;
        }

        const d = form.add_date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0'); // 月份從0開始，要+1
        const day = String(d.getDate()).padStart(2, '0');
        const safeDateString = `${year}-${month}-${day}`;
        const payload = {
            ...form,
            add_date: safeDateString,
            add_amount: parseFloat(form.add_amount)
        }

        await api.post('/records/', payload)
        return true
    }

    const handleSave = async () => {
        //鎖定按鈕,如果在發送中就不執行後面程式碼
        if (isSubmitting.value) return;
        isSubmitting.value = true;
        try {
            if (await submitData()) {
                ElMessage.success('儲存成功！');
                router.push('/book')
            }
        } catch (err) {
            ElMessage.error('儲存失敗：' + (err.response?.data?.detail || '連線異常'));
        }finally {
            // 請求結束（無論成功失敗）都要解鎖，除非已經跳轉頁面
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
        finally {
            // 同上
            isSubmitting.value = false;
        }
    }

    const formatNote = () => {
        if (!form.add_note) return;
        const rawLines = form.add_note.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const result = [];
        for (let line of rawLines) {
            const isPrice = line.includes('$') || line.includes('＄');
            if (isPrice && result.length > 0) {
                result[result.length - 1] += ` ➔ ${line}`;
            } else {
                result.push(`🔹 ${line}`);
            }
        }
        form.add_note = `【整理明細】\n${result.join('\n')}`;
        ElMessage.success('排版已優化');
    }

    // 回傳 上面所有定義的內容
    return {
        form,
        handleCatoUpdate,
        handleAccountUpdate,
        handleMemberUpdate,
        handleTagUpdate,
        handleSave,
        handleSaveNext,
        isSubmitting,
        formatNote
    }
}