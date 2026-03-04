<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import api from '@/api'

// 引用所有子元件
import AdminData from './AdminData.vue'
import AdminModel from './AdminModel.vue'
import AdminMain from './AdminMain.vue'
import AdminsComments from './AdminsComments.vue'
import AdminSetting from './AdminSetting.vue'

const router = useRouter()
const userStore = useUserStore()
const categoryStore = useCategoryStore()

// === 1. 頁面切換邏輯 ===
const activeTab = ref('AdminData') // 預設頁面

// === 2. 選單配置 ===
const navigation = [
    { name: '數據分析', id: 'AdminData', icon: '📊' },
    { name: '模型管理', id: 'AdminModel', icon: '🔌' },
    { name: '用戶管理', id: 'AdminMain', icon: '👥' },
    { name: '問題回饋', id: 'AdminsComments', icon: '💬' },
    { name: '系統設定', id: 'AdminSetting', icon: '⚙️' },
]

// === 3. 主題管理 (移動到此處以便全域套用) ===
const currentTheme = ref(localStorage.getItem('adminTheme') || 'mma_light')
const themes = {
    mma_light: { name: 'MMA 經典', primary: '#3b82f6', bgGradient: 'linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%)', cardBg: 'rgba(255, 255, 255, 0.6)', sidebarBg: 'rgba(255, 255, 255, 0.4)', text: '#1e293b', border: 'rgba(255, 255, 255, 0.5)',color: 'black' },
    forest: { name: '森林晨曦', primary: '#10b981', bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', cardBg: 'rgba(255, 255, 255, 0.6)', sidebarBg: 'rgba(255, 255, 255, 0.4)', text: '#064e3b', border: 'rgba(16, 185, 129, 0.2)' ,color: 'black'},
    sunset: { name: '微醺夕陽', primary: '#f59e0b', bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', cardBg: 'rgba(255, 255, 255, 0.6)', sidebarBg: 'rgba(255, 255, 255, 0.4)', text: '#78350f', border: 'rgba(245, 158, 11, 0.2)' ,color: 'black'},
    sakura: { name: '櫻花粉雪', primary: '#ec4899', bgGradient: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', cardBg: 'rgba(255, 255, 255, 0.7)', sidebarBg: 'rgba(255, 255, 255, 0.5)', text: '#831843', border: 'rgba(244, 114, 182, 0.3)' ,color: 'black'},
    dark: { name: '極客深邃', primary: '#60a5fa', bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', cardBg: 'rgba(30, 41, 59, 0.6)', sidebarBg: 'rgba(15, 23, 42, 0.6)', text: '#f1f5f9', border: 'rgba(255, 255, 255, 0.1)', color: 'white'},
    ocean: { name: '深海湛藍', primary: '#0ea5e9', bgGradient: 'linear-gradient(135deg, #082f49 0%, #0f172a 100%)', cardBg: 'rgba(12, 74, 110, 0.6)', sidebarBg: 'rgba(8, 47, 73, 0.6)', text: '#e0f2fe', border: 'rgba(14, 165, 233, 0.2)' ,color: 'white'},
    obsidian: { name: '曜石黑金', primary: '#fbbf24', bgGradient: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', cardBg: 'rgba(24, 24, 27, 0.8)', sidebarBg: 'rgba(9, 9, 11, 0.8)', text: '#fef3c7', border: 'rgba(251, 191, 36, 0.2)' ,color: 'white'}
}

const currentStyle = computed(() => themes[currentTheme.value] || themes.mma_light)

const setTheme = (id) => {
    currentTheme.value = id;
    localStorage.setItem('adminTheme', id);
    document.documentElement.setAttribute('data-theme', id === 'mma_light' ? '' : id);
}

// === 4. 管理員驗證與登出 ===
const currentLoginAdmin = ref(JSON.parse(localStorage.getItem('currentUser') || '{}'))
const handleLogout = () => {
    if (confirm('確定斷開連線並登出系統？')) {
        localStorage.clear();
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/';
    }
}



onMounted(async () => {
    const savedTheme = localStorage.getItem('adminTheme') || 'mma_light';
    setTheme(savedTheme);

    if (!currentLoginAdmin.value || currentLoginAdmin.value.role !== 'admin') {
        router.push('/book');
        return;
    }
    await Promise.all([userStore.loadUsers(), categoryStore.fetchAllRankings()]);
})
</script>

<template>
    <div class="admin-layout" :style="{ background: currentStyle.bgGradient, color: currentStyle.text }">
        <div class="background-effects">
            <div v-for="n in 8" :key="n" class="effect-circle"></div>
        </div>

        <aside class="sidebar-glass" :style="{ backgroundColor: currentStyle.sidebarBg, borderColor: currentStyle.border }">
            <div class="brand-zone">
                <div class="logo-box"><img src="../assets/logo.svg" width="36" height="36"></div>
                <div class="brand-info">
                    <h3>後台管理</h3>
                    <span class="badge" :style="{ background: currentStyle.primary }">ADMIN</span>
                </div>
            </div>

            <nav class="sidebar-nav">
                <div class="nav-section">
                    <button v-for="item in navigation" :key="item.id" 
                        class="nav-item" :class="{ 'nav-item-active': activeTab === item.id }"
                        @click="activeTab = item.id">
                        <span class="nav-icon">{{ item.icon }}</span>
                        <span class="nav-text">{{ item.name }}</span>
                        <!-- <span class="nav-indicator">›</span> -->
                    </button>
                </div>
            </nav>

            <div class="sidebar-bottom">
                <button class="btn-logout" @click="handleLogout">登出系統</button>
            </div>
        </aside>

        <main class="main-content">
            <header class="main-header">
                <div class="breadcrumb">控制中心 / <span :style="{ color: currentStyle.primary }">{{ navigation.find(n => n.id === activeTab)?.name }}</span></div>
                <div class="user-status">登入者：<strong>{{ currentLoginAdmin.username }}</strong></div>
            </header>

            <div class="scroll-view">
                <AdminData v-if="activeTab === 'AdminData'" :currentStyle="currentStyle" />
                <AdminModel v-if="activeTab === 'AdminModel'" :currentStyle="currentStyle" />
                <AdminMain v-if="activeTab === 'AdminMain'" 
                    :currentStyle="currentStyle" 
                    :currentLoginAdmin="currentLoginAdmin"
                    @open-edit="openEditModal" />
                <AdminsComments v-if="activeTab === 'AdminsComments'" />
                <AdminSetting v-if="activeTab === 'AdminSetting'" 
                    :themes="themes" 
                    :currentTheme="currentTheme" 
                    @set-theme="setTheme" />
            </div>
        </main>


    </div>
</template>

<style scoped>
@import "../assets/css/admin.css";
.admin-layout { min-height: 100vh; display: flex; overflow: hidden; }
.main-content { flex: 1; display: flex; flex-direction: column; position: relative; z-index: 1; }
.scroll-view { flex: 1; overflow-y: auto; padding: 20px; }

/* --- 基礎導覽項目樣式 --- */
.nav-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 90%;            /* 寬度稍微縮小，製造左右留空感 */
    margin: 0 auto 8px;    /* 居中對齊 */
    padding: 12px 20px;
    border-radius: 16px;   /* 圓角更明顯一點，才有截圖的膠囊感 */
    border: none;
    background: transparent;
    color: inherit;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 增加平滑過渡 */
    position: relative;
    opacity: 0.7;          /* 未選取時稍微半透明 */
}

/* 懸停效果：稍微亮一點 */
.nav-item:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
}

/* --- 被選取時的特效感 --- */
.nav-item-active {
    opacity: 1 !important;
    /* 這裡的背景色會被模板中的內聯樣式覆蓋，為了保險我們設定一個預設 */
    background: rgba(255, 255, 255, 0.2); 
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 增加微弱陰影 */
}

.nav-icon {
    display: flex;
    align-items: center;
    font-size: 1.4rem;     /* 稍微放大 Emoji */
    transition: transform 0.3s;
}

/* 選取時 Icon 稍微放大或跳動一下 */
.nav-item-active .nav-icon {
    transform: scale(1.1);
}

.nav-text { 
    flex: none; 
    margin-left: 12px; 
    font-size: 1.05rem;
    font-weight: 500;
    transition: color 0.3s;
}

/* 選取時字體加粗 */
.nav-item-active .nav-text {
    font-weight: 700;
}
.nav-indicator { opacity: 0.5; font-size: 1.2rem; }
</style>