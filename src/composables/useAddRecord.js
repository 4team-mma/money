import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// 修正：將 create 與 update 放在同一個 import 中，避免重複宣告
import { createRecord, updateRecord } from '@/api/record'
import { createTransfer, updateTransfer } from '@/api/transfer'

export function useAddRecord(initialType = false) {
    const router = useRouter()
    const isSubmitting = ref(false)

    // add_id 用來判斷是「新增」還是「修改」
    const form = reactive({
        add_id: null,          
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

    // 🌟 核心功能：讓隊友點擊編輯時，把舊資料帶入表單
    const setFormData = (data) => {
        if (!data) return
        form.add_id = data.add_id
        form.add_date = data.add_date ? new Date(data.add_date) : new Date()
        form.add_amount = data.add_amount
        form.add_type = data.add_type
        form.add_class = data.add_class
        form.add_class_icon = data.add_class_icon
        form.add_member = data.add_member
        form.add_tag = data.add_tag
        form.add_note = data.add_note
        
        // 對應 Add_account 組件需要的物件格式
        if (data.account_id) {
            form.account = { 
                account_id: data.account_id, 
                itemName: data.account_name || '預設帳戶', 
                icon: data.account_icon || '🏦'
            }
        }
    }

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
        if (!form.add_amount || form.add_amount <= 0) {
            ElMessage.warning('請輸入有效的金額')
            return false
        }

        const d = form.add_date
        const safeDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        if (form.add_type === 'transfer') {
            if (!form.source_account?.account_id || !form.account?.account_id) {
                ElMessage.warning('請選擇轉出與轉入帳戶')
                return false
            }
            
            const transferPayload = {
                transaction_date: safeDateString,
                from_account_id: form.source_account.account_id,
                to_account_id: form.account.account_id,
                amount: parseFloat(form.add_amount)
            }

            // 🚀 判斷新增或更新
            if (form.add_id) {
                await updateTransfer(form.add_id, transferPayload)
            } else {
                await createTransfer(transferPayload)
            }

        } else {
            if (!form.account?.account_id) {
                ElMessage.warning('請選擇帳戶')
                return false
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
            }

            // 🚀 判斷新增或更新
            if (form.add_id) {
                await updateRecord(form.add_id, recordPayload)
            } else {
                await createRecord(recordPayload)
            }
        }
        return true
    }

    const handleSave = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true
        try {
            if (await submitData()) {
                ElMessage.success(form.add_id ? '修改成功！' : '儲存成功！')
                router.push('/book')
                return {'success': true}
            }
        } catch (err) {
            ElMessage.error('儲存失敗：' + (err.response?.data?.detail || '連線異常'))
        } finally {
            isSubmitting.value = false
        }
    }

    const handleSaveNext = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true
        try {
            if (await submitData()) {
                ElMessage.success('已儲存，請繼續下一筆')
                form.add_amount = null
                form.add_note = ''
                form.add_id = null // 清空 ID 避免下一筆變成修改
            }
        } catch (err) { ElMessage.error('儲存失敗') }
        finally { isSubmitting.value = false }
    }

    const formatNote = () => {
        if (!form.add_note) return
        const rawLines = form.add_note.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        const result = []
        for (let line of rawLines) {
            const isPrice = line.includes('$') || line.includes('＄')
            if (isPrice && result.length > 0) result[result.length - 1] += ` ➔ ${line}`
            else result.push(`🔹 ${line}`)
        }
        form.add_note = `【整理明細】\n${result.join('\n')}`
        ElMessage.success('排版已優化')
    }

    return {
        form,
        setFormData, // 🌟 暴露給隊友使用
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