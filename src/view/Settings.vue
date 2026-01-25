<script setup>
import { ref } from 'vue'
import Nav from '@/components/Nav.vue';
import SettingAccount from './SettingAccount.vue';
import SettingOutput from './SettingOutput.vue';

// 標籤頁
const activeTab = ref('profile')
const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'preferences', label: '偏好設定', icon: '⚙️' },
    { id: 'security', label: '帳號設置', icon: '🔒' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'output', label: '輸出', icon: '📂' },
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


// 儲存通知設定
const saveNotifications = () => {
    alert('通知設定已儲存！')
}
</script>


<template>
    <Nav>
            <div class="settings-header">
                <h1>設定</h1>
                <p style="text-align: center;">管理您的帳戶和偏好設定</p>
            </div>

            <!-- 標籤頁 -->
<div class="tabs">
            <button v-for="tab in tabs" :key="tab.id" 
                :class="['tab-button', { active: activeTab === tab.id }]"
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
            <!-- 帳號設置 -->
            <SettingAccount v-if="activeTab === 'security'" />


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
            <SettingOutput v-if="activeTab === 'output'" />

            


    </Nav>
</template>


<style scoped>
@import '../assets/css/setting.css';
</style>
