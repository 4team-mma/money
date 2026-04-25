<!-- BookEditEventForm.vue -->
<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCalendarStore } from '@/stores/useCalendarStore'
import { integrationApi } from '@/api/integrations'

const props = defineProps({
    initialData: Object
})
const emit = defineEmits(['save-success', 'cancel'])

const calendarStore = useCalendarStore()

// local_ 開頭 = 從未真正同步到 Google（或 sync 後沒拉到真實 ID）
const isLocalOnly = computed(() => eventId.value.startsWith('local_'))

// 表單資料（從 initialData 初始化）
const form = ref({
    title:     props.initialData?.add_class || '',
    date:      props.initialData?.add_date || '',
    startTime: (props.initialData?.start_datetime || '').substring(11, 16) || '09:00',
    endTime:   (props.initialData?.end_datetime   || '').substring(11, 16) || '12:00',
})

const isSaving   = ref(false)
const isDeleting = ref(false)

const eventId  = computed(() => props.initialData?.add_id || '')
const hasToken = computed(() => !!calendarStore.googleToken)

// 建構 ISO 8601 時間（台灣時區）
const buildDateTime = (date, time) => `${date}T${time}:00+08:00`

// ─── 儲存 ───────────────────────────────────────────────────
const handleSave = async () => {
    if (!form.value.title.trim()) { ElMessage.warning('請輸入行程名稱喵！'); return }
    if (!form.value.date) { ElMessage.warning('請選擇日期喵！'); return }
    if (form.value.startTime >= form.value.endTime) {
        ElMessage.warning('結束時間必須晚於開始時間喵！'); return
    }

    isSaving.value = true
    try {
        const payload = {
            summary: form.value.title,
            start: { dateTime: buildDateTime(form.value.date, form.value.startTime), timeZone: 'Asia/Taipei' },
            end:   { dateTime: buildDateTime(form.value.date, form.value.endTime),   timeZone: 'Asia/Taipei' },
        }

        if (!isLocalOnly.value && hasToken.value) {
            // 有真實 Google ID 才呼叫 API
            await integrationApi.updateEvent(calendarStore.googleToken, eventId.value, payload)
            ElMessage.success('行程已更新並同步 Google 日曆！')
        } else if (isLocalOnly.value) {
            ElMessage.warning('此行程尚未與 Google 同步，僅更新本地顯示')
        } else {
            ElMessage.warning('Google Token 已過期，僅更新本地資料')
        }

        // 更新本地 Store
        calendarStore.updateEvent(eventId.value, {
            add_class:       form.value.title,
            add_date:        form.value.date,
            add_note:        `${form.value.startTime} ~ ${form.value.endTime}`,
            start_datetime:  buildDateTime(form.value.date, form.value.startTime),
            end_datetime:    buildDateTime(form.value.date, form.value.endTime),
        })

        emit('save-success')
    } catch (e) {
        ElMessage.error('更新失敗：' + (e.response?.data?.detail || e.message))
        
    } finally {
        isSaving.value = false
    }
}

// ─── 刪除 ───────────────────────────────────────────────────
const handleDelete = async () => {
    try {
        await ElMessageBox.confirm(
            `確定要刪除「${form.value.title}」嗎？\n此操作無法復原！`,
            '刪除確認',
            { confirmButtonText: '確定刪除', cancelButtonText: '取消', type: 'warning' }
        )
    } catch { return }

    isDeleting.value = true
    try {
        if (!isLocalOnly.value && hasToken.value) {
            // 有真實 Google ID 才呼叫 API
            await integrationApi.deleteEvent(calendarStore.googleToken, eventId.value)
            ElMessage.success('行程已刪除並同步 Google 日曆！')
        } else if (isLocalOnly.value) {
            ElMessage.info('此行程僅存在本地，已從顯示中移除')
        } else {
            ElMessage.warning('Google Token 已過期，僅從本地移除')
        }
        calendarStore.removeEvent(eventId.value)
        emit('save-success')
    } catch (e) {
        ElMessage.error('刪除失敗：' + (e.response?.data?.detail || e.message))
    } finally {
        isDeleting.value = false
    }
}

</script>

<template>
    <div class="event-form">
        <div class="form-header">
            <h3>📅 編輯行程</h3>
            <button class="close-btn" @click="$emit('cancel')">✕</button>
        </div>

        <!-- Token 過期提醒 -->
        <div v-if="!hasToken" class="warning-banner">
            ⚠️ Google Token 已過期，儲存 / 刪除不會同步至 Google 日曆。
            請重新點擊「授權 Google 日曆」按鈕。
        </div>

        <div class="form-body">
            <!-- 行程名稱 -->
            <div class="form-group">
                <label>行程名稱</label>
                <input v-model="form.title" class="form-input" placeholder="例：演算法課程" />
            </div>

            <!-- 日期 -->
            <div class="form-group">
                <label>日期</label>
                <input v-model="form.date" type="date" class="form-input" />
            </div>

            <!-- 時間 -->
            <div class="form-row">
                <div class="form-group">
                    <label>開始時間</label>
                    <input v-model="form.startTime" type="time" class="form-input" />
                </div>
                <div class="form-group">
                    <label>結束時間</label>
                    <input v-model="form.endTime" type="time" class="form-input" />
                </div>
            </div>

            <!-- 時間預覽 -->
            <div class="time-preview">
                🕐 {{ form.date || '日期未設定' }} &nbsp;
                {{ form.startTime }} ~ {{ form.endTime }}
            </div>
        </div>

        <!-- 操作按鈕 -->
        <div class="form-actions">
            <button class="btn-delete" @click="handleDelete" :disabled="isDeleting || isSaving">
                <span v-if="isDeleting">刪除中...</span>
                <span v-else>🗑️ 刪除行程</span>
            </button>

            <div class="right-btns">
                <button class="btn-cancel" @click="$emit('cancel')" :disabled="isSaving || isDeleting">
                    取消
                </button>
                <button class="btn-save" @click="handleSave" :disabled="isSaving || isDeleting">
                    <span v-if="isSaving">儲存中...</span>
                    <span v-else>💾 儲存</span>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.event-form {
    padding: 0;
    min-width: 360px;
    max-width: 480px;
}

.form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-color);
}

.form-header h3 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--text-primary);
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.1rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 4px 8px;
    border-radius: 6px;
}
.close-btn:hover { background: var(--bg-hover); }

.warning-banner {
    background: #fef3c7;
    color: #92400e;
    border-left: 4px solid #f59e0b;
    padding: 10px 16px;
    font-size: 0.82rem;
    line-height: 1.5;
}

.form-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 0.83rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.form-input {
    padding: 10px 14px;
    border-radius: 10px;
    border: 2px solid var(--border-color);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 1rem;
    box-sizing: border-box;
    width: 100%;
    transition: border-color 0.2s;
}
.form-input:focus {
    outline: none;
    border-color: var(--color-primary, #3b82f6);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.time-preview {
    background: var(--bg-hover);
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 0.88rem;
    color: var(--text-secondary);
    text-align: center;
}

.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--border-color);
    gap: 10px;
}

.right-btns {
    display: flex;
    gap: 10px;
}

.btn-save {
    background: var(--color-primary, #3b82f6);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
}
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-cancel {
    background: var(--bg-hover);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
}

.btn-delete {
    background: #fef2f2;
    color: #dc2626;
    border: 1px solid #fecaca;
    padding: 10px 16px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
}
.btn-delete:hover:not(:disabled) { background: #fee2e2; }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
</style>