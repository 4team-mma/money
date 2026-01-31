// composables/useAddRecord.js
import { reactive, ref, computed } from 'vue' // 1. 補上 computed
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createRecord, updateRecord } from '@/api/record'
import { createTransfer, updateTransfer } from '@/api/transfer'
// 2. 補上 Store 的引用
import { useAccountStore } from '@/stores/useAccountStore'

export function useAddRecord(initialType = false) {
    const router = useRouter()
    
    // 3. 在這裡初始化 Store，這樣下面的 computed 才能用
    const accountStore = useAccountStore() 
    
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

    // 4. 🌟 將 computed 移出 setFormData，放在主層級
    // 這樣才能隨時監聽 form.account 的變化
    const currentCurrency = computed(() => {
        const selected = form.account;

        // 防呆：如果是 null 或 undefined
        if (!selected) return '金額';

        // 如果它已經是「物件」，直接讀取裡面的 currency
        if (typeof selected === 'object') {
            return selected.currency || 'NT$';
        }

        // 如果它是「ID」，去 Store 列表尋找
        if (accountStore.accounts.length > 0) {
            // 使用 == 避免字串/數字型別問題
            const found = accountStore.accounts.find(acc => acc.account_id == selected);
            return found ? (found.currency || 'NT$') : '金額';
        }

        return '金額';
    })

    // 核心功能：讓隊友點擊編輯時，把舊資料帶入表單
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

        // 處理轉入/一般帳戶
        if (data.account_id) {
            form.account = {
                account_id: data.account_id,
                itemName: data.account_name || '預設帳戶',
                icon: data.account_icon || '🏦'
            }
        }
        
        // (原本錯放在這裡的 computed 已經移出去了)

        // 新增：處理轉出帳戶 (如果資料裡有 from_account_id)
        if (data.from_account_id) {
            form.source_account = {
                account_id: data.from_account_id,
                itemName: data.from_account_name || '轉出帳戶',
                icon: data.from_account_icon || '🏦'
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
        if (item) {
            form.account = item;
            // 防呆
            if (form.source_account?.account_id === item.account_id) {
                form.source_account = null;
            }
        }
    }

    const handleSourceUpdate = (item) => {
        if (item) {
            form.source_account = item;
            // 防呆
            if (form.account?.account_id === item.account_id) {
                form.account = null;
            }
        }
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
        }if (form.add_amount >= 1000000000) {   //資料庫預設上限
        ElMessage.warning('金額超過系統單筆上限')
        return false
    }
    // 備註長度限制：配合 VARCHAR(500)
    // 我們在送出前最後檢查一次，避免超過 500 字
    if (form.add_note && form.add_note.length > 500) {
        ElMessage.warning(`備註內容太長了 (目前 ${form.add_note.length}/500 字)`)
        return false
    }

        const d = form.add_date
        const safeDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

        if (form.add_type === 'transfer') {
            if (form.source_account?.account_id === form.account?.account_id) {
                ElMessage.error('轉出帳戶與轉入帳戶不能相同')
                return false
            }

            if (!form.source_account?.account_id || !form.account?.account_id) {
                ElMessage.warning('請選擇轉出與轉入帳戶')
                return false
            }
            
            const transferPayload = {
                transaction_date: safeDateString,
                from_account_id: form.source_account.account_id,
                to_account_id: form.account.account_id,
                transaction_note: form.add_note,
                amount: parseFloat(form.add_amount)
            }

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
                return { 'success': true }
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
                form.add_id = null
            }
        } catch (err) { ElMessage.error('儲存失敗') }
        finally { isSubmitting.value = false }
    }

 

    return {
        form,
        setFormData,
        handleCatoUpdate,
        handleAccountUpdate,
        handleSourceUpdate,
        handleMemberUpdate,
        handleTagUpdate,
        handleSave,
        handleSaveNext,
        isSubmitting,
        currentCurrency // 回傳給 Vue 元件使用
    }
}