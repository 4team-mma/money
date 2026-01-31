<script setup>
import { ref } from 'vue'
import Nav from '@/components/Nav.vue';
import SettingAccount from './SettingAccount.vue';
import SettingOutput from './SettingOutput.vue';
import SettingUserProfile from './SettingUserProfile.vue';
import SettingAlert from './SettingAlert.vue';
import SettingBudgetConfig from './SettingBudgetConfig.vue';

// 標籤頁
const activeTab = ref('profile')
const tabs = [
    { id: 'profile', label: '個人資料', icon: '👤' },
    { id: 'budgetconfig', label: '偏好設定', icon: '⚙️' },
    { id: 'security', label: '帳號設置', icon: '🔒' },
    { id: 'notifications', label: '通知', icon: '🔔' },
    { id: 'output', label: '輸出', icon: '📂' },
]



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
            <SettingUserProfile v-if="activeTab ==='profile'" />
            <!-- 偏好設定 -->
            <SettingBudgetConfig v-if="activeTab === 'budgetconfig'" />
            <!-- 帳號設置 -->
            <SettingAccount v-if="activeTab === 'security'" />
            <!-- 通知 -->
            <SettingAlert v-if="activeTab === 'notifications'" />
            <!-- 輸出 -->
            <SettingOutput v-if="activeTab === 'output'" />

            


    </Nav>
</template>


<style scoped>
@import '../assets/css/setting.css';
</style>
