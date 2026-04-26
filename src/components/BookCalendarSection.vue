<script setup>
//BookCalendarSection.vue
import { Calendar } from "v-calendar";
import { ref, reactive } from "vue";
import { integrationApi } from '@/api/integrations';
import { ElMessage, ElLoading } from 'element-plus';
import { useCalendarStore } from '@/stores/useCalendarStore'

const props = defineProps({
    attributes: Array,
    today: String,
    selectedDate: String,
});

const emit = defineEmits(["select-date", "move-today", "update-date", "refresh-with-events"]);

const calendar = ref(null);
const scheduleInput = ref(null);
const tempGoogleToken = ref(null);
const calendarStore = useCalendarStore()

const previewVisible = ref(false);
const pendingEvents = ref([]);
const currentGoogleToken = ref('');

// ══════════════════════════════════════════════
// 🌟 批量設定：上午/下午各自可自訂時間
// ══════════════════════════════════════════════
const batchSettings = reactive({
    morning: { start: '09:00', end: '12:00' },
    afternoon: { start: '13:30', end: '16:30' }
})

/**
 * 智慧批量套用：
 * - 判斷每筆行程目前是上午還是下午（以 12:00 為分界）
 * - 分別套用對應的批量時間，保留 AM/PM 結構
 */
const applySmartBatch = () => {
    pendingEvents.value.forEach(event => {
        const currentHour = parseInt(event.start.dateTime.substring(11, 13))
        const datePart = event.start.dateTime.substring(0, 10)
        const setting = currentHour < 12 ? batchSettings.morning : batchSettings.afternoon
        event.start.dateTime = `${datePart}T${setting.start}:00+08:00`
        event.end.dateTime = `${datePart}T${setting.end}:00+08:00`
    })
    ElMessage.success('已套用批量時間（上午/下午各自保留）')
}

// 只套用上午那些
const applyMorningOnly = () => {
    pendingEvents.value.forEach(event => {
        const currentHour = parseInt(event.start.dateTime.substring(11, 13))
        if (currentHour < 12) {
            const datePart = event.start.dateTime.substring(0, 10)
            event.start.dateTime = `${datePart}T${batchSettings.morning.start}:00+08:00`
            event.end.dateTime = `${datePart}T${batchSettings.morning.end}:00+08:00`
        }
    })
    ElMessage.success('已套用上午時段')
}

// 只套用下午那些
const applyAfternoonOnly = () => {
    pendingEvents.value.forEach(event => {
        const currentHour = parseInt(event.start.dateTime.substring(11, 13))
        if (currentHour >= 12) {
            const datePart = event.start.dateTime.substring(0, 10)
            event.start.dateTime = `${datePart}T${batchSettings.afternoon.start}:00+08:00`
            event.end.dateTime = `${datePart}T${batchSettings.afternoon.end}:00+08:00`
        }
    })
    ElMessage.success('已套用下午時段')
}

// 取得單筆的時間（供 input 雙向綁定用）
const getEventStartTime = (event) => event.start.dateTime.substring(11, 16)
const getEventEndTime = (event) => event.end.dateTime.substring(11, 16)

// 更新單筆開始時間
const updateStartTime = (event, newTime) => {
    const datePart = event.start.dateTime.substring(0, 10)
    event.start.dateTime = `${datePart}T${newTime}:00+08:00`
}

// 更新單筆結束時間
const updateEndTime = (event, newTime) => {
    const datePart = event.end.dateTime.substring(0, 10)
    event.end.dateTime = `${datePart}T${newTime}:00+08:00`
}

// ══════════════════════════════════════════════
// 授權與上傳流程（不變）
// ══════════════════════════════════════════════
const requestTokenOnly = async () => {
    try {
        const token = await requestGoogleCalendarToken();
        if (token) {
            tempGoogleToken.value = token;
            calendarStore.setGoogleToken(token)
            ElMessage.success('Google 授權成功！請點擊第二步選擇圖片喵～');
        }
    } catch (error) {
        console.error("授權失敗", error);
        ElMessage.error('授權失敗，請檢查瀏覽器是否攔截彈窗喵。');
    }
};

const handleScheduleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !tempGoogleToken.value) return;
    await processAndSyncSchedule(file, tempGoogleToken.value);
    event.target.value = '';
    tempGoogleToken.value = null;
};

const requestGoogleCalendarToken = () => {
    return new Promise((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/calendar.events',
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    resolve(tokenResponse.access_token);
                } else {
                    reject(new Error('未取得授權'));
                }
            },
            error_callback: (error) => { reject(error); }
        });
        client.requestAccessToken({ prompt: 'consent' });
    });
};

const processAndSyncSchedule = async (file, accessToken) => {
    const loading = ElLoading.service({
        lock: true,
        text: 'AI 喵喵正在努力解析課表（大約需要 30-120 秒）...',
    });
    try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await integrationApi.analyze(formData);
        const analyzeRes = res?.data ?? res;
        if (!analyzeRes?.success) throw new Error('AI 解析失敗或格式不正確喵');

        const eventsFromAI = analyzeRes?.events ?? [];
        if (eventsFromAI.length === 0) {
            ElMessage.warning('AI 沒辨識出任何內容，請手動新增喵！');
        }

        const normalizeDateTime = (dt) => dt.includes('+08:00') ? dt : dt + '+08:00';

        pendingEvents.value = eventsFromAI.map(e => ({
            ...e,
            start: { dateTime: normalizeDateTime(e.start.dateTime) },
            end: { dateTime: normalizeDateTime(e.end.dateTime) }
        }));
        currentGoogleToken.value = accessToken;
        previewVisible.value = true;

        ElMessage.success(`解析完成！共 ${eventsFromAI.length} 筆行程，請校對時間喵～`);
    } catch (error) {
        const msg = error.message.includes('timeout')
            ? 'AI 思考太久了，請再試一次或換一張小一點的圖喵'
            : error.message;
        ElMessage.error('失敗：' + msg);
    } finally {
        loading.close();
    }
};

const removeEvent = (index) => pendingEvents.value.splice(index, 1);

const addNewRow = () => {
    const today = props.selectedDate || new Date().toISOString().substring(0, 10)
    pendingEvents.value.push({
        summary: '新課程',
        start: { dateTime: `${today}T09:00:00+08:00` },
        end: { dateTime: `${today}T10:00:00+08:00` }
    });
};

const handleFinalSync = async () => {
    const loading = ElLoading.service({ lock: true, text: '正在同步至 Google 日曆...' });
    try {
        const syncPayload = {
            events: pendingEvents.value,
            google_token: currentGoogleToken.value
        };

        const syncResRaw = await integrationApi.sync(syncPayload);
        const syncRes = (syncResRaw && syncResRaw.events_added !== undefined) ? syncResRaw : syncResRaw.data;

        let displayEvents
        try {
            const realRes = await integrationApi.getEvents(
                currentGoogleToken.value,
                new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()
            )
            displayEvents = Array.isArray(realRes) ? realRes : (realRes.data ?? [])
        } catch {
            displayEvents = pendingEvents.value.map(e => ({
                ...e, add_date: e.start.dateTime.substring(0, 10)
            }))
        }

        emit("refresh-with-events", displayEvents)
        ElMessage.success(`✅ 成功同步 ${syncRes?.events_added ?? pendingEvents.value.length} 筆行程！`);
        previewVisible.value = false;
        tempGoogleToken.value = null;
    } catch (error) {
        const msg = error.response?.data?.detail || error.message || '同步過程中發生未知錯誤';
        ElMessage.error('同步失敗：' + msg);
    } finally {
        loading.close();
    }
};

// 新增「同步 Google 行事曆」按鈕
const syncFromGoogle = async () => {
    if (!calendarStore.googleToken) {
        ElMessage.warning('請先點擊「授權 Google 日曆」取得授權喵！')
        return
    }
    const loading = ElLoading.service({ lock: true, text: '正在從 Google 日曆同步行程...' })
    try {
        const now = new Date()
        const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()
        const res = await integrationApi.getEvents(calendarStore.googleToken, timeMin, timeMax)
        const events = Array.isArray(res) ? res : (res.data ?? [])

        if (events.length === 0) {
            ElMessage.info('Google 日曆這個月沒有行程喔！')
            loading.close()
            return
        }

        emit('refresh-with-events', events)
        ElMessage.success(`✅ 已同步 ${events.length} 筆行程！`)
    } catch (e) {
        // token 過期就清掉，強迫重新授權
        if (e.response?.status === 401) {
            calendarStore.clearGoogleToken()
            ElMessage.error('授權已過期，請重新點擊「授權 Google 日曆」喵！')
        } else {
            ElMessage.error('同步失敗，請確認授權是否有效')
        }
    } finally {
        loading.close()
    }
}



function moveToday() {
    calendar.value.move(props.today);
    emit("move-today");
}

const handlePageChange = (pages) => {
    if (pages && pages.length > 0) {
        const { month: newMonth, year: newYear } = pages[0];
        emit('update-date', { year: newYear, month: newMonth });
    }
}

const triggerUpload = () => { scheduleInput.value.click(); };
defineExpose({ triggerUpload });
</script>

<template>
    <div class="calendar-section">
        <Calendar ref="calendar" expanded borderless :masks="{ title: 'YYYY年 MMM', dayPopover: 'YYYY年 MMM DD日, WWW' }"
            :attributes="props.attributes" locale="zh-TW" @dayclick="day => emit('select-date', day)"
            @did-move="handlePageChange">
            <template #footer>
                <div style="display:flex; justify-content:center; flex-wrap:wrap; align-items:center;">
                    <button class="btn-icon" @click="moveToday" style="margin:10px;">今天</button>
                    <RouterLink style="margin:10px;" class="btn-icon btn-outline-primary"
                        :to="{ path: '/Add', state: { date: props.selectedDate } }">新增支出</RouterLink>
                    <RouterLink style="margin:10px;" class="btn-icon btn-outline-primary"
                        :to="{ path: '/AddIncome', state: { date: props.selectedDate } }">新增收入</RouterLink>
                    <RouterLink style="margin:10px;" class="btn-icon btn-outline-primary"
                        :to="{ path: '/AddTrans', state: { date: props.selectedDate } }">新增轉帳</RouterLink>

                    <!-- 狀態一：沒有任何 token → 只顯示授權 -->
                    <button v-if="!tempGoogleToken && !calendarStore.googleToken"
                        style="margin:10px; background-color:#f59e0b; color:white; border:none; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600;"
                        @click="requestTokenOnly">
                        🔐 授權 Google 日曆
                    </button>

                    <!-- 狀態二：剛授權完（有臨時 token）→ 顯示兩個選項 -->
                    <template v-if="tempGoogleToken">
                        <span style="margin:10px 4px; font-size:0.8rem; color:#64748b;">授權完成，選擇：</span>
                        <button
                            style="margin:10px 6px; background-color:#10b981; color:white; border:none; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600;"
                            @click="scheduleInput.click()">
                            📸 匯入課表圖片
                        </button>
                        <button
                            style="margin:10px 6px; background-color:#6366f1; color:white; border:none; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600;"
                            @click="syncFromGoogle">
                            🔄 同步 Google 行事曆
                        </button>
                    </template>

                    <!-- 狀態三：有 session token 但沒有臨時 token（刷新後）→ 顯示授權 + 同步 -->
                    <template v-if="!tempGoogleToken && calendarStore.googleToken">
                        <button
                            style="margin:10px 6px; background-color:#f59e0b; color:white; border:none; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600;"
                            @click="requestTokenOnly">
                            🔐 授權 Google 日曆
                        </button>
                        <button
                            style="margin:10px 6px; background-color:#6366f1; color:white; border:none; border-radius:8px; padding:8px 14px; cursor:pointer; font-weight:600;"
                            @click="syncFromGoogle">
                            🔄 同步 Google 行事曆
                        </button>
                    </template>

                    <input type="file" ref="scheduleInput" accept="image/*" style="display:none;"
                        @change="handleScheduleUpload" />
                </div>
            </template>
        </Calendar>
    </div>

    <!-- ════ 預覽 Modal ════ -->
    <div v-if="previewVisible" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h3>🗓️ 檢查 AI 辨識結果</h3>
                <span class="event-count">共 {{ pendingEvents.length }} 筆</span>
            </div>

            <!-- ── 批量時間設定區 ── -->
            <div class="batch-section">
                <div class="batch-title">⚙️ 批量時間設定</div>

                <div class="batch-row">
                    <!-- 上午設定 -->
                    <div class="batch-group">
                        <label class="batch-label">☀️ 上午時段</label>
                        <div class="batch-inputs">
                            <input v-model="batchSettings.morning.start" type="time" class="batch-time-input" />
                            <span>～</span>
                            <input v-model="batchSettings.morning.end" type="time" class="batch-time-input" />
                            <button class="btn-apply morning" @click="applyMorningOnly">套上午</button>
                        </div>
                    </div>

                    <!-- 下午設定 -->
                    <div class="batch-group">
                        <label class="batch-label">🌙 下午時段</label>
                        <div class="batch-inputs">
                            <input v-model="batchSettings.afternoon.start" type="time" class="batch-time-input" />
                            <span>～</span>
                            <input v-model="batchSettings.afternoon.end" type="time" class="batch-time-input" />
                            <button class="btn-apply afternoon" @click="applyAfternoonOnly">套下午</button>
                        </div>
                    </div>
                </div>

                <button class="btn-apply-all" @click="applySmartBatch">
                    ✨ 一鍵智慧套用（上午/下午各自保留）
                </button>
                <p class="batch-hint">💡 以 12:00 為分界自動判斷，上午行程套上午設定、下午行程套下午設定</p>
            </div>

            <!-- ── 行程列表 ── -->
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style="width:70px">日期</th>
                            <th>行程名稱</th>
                            <th style="width:85px">開始</th>
                            <th style="width:85px">結束</th>
                            <th style="width:44px">刪</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(event, index) in pendingEvents" :key="index"
                            :class="parseInt(event.start.dateTime.substring(11, 13)) < 12 ? 'row-morning' : 'row-afternoon'">
                            <td class="date-cell">{{ event.start.dateTime.substring(5, 10) }}</td>
                            <td>
                                <input v-model="event.summary" class="name-input" placeholder="行程名稱" />
                            </td>
                            <td>
                                <input type="time" class="time-input" :value="getEventStartTime(event)"
                                    @change="e => updateStartTime(event, e.target.value)" />
                            </td>
                            <td>
                                <input type="time" class="time-input" :value="getEventEndTime(event)"
                                    @change="e => updateEndTime(event, e.target.value)" />
                            </td>
                            <td>
                                <button class="btn-remove" @click="removeEvent(index)">✕</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- ── 底部操作 ── -->
            <div class="modal-footer">
                <button class="btn-add-row" @click="addNewRow">➕ 新增一筆</button>
                <div class="footer-right">
                    <button class="btn-cancel" @click="previewVisible = false">取消</button>
                    <button class="btn-confirm" @click="handleFinalSync" :disabled="pendingEvents.length === 0">
                        🚀 確認同步到 Google
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* ── 日曆 ── */
.calendar-section {
    background: var(--bg-sidebar);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.btn-icon {
    background: var(--color-primary);
    color: white;
    padding: 10px 20px;
    border: 0;
    margin: 1px;
    border-radius: 10px;
    font-weight: 600;
    text-decoration: none;
}

:deep(.vc-day) {
    min-height: 50px;
}

:deep(.vc-title) {
    background: none;
}

:deep(.vc-header .vc-title) {
    color: var(--text-primary);
}

:deep(.vc-arrow) {
    background: none;
}

:deep(.vc-pane-container) {
    background: var(--bg-sidebar);
    color: var(--text-inverse);
}

:deep(.vc-day-content.vc-focusable.vc-focus.vc-attr) {
    color: var(--text-primary);
}

/* ── Modal 外框 ── */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.modal-card {
    background: white;
    border-radius: 16px;
    width: 92%;
    max-width: 680px;
    max-height: 88vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    color: #1e293b;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* ── Modal Header ── */
.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 12px;
    border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
}

.event-count {
    background: #dbeafe;
    color: #1d4ed8;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
}

/* ── 批量設定區 ── */
.batch-section {
    padding: 14px 20px;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.batch-title {
    font-size: 0.85rem;
    font-weight: 700;
    color: #475569;
    margin-bottom: 10px;
}

.batch-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

.batch-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    flex: 1;
    min-width: 240px;
}

.batch-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
}

.batch-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
}

.batch-time-input {
    padding: 5px 8px;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.85rem;
    width: 88px;
    background: white;
}

.batch-time-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.btn-apply {
    padding: 5px 12px;
    border: none;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
}

.btn-apply.morning {
    background: #fef9c3;
    color: #854d0e;
}

.btn-apply.afternoon {
    background: #e0f2fe;
    color: #075985;
}

.btn-apply-all {
    width: 100%;
    padding: 8px;
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
}

.btn-apply-all:hover {
    opacity: 0.9;
}

.batch-hint {
    margin: 6px 0 0;
    font-size: 0.75rem;
    color: #94a3b8;
}

/* ── 表格 ── */
.table-container {
    padding: 0 4px;
    overflow-x: auto;
    flex: 1;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

th {
    padding: 8px 6px;
    background: #f1f5f9;
    color: #64748b;
    font-weight: 600;
    text-align: left;
    font-size: 0.78rem;
    position: sticky;
    top: 0;
    z-index: 1;
}

td {
    padding: 5px 6px;
    border-bottom: 1px solid #f1f5f9;
}

/* 上午/下午行顏色 */
.row-morning {
    background: #fffbeb;
}

.row-afternoon {
    background: #f0f9ff;
}

.date-cell {
    font-size: 0.8rem;
    color: #64748b;
    white-space: nowrap;
}

.name-input {
    width: 100%;
    padding: 5px 8px;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    box-sizing: border-box;
}

.name-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.time-input {
    width: 100%;
    padding: 5px 4px;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.8rem;
    background: white;
    box-sizing: border-box;
    cursor: pointer;
}

.time-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.btn-remove {
    background: none;
    border: 1px solid #fca5a5;
    color: #ef4444;
    padding: 4px 8px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: background 0.15s;
}

.btn-remove:hover {
    background: #fef2f2;
}

/* ── Footer ── */
.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    border-top: 1px solid #e2e8f0;
    gap: 10px;
}

.footer-right {
    display: flex;
    gap: 10px;
}

.btn-add-row {
    background: #f1f5f9;
    border: 1px dashed #94a3b8;
    color: #475569;
    padding: 7px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
}

.btn-add-row:hover {
    background: #e2e8f0;
}

.btn-cancel {
    background: white;
    border: 1px solid #e2e8f0;
    color: #64748b;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
}

.btn-confirm {
    background: #10b981;
    border: none;
    color: white;
    padding: 8px 18px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.9rem;
    transition: opacity 0.2s;
}

.btn-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-confirm:not(:disabled):hover {
    opacity: 0.9;
}
</style>