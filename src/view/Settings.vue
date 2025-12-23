<script setup>
import { ref } from 'vue'
import Nav from '@/components/Nav.vue';


// 標籤頁
const activeTab = ref('profile')
const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'preferences', label: '偏好設定', icon: '⚙️' },
    { id: 'security', label: '安全性', icon: '🔒' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'output', label: '輸出', icon: '📤' },
]

// 個人資料
const profile = ref({
    name: '王小明',
    email: 'wang@example.com',
    phone: '0912-345-678',
    birthday: '1990-01-15',
    bio: '熱愛理財，追求財務自由的上班族'
})

// 偏好設定
const preferences = ref({
    language: 'zh-TW',
    currency: 'TWD',
    theme: 'light',
    budgetPeriod: 'monthly',
    budgetAlert: '75',
    weekStart: '0'
})

// 安全性
const security = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: false,
    loginHistory: [
        {
            id: 1,
            device: 'Chrome on Windows',
            location: '台北市, 台灣',
            time: '2 小時前',
            status: 'current',
            statusText: '目前裝置'
        },
        {
            id: 2,
            device: 'Safari on iPhone',
            location: '台北市, 台灣',
            time: '昨天 14:30',
            status: 'success',
            statusText: '成功'
        },
        {
            id: 3,
            device: 'Chrome on Android',
            location: '台中市, 台灣',
            time: '3 天前',
            status: 'success',
            statusText: '成功'
        }
    ]
})

// 通知
const notifications = ref({
    email: {
        transactions: true,
        budgetAlerts: true,
        weeklyReport: false,
        achievements: true
    },
    push: {
        enabled: true,
        transactions: true,
        budgetAlerts: true,
        stockAlerts: false
    }
})

// 取得姓名縮寫
const getInitials = (name) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// 儲存個人資料
const saveProfile = () => {
    alert('個人資料已儲存！')
}

// 儲存偏好設定
const savePreferences = () => {
    alert('偏好設定已儲存！')
}

// 變更密碼
const changePassword = () => {
    if (!security.value.currentPassword || !security.value.newPassword || !security.value.confirmPassword) {
        alert('請填寫所有欄位')
        return
    }
    if (security.value.newPassword !== security.value.confirmPassword) {
        alert('新密碼不一致')
        return
    }
    alert('密碼已變更！')
    security.value.currentPassword = ''
    security.value.newPassword = ''
    security.value.confirmPassword = ''
}

// 儲存通知設定
const saveNotifications = () => {
    alert('通知設定已儲存！')
}
</script>


<template>
    <Nav>
     
            <div class="settings-header">
                <h1>設定</h1>
                <p>管理您的帳戶和偏好設定</p>
            </div>

            <!-- 標籤頁 -->
            <div class="tabs">
                <button v-for="tab in tabs" :key="tab.id" :class="['tab-button', { active: activeTab === tab.id }]"
                    @click="activeTab = tab.id">
                    <span class="tab-icon">{{ tab.icon }}</span>
                    {{ tab.label }}
                </button>
            </div>

            <!-- 個人資料 -->
            <div v-if="activeTab === 'profile'" class="tab-content">
                <div class="settings-section">
                    <h2>個人資料</h2>

                    <div class="avatar-section">
                        <div class="avatar">
                            <span class="avatar-text">{{ getInitials(profile.name) }}</span>
                        </div>
                        <div class="avatar-actions">
                            <button class="btn-secondary">上傳照片</button>
                            <button class="btn-text">移除</button>
                        </div>
                    </div>

                    <div class="form-grid">
                        <div class="form-group">
                            <label>暱稱</label>
                            <input type="text" v-model="profile.name" placeholder="輸入姓名">
                        </div>

                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" v-model="profile.email" placeholder="輸入 Email">
                        </div>


                        <div class="form-group">
                            <label>生日</label>
                            <input type="date" v-model="profile.birthday">
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label>關於我</label>
                        <textarea v-model="profile.bio" placeholder="介紹一下自己..." rows="4"></textarea>
                    </div>

                    <div class="form-actions">
                        <button class="btn-secondary">取消</button>
                        <button class="btn-primary" @click="saveProfile">儲存變更</button>
                    </div>
                </div>
            </div>

            <!-- 偏好設定 -->
            <div v-if="activeTab === 'preferences'" class="tab-content">
                <div class="settings-section">
                    <h2>顯示設定</h2>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>貨幣</h3>
                            <p>預設貨幣單位</p>
                        </div>
                        <select v-model="preferences.currency" class="select-input">
                            <option value="TWD">台幣 (TWD)</option>
                            <option value="USD">美元 (USD)</option>
                            <option value="JPY">日圓 (JPY)</option>
                            <option value="CNY">人民幣 (CNY)</option>
                        </select>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>主題</h3>
                            <p>選擇介面主題</p>
                        </div>
                        <select v-model="preferences.theme" class="select-input">
                            <option value="light">淺色</option>
                            <option value="dark">深色</option>
                            <option value="auto">跟隨系統</option>
                        </select>
                    </div>
                </div>

                <div class="settings-section">
                    <h2>預算設定</h2>
                    總預算,分類預算,預算週期

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>預算週期</h3>
                            <p>預算重置週期</p>
                        </div>
                        <select v-model="preferences.budgetPeriod" class="select-input">
                            <option value="monthly">每月</option>
                            <option value="weekly">每週</option>
                            <option value="yearly">每年</option>
                        </select>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>預算提醒</h3>
                            <p>預算達到多少時提醒</p>
                        </div>
                        <select v-model="preferences.budgetAlert" class="select-input">
                            <option value="50">50%</option>
                            <option value="75">75%</option>
                            <option value="90">90%</option>
                            <option value="100">100%</option>
                        </select>
                    </div>

                    <div class="preference-item">
                        <div class="preference-info">
                            <h3>週起始日</h3>
                            <p>每週從哪一天開始</p>
                        </div>
                        <select v-model="preferences.weekStart" class="select-input">
                            <option value="0">星期日</option>
                            <option value="1">星期一</option>
                        </select>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-secondary">重置</button>
                    <button class="btn-primary" @click="savePreferences">儲存設定</button>
                </div>
            </div>

            <!-- 安全性 -->
            <div v-if="activeTab === 'security'" class="tab-content">
                <div class="settings-section">
                    <h2>密碼</h2>

                    <div class="form-group">
                        <label>目前密碼</label>
                        <input type="password" v-model="security.currentPassword" placeholder="輸入目前密碼">
                    </div>

                    <div class="form-group">
                        <label>新密碼</label>
                        <input type="password" v-model="security.newPassword" placeholder="輸入新密碼">
                    </div>

                    <div class="form-group">
                        <label>確認新密碼</label>
                        <input type="password" v-model="security.confirmPassword" placeholder="再次輸入新密碼">
                    </div>

                    <button class="btn-primary" @click="changePassword">變更密碼</button>
                </div>


          

                <div class="settings-section danger-zone">
                    <h2>危險區域</h2>
 

                    <div class="danger-item">
                        <div class="danger-info">
                            <h3>刪除帳戶</h3>
                            <p>永久刪除您的帳戶和所有資料</p>
                        </div>
                        <button class="btn-danger">刪除帳戶</button>
                    </div>
                </div>
            </div>

            <!-- 通知 -->
            <div v-if="activeTab === 'notifications'" class="tab-content">
                <div class="settings-section">
                    <h2>Email 通知</h2>

                    <div class="notification-item">
                        <label class="notification-label">
                            <input type="checkbox" v-model="notifications.email.transactions">
                            <div class="notification-info">
                                <h3>交易通知</h3>
                                <p>每筆交易的 Email 通知</p>
                            </div>
                        </label>
                    </div>

                    <div class="notification-item">
                        <label class="notification-label">
                            <input type="checkbox" v-model="notifications.email.budgetAlerts">
                            <div class="notification-info">
                                <h3>預算提醒</h3>
                                <p>預算達到閾值時發送 Email</p>
                            </div>
                        </label>
                    </div>

                    <div class="notification-item">
                        <label class="notification-label">
                            <input type="checkbox" v-model="notifications.email.weeklyReport">
                            <div class="notification-info">
                                <h3>每週報表</h3>
                                <p>每週財務摘要 Email</p>
                            </div>
                        </label>
                    </div>

                    <div class="notification-item">
                        <label class="notification-label">
                            <input type="checkbox" v-model="notifications.email.achievements">
                            <div class="notification-info">
                                <h3>成就通知</h3>
                                <p>解鎖新成就時通知</p>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="settings-section">
                    <h2>推播通知</h2>

                    <div class="notification-item">
                        <label class="notification-label">
                            <input type="checkbox" v-model="notifications.push.enabled">
                            <div class="notification-info">
                                <h3>啟用推播通知</h3>
                                <p>允許瀏覽器發送推播通知</p>
                            </div>
                        </label>
                    </div>

                    <div v-if="notifications.push.enabled" class="notification-subitems">
                        <div class="notification-item">
                            <label class="notification-label">
                                <input type="checkbox" v-model="notifications.push.transactions">
                                <div class="notification-info">
                                    <h3>交易提醒</h3>
                                </div>
                            </label>
                        </div>

                        <div class="notification-item">
                            <label class="notification-label">
                                <input type="checkbox" v-model="notifications.push.budgetAlerts">
                                <div class="notification-info">
                                    <h3>預算警告</h3>
                                </div>
                            </label>
                        </div>

                        <div class="notification-item">
                            <label class="notification-label">
                                <input type="checkbox" v-model="notifications.push.stockAlerts">
                                <div class="notification-info">
                                    <h3>股票提醒</h3>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button class="btn-secondary">重置</button>
                    <button class="btn-primary" @click="saveNotifications">儲存設定</button>
                </div>
            </div>

            <div v-if="activeTab === 'output'" class="tab-content">
                <div class="settings-section">
                    <h2>資料輸出</h2>
                    <p>您可以將您的財務資料匯出為多種格式，以便備份或在其他應用程式中使用。</p>
                </div>
                <div class="content-grid">
                    <!-- Export Form -->
                    <div class="export-form-card">
                        <div class="card-header">
                            <h2>報表設定</h2>
                            <p>選擇報表類型和格式</p>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>報表類型</label>
                                <select v-model="reportType" class="form-select">
                                    <option value="monthly">月度報表</option>
                                    <option value="yearly">年度報表</option>
                                    <option value="quarterly">季度報表</option>
                                    <option value="custom">自訂範圍</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>時間範圍</label>
                                <select v-model="timeRange" class="form-select">
                                    <option value="current-month">本月</option>
                                    <option value="last-month">上月</option>
                                    <option value="current-year">今年</option>
                                    <option value="last-year">去年</option>
                                    <option value="last-3-months">最近3個月</option>
                                    <option value="last-6-months">最近6個月</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>匯出格式</label>
                                <select v-model="reportFormat" class="form-select">
                                    <option value="pdf">PDF</option>
                                    <option value="excel">Excel (XLSX)</option>
                                    <option value="csv">CSV</option>
                                </select>
                            </div>

                            <button @click="handleExport" class="export-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" class="btn-icon" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                匯出報表
                            </button>
                        </div>
                    </div>

                </div>




            </div>




    </Nav>
</template>


<style scoped>
.settings-container {
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
}

.settings-header {
    margin-bottom: 32px;
}

.settings-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.settings-header p {
    color: #64748b;
    margin: 0;
}

/* 標籤頁 */
.tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 32px;
    border-bottom: 2px solid #e2e8f0;
}

.tab-button {
    padding: 12px 24px;
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    position: relative;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
}

.tab-icon {
    font-size: 18px;
}

.tab-button:hover {
    color: #3b82f6;
}

.tab-button.active {
    color: #3b82f6;
}

.tab-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: #3b82f6;
}

/* 標籤內容 */
.tab-content {
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.settings-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.settings-section h2 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 24px 0;
}

.settings-section h3 {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

/* 頭像 */
.avatar-section {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 32px;
    padding-bottom: 32px;
    border-bottom: 1px solid #e2e8f0;
}

.avatar {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.avatar-text {
    font-size: 36px;
    font-weight: 700;
    color: white;
}

.avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

/* 表單 */
.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group.full-width {
    grid-column: 1 / -1;
}

.form-group label {
    font-size: 14px;
    font-weight: 500;
    color: #475569;
}

.form-group input,
.form-group textarea,
.select-input {
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1e293b;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.select-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.form-group textarea {
    resize: vertical;
    font-family: inherit;
}

/* 偏好設定項目 */
.preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid #f1f5f9;
}

.preference-item:last-child {
    border-bottom: none;
}

.preference-info h3 {
    margin-bottom: 4px;
}

.preference-info p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

/* 安全性切換 */
.security-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
}

.security-info h3 {
    margin-bottom: 4px;
}

.security-info p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

.toggle-switch {
    position: relative;
    width: 52px;
    height: 28px;
    cursor: pointer;
}

.toggle-switch input {
    display: none;
}

.toggle-switch .slider {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #cbd5e1;
    border-radius: 14px;
    transition: background 0.3s;
}

.toggle-switch .slider::before {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    background: white;
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.3s;
}

.toggle-switch input:checked+.slider {
    background: #3b82f6;
}

.toggle-switch input:checked+.slider::before {
    transform: translateX(24px);
}

.security-details {
    margin-top: 16px;
    padding: 16px;
    background: #f0fdf4;
    border-radius: 8px;
}

.security-details p {
    margin: 0 0 12px 0;
    color: #166534;
    font-size: 14px;
}

/* 登入記錄 */
.login-history {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.login-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 8px;
}

.login-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.login-icon svg {
    width: 20px;
    height: 20px;
    color: #3b82f6;
}

.login-info {
    flex: 1;
}

.login-info h4 {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.login-info p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

.login-status {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.login-status.current {
    background: #dcfce7;
    color: #166534;
}

.login-status.success {
    background: #dbeafe;
    color: #1e40af;
}

/* 危險區域 */
.danger-zone {
    border: 2px solid #fecaca;
    background: #fef2f2;
}

.danger-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    border-bottom: 1px solid #fecaca;
}

.danger-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.danger-info h3 {
    margin-bottom: 4px;
}

.danger-info p {
    font-size: 13px;
    color: #991b1b;
    margin: 0;
}

/* 通知項目 */
.notification-item {
    padding: 16px 0;
    border-bottom: 1px solid #f1f5f9;
}

.notification-item:last-child {
    border-bottom: none;
}

.notification-label {
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
}

.notification-label input[type="checkbox"] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    accent-color: #3b82f6;
}

.notification-info h3 {
    margin-bottom: 4px;
}

.notification-info p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
}

.notification-subitems {
    margin-left: 36px;
    margin-top: 12px;
}

/* 按鈕 */
.btn-primary {
    padding: 10px 24px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-secondary {
    padding: 10px 24px;
    background: white;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: #f8fafc;
}

.btn-text {
    padding: 10px 24px;
    background: transparent;
    color: #64748b;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.2s;
}

.btn-text:hover {
    color: #3b82f6;
}

.btn-danger {
    padding: 10px 24px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-danger:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-danger-outline {
    padding: 10px 24px;
    background: white;
    color: #ef4444;
    border: 1px solid #ef4444;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-danger-outline:hover {
    background: #ef4444;
    color: white;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}
</style>
