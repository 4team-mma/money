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

// 偏好設定
const preferences = ref({
    language: 'zh-TW',
    currency: 'TWD',
    theme: 'light',
    budgetPeriod: 'monthly',
    budgetAlert: '75',
    weekStart: '0'
})

// 儲存偏好設定
const savePreferences = () => {
    alert('偏好設定已儲存！')
}
</script>


<template>
            <!-- 偏好設定 -->
                <div class="tab-content">
        <div class="settings-section">
    

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

</template>


<style scoped>
@import '../assets/css/setting.css';
</style>
