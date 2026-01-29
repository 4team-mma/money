<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCategoryStore } from '@/stores/categoryStats'
import api from '@/api'
import AdminMain from './AdminMain.vue'

const router = useRouter()
const userStore = useUserStore()
const categoryStore = useCategoryStore()

const activeTab = ref('analytics')
const tabs = [
    { id: 'analytics', label: '數據分析', icon: '📊' },
    { id: 'api', label: '模型管理', icon: '🔌' },
    { id: 'users', label: '用戶管理', icon: '👥' },
    { id: 'feedback', label: '問題回饋', icon: '💬' },
    { id: 'system', label: '系統設定', icon: '⚙️' }
]

/* ========================
   Theme System [cite: 6-9]
   ======================== */
const themes = {
    mma_light: { name: 'MMA 經典', primary: '#3b82f6', bgGradient: 'linear-gradient(135deg, #EBF4FF 0%, #F0F9FF 100%)', cardBg: 'rgba(255, 255, 255, 0.85)', sidebarBg: 'rgba(255, 255, 255, 0.7)', text: '#1e293b', border: 'rgba(255, 255, 255, 0.5)' },
    dark: { name: '極客深邃', primary: '#60a5fa', bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', cardBg: 'rgba(30, 41, 59, 0.8)', sidebarBg: 'rgba(15, 23, 42, 0.7)', text: '#f1f5f9', border: 'rgba(255, 255, 255, 0.1)' },
    forest: { name: '森林晨曦', primary: '#10b981', bgGradient: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)', text: '#064e3b', border: 'rgba(16, 185, 129, 0.2)' },
    sunset: { name: '微醺夕陽', primary: '#f59e0b', bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', cardBg: 'rgba(255, 255, 255, 0.8)', sidebarBg: 'rgba(255, 255, 255, 0.6)', text: '#78350f', border: 'rgba(245, 158, 11, 0.2)' }
}
const currentTheme = ref(localStorage.getItem('adminTheme') || 'mma_light')
const currentStyle = computed(() => themes[currentTheme.value] || themes.mma_light)
const setTheme = (id) => { currentTheme.value = id; localStorage.setItem('adminTheme', id); }

/* ========================
   管理員驗證 [cite: 2, 3, 13, 14]
   ======================== */
const currentLoginAdmin = ref(JSON.parse(localStorage.getItem('currentUser') || '{}'))
const handleLogout = () => { if (confirm('確定斷開連線並登出系統？')) router.push('/') }

/* ========================
   編輯 Modal 邏輯 [cite: 3, 4, 5]
   ======================== */
const isEditModalOpen = ref(false)
const editForm = ref({ uid: '', username: '', name: '', email: '', job: '' })
const openEditModal = (u) => {
    if (u.username !== currentLoginAdmin.value.username) {
        alert('權限限制：您僅能修改自己的個人資訊！')
        return
    }
    editForm.value = { ...u }
    isEditModalOpen.value = true
}
const saveAdmin = async () => {
    try {
        await api.put(`/users/${editForm.value.uid}`, editForm.value)
        await userStore.loadUsers()
        isEditModalOpen.value = false
        alert('職稱與個人資料已更新！')
    } catch (err) { alert('更新失敗') }
}

onMounted(async () => {
    const user = currentLoginAdmin.value
    if (user.role !== 'admin') { router.push('/book'); return; }
    await userStore.loadUsers()
    await categoryStore.fetchAllRankings()
})
</script>

<template>
    <div class="admin-layout" :style="{ background: currentStyle.bgGradient, color: currentStyle.text }">
        <div class="background-effects"><div v-for="n in 8" :key="n" class="effect-circle"></div></div>

        <aside class="sidebar-glass" :style="{ backgroundColor: currentStyle.sidebarBg, borderColor: currentStyle.border }">
            <div class="brand-zone">
                <div class="logo-icon"><span class="icon"><img src="../assets/logo.svg" width="72" height="72"></span></div>
                <div class="brand-info"><h2>MMA</h2><span class="badge" :style="{ background: currentStyle.primary }">ADMIN PANEL</span></div>
            </div>
            <nav class="nav-menu">
                <button v-for="t in tabs" :key="t.id" class="nav-link" :class="{ 'is-active': activeTab === t.id }"
                    :style="activeTab === t.id ? { background: currentStyle.primary + '20', color: currentStyle.primary } : {}"
                    @click="activeTab = t.id"><span class="icon">{{ t.icon }}</span> {{ t.label }}</button>
            </nav>
            <div class="sidebar-bottom"><button class="btn-logout" @click="handleLogout">登出系統</button></div>
        </aside>

        <AdminMain 
            :active-tab="activeTab"
            :tabs="tabs"
            :current-style="currentStyle"
            :current-login-admin="currentLoginAdmin"
            :themes="themes"
            :current-theme="currentTheme"
            @open-edit="openEditModal"
            @set-theme="setTheme"
        />
<!-- 這是修改個人資料彈出的視窗內容: -->
        <Transition name="fade">
            <div v-if="isEditModalOpen" class="modal-overlay" @click.self="isEditModalOpen = false">
                <div class="modal-card">
                    <div class="modal-head"><h3>修改個人資訊</h3><p>UID: A-{{ editForm.uid }}</p></div>
                    <div class="modal-body">
                        <div class="m-field"><label>帳號名稱</label><input v-model="editForm.username" /></div>
                        <div class="m-field"><label>暱稱</label><input v-model="editForm.name" /></div>
                        <div class="m-field"><label>電子郵件</label><input v-model="editForm.email" /></div>
                        <div class="m-field"><label>職位名稱</label><input v-model="editForm.job" /></div>
                    </div>
                    <div class="modal-foot">
                        <button class="btn-cancel" @click="isEditModalOpen = false">取消</button>
                        <button class="btn-save" @click="saveAdmin" :style="{ background: currentStyle.primary }">確認更新</button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
@import "../assets/css/admin.css";
</style>