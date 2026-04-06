<script setup>
import { Calendar } from "v-calendar";
import { ref, reactive } from "vue";
import { integrationApi } from '@/api/integrations';
import { ElMessage, ElLoading } from 'element-plus';

// 接收父層傳入的 props
const props = defineProps({
    attributes: Array,
    today: String,
    selectedDate: String,
});

// 向父層回傳事件
const emit = defineEmits(["select-date", "move-today", "update-date","refresh-with-events"]);

const calendar = ref(null);
const scheduleInput = ref(null);

// 🌟 重要修正：使用 ref 讓按鈕切換具有響應式
const tempGoogleToken = ref(null);

// 🌟 預覽視窗控制
const previewVisible = ref(false);
const pendingEvents = ref([]);
const currentGoogleToken = ref('');

const selectedEventIndices = ref([]); // 用來存選中的項目
const timeSettings = reactive({
    morning: { start: '09:00', end: '12:00' },
    afternoon: { start: '13:00', end: '17:00' }
});
// 一鍵套用時間的函式
const applyTimeToSelected = (type) => {
    const setting = type === 'morning' ? timeSettings.morning : timeSettings.afternoon;
    
    pendingEvents.value.forEach((event, index) => {
        // 如果你有做勾選功能就判斷選中，沒有就全部套用（或根據 AI 抓的 period）
        const datePart = event.start.dateTime.substring(0, 10); // 取得 2026-03-30 部分
        
        // 🌟 核心：重新拼湊人類看得懂的時間，並轉回 ISO 格式
        event.start.dateTime = `${datePart}T${setting.start}:00+08:00`;
        event.end.dateTime = `${datePart}T${setting.end}:00+08:00`;
    });
    
    ElMessage.success(`已將選中行程統一設定為${type === 'morning' ? '上午' : '下午'}時段喵！`);
};


/**
 * 🌟 第一步：單純索取 Google 授權 Token
 * 這樣可以避開瀏覽器對於「非直接點擊」觸發彈窗的攔截
 */
const requestTokenOnly = async () => {
    try {
        const token = await requestGoogleCalendarToken();
        if (token) {
            // 使用 .value 賦值，Vue 才會偵測到變化並切換按鈕
            tempGoogleToken.value = token;
            ElMessage.success('Google 授權成功！請點擊第二步選擇圖片喵～');
        }
    } catch (error) {
        console.error("授權失敗", error);
        ElMessage.error('授權失敗，請檢查瀏覽器是否攔截彈窗喵。');
    }
};

/**
 * 🌟 第二步：使用者選完檔案後觸發
 * 此時 tempGoogleToken 已經有值了，可以直接送往後端
 */
const handleScheduleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !tempGoogleToken.value) return;

    // 呼叫後端處理 API
    await processAndSyncSchedule(file, tempGoogleToken.value);
    
    // 清除狀態，方便下次操作
    event.target.value = '';
    tempGoogleToken.value = null; 
};



/**
 * 向 Google 討要行事曆權限的 Access Token
 */
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
            error_callback: (error) => {
                reject(error);
            }
        });
        
        // 強制彈出同意畫面，確保使用者有機會勾選「寫入」權限
        client.requestAccessToken({ prompt: 'consent' });
    });
};

const fetchEvents = async (token) => {
    // 簡單抓取前後一個月的行程
    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const res = await integrationApi.getEvents(token, timeMin, timeMax);
    return res.data;
};



const processAndSyncSchedule = async (file, accessToken) => {
    const loading = ElLoading.service({ 
        lock: true, 
        text: 'AI 喵喵正在努力解析課表（大約需要 30-120 秒）...', 
    });

    try {
        const formData = new FormData();
        formData.append('file', file);

        // ① STEP 1: AI 解析
        const res = await integrationApi.analyze(formData);
        console.log("🔥 AI 原始回傳:", res);
        const analyzeRes = res?.data ?? res;
        if (!analyzeRes?.success) {
            throw new Error('AI 解析失敗或格式不正確喵');
        }

        // 🌟 修正：從 analyzeRes 裡抓出 events
        const eventsFromAI = analyzeRes?.events ?? [];
        console.log("🔥 檢查 events 是否拿到了:", eventsFromAI);

        if (eventsFromAI.length === 0) {
            ElMessage.warning('AI 沒辨識出任何內容，請手動新增喵！');
        }

        const normalizeDateTime = (dt) => {
            return dt.includes('+08:00') ? dt : dt + '+08:00';
        };


        // 🌟 關鍵修正：將資料存入預覽變數並打開視窗，然後直接 RETURN！
        pendingEvents.value = eventsFromAI.map(e => ({
            ...e,
            start: { dateTime: normalizeDateTime(e.start.dateTime) },
            end: { dateTime: normalizeDateTime(e.end.dateTime) }
        })); 
        currentGoogleToken.value = accessToken;
        previewVisible.value = true; 

        ElMessage.success(`解析完成！共 ${eventsFromAI.length} 筆行程，請校對時間喵～`);

        // ⛔ 注意：這裡必須停止，不要往下跑同步，同步交給 handleFinalSync 處理
        return;

    } catch (error) {
        console.error("同步流程錯誤：", error);
        // 🌟 針對 Timeout 的友善提示
        const msg = error.message.includes('timeout') ? 'AI 思考太久了，請再試一次或換一張小一點的圖喵' : error.message;
        ElMessage.error('失敗：' + msg);
    } finally {
        loading.close();
    }
};


// 🌟 預覽視窗用的：刪除單筆、新增空白行
const removeEvent = (index) => pendingEvents.value.splice(index, 1);
const addNewRow = () => {
    pendingEvents.value.push({
        summary: '新課程',
        start: { dateTime: props.selectedDate + 'T09:00:00+08:00' },
        end: { dateTime: props.selectedDate + 'T10:00:00+08:00' }
    });
};


/**
 * 🌟 新增：預覽視窗按「確認同步」後執行的最終動作
 */
const handleFinalSync = async () => {
    const loading = ElLoading.service({ lock: true, text: '正在同步至 Google 日曆...' });
    try {
        const syncPayload = {
            events: pendingEvents.value, 
            google_token: currentGoogleToken.value
        };

        // 1. 執行同步
        const syncResRaw = await integrationApi.sync(syncPayload);
        
        // 🌟 修正點 1：對齊 syncRes 的層級
        const syncRes = (syncResRaw && syncResRaw.events_added !== undefined) ? syncResRaw : syncResRaw.data;

        // 2. 同步完後立即抓取最新列表回顯
        const displayEvents = pendingEvents.value.map(e => ({
            ...e,
            add_date: e.start.dateTime.substring(0, 10)
        }));
        
        console.log("🔥 同步成功，準備發回給父組件的行程：", displayEvents);

        // 3. 發送事件給父組件 Book.vue
        emit("refresh-with-events", displayEvents); 

        ElMessage.success(`✅ 成功同步 ${syncRes?.events_added ?? pendingEvents.value.length} 筆行程！`);
        
        // 4. 關閉視窗與清理
        previewVisible.value = false;
        tempGoogleToken.value = null; 

    } catch (error) {
        console.error("同步失敗報錯：", error);
        // 🌟 強健報錯解析
        const msg = error.response?.data?.detail || error.message || '同步過程中發生未知錯誤';
        ElMessage.error('同步失敗：' + msg);
    } finally {
        loading.close();
    }
};


// 點擊今天按鈕
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

const devCleanup = async () => {
    if (!tempGoogleToken.value) return;
    try {
        const res = await integrationApi.cleanupTestEvents(tempGoogleToken.value);
        ElMessage.success(res.data.message || '清理成功喵！');
    } catch (error) {
        ElMessage.error('清理失敗：' + error.message);
    }
};
const triggerUpload = () => {
    scheduleInput.value.click();
};

// 暴露給父組件使用
defineExpose({ triggerUpload });

</script>

<template>
    <div class="calendar-section">
        <Calendar ref="calendar" expanded borderless :masks="{ title: 'YYYY年 MMM', dayPopover: 'YYYY年 MMM DD日, WWW' }"
            :attributes="props.attributes" locale="zh-TW" @dayclick="day => emit('select-date', day)"
            @did-move="handlePageChange">
            <template #footer>
                <div style="display: flex; justify-content: center; flex-wrap: wrap;">
                    <button class="btn-icon" @click="moveToday" style="margin: 10px;">今天</button>
                    <RouterLink style="margin: 10px;" class="btn-icon btn-outline-primary"
                        :to="{ path: '/Add', state: { date: props.selectedDate } }">新增支出</RouterLink>
                    <RouterLink style="margin: 10px;" class="btn-icon btn-outline-primary"
                        :to="{ path: '/AddIncome', state: { date: props.selectedDate } }">新增收入</RouterLink>
                    <RouterLink style="margin: 10px;" class="btn-icon btn-outline-primary"
                        :to="{ path: '/AddTrans', state: { date: props.selectedDate } }">新增轉帳</RouterLink>

                    <button v-if="!tempGoogleToken"
                        style="margin: 10px; background-color: #f59e0b; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-weight: 600;"
                        @click="requestTokenOnly">
                        🔐 第一步：授權 Google 日曆
                    </button>

                    <button v-else
                        style="margin: 10px; background-color: #10b981; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer; font-weight: 600;"
                        @click="scheduleInput.click()">
                        📸 第二步：選擇課表圖片匯入
                    </button>

                    <input type="file" ref="scheduleInput" accept="image/*" style="display: none;" @change="handleScheduleUpload" />
                </div>
                </template>
        </Calendar>
    </div>

<div v-if="previewVisible" class="custom-modal-overlay">
    <div class="custom-modal-card">
        <h3>🗓️ 檢查 AI 辨識結果</h3>
        <p>AI 幫你抓到了 {{ pendingEvents.length }} 筆行程。你可以一鍵統一時段：</p>
        
        <div class="batch-actions">
            <span>批量設定：</span>
            <button @click="applyTimeToSelected('morning')" class="btn-time">☀️ 統一上午 ({{timeSettings.morning.start}}~{{timeSettings.morning.end}})</button>
            <button @click="applyTimeToSelected('afternoon')" class="btn-time">🌙 統一下午 ({{timeSettings.afternoon.start}}~{{timeSettings.afternoon.end}})</button>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th width="80">日期</th>
                        <th>行程名稱</th>
                        <th width="120">目前時間</th> 
                        <th width="60">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(event, index) in pendingEvents" :key="index">
                        <td style="font-size: 0.9em; color: #666;">
                            {{ event.start.dateTime.substring(5, 10) }}
                        </td>
                        <td>
                            <input v-model="event.summary" class="modal-input" placeholder="行程名稱" />
                        </td>
                        <td>
                            <div class="time-display" :title="event.start.dateTime">
                                {{ event.start.dateTime.substring(11, 16) }} ~ {{ event.end.dateTime.substring(11, 16) }}
                            </div>
                        </td>
                        <td>
                            <button @click="removeEvent(index)" class="btn-delete">❌</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="modal-footer">
            <button @click="addNewRow" class="btn-secondary">➕ 手動加一筆</button>
            <div class="right-btns">
                <button @click="previewVisible = false" class="btn-cancel">取消</button>
                <button @click="handleFinalSync" class="btn-primary" :disabled="pendingEvents.length === 0">🚀 確認同步到 Google</button>
            </div>
        </div>
    </div>
</div>


</template>

<style scoped>

/* 🌟 強制彈窗浮動在最上層，不影響原本排版 */
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* 確保在最前面 */
}

.custom-modal-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    color: #333;
}

.table-container {
    margin: 15px 0;
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
}

th, td {
    padding: 8px;
    border-bottom: 1px solid #ddd;
    text-align: left;
}

.modal-input {
    width: 100%;
    padding: 6px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
}

.btn-primary { background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-secondary { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
.btn-cancel { background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-right: 8px; }
.btn-delete { background: none; color: #ef4444; border: 1px solid #ef4444; padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.batch-actions {
    background: #f8fafc;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-time {
    background: white;
    border: 1px solid #d1d5db;
    padding: 4px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
}

.btn-time:hover { background: #eff6ff; border-color: #3b82f6; }

.time-display {
    font-family: monospace;
    background: #e0f2fe;
    color: #0369a1;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    text-align: center;
}




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
    border: 0px;
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

:deep(.vc-day-content.vc-focusable.vc-focus.vc-attr.vc-highlight-content-outline.vc-orange) {
    color: var(--text-primary);
    background-color: var(--bg-card);
    border: 2px solid
}
</style>