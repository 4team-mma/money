<script setup>
import { ref } from 'vue'


// 標籤頁
const activeTab = ref('profile')
const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'preferences', label: '偏好設定', icon: '⚙️' },
    { id: 'security', label: '帳號設置', icon: '🔒' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'output', label: '輸出', icon: '📂' },
]


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




// 儲存通知設定
const saveNotifications = () => {
    alert('通知設定已儲存！')
}
</script>


<template>
    


            <!-- 通知 -->
            <div class="tab-content">
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
        

            



</template>


<style scoped>
@import '../assets/css/setting.css';
</style>
