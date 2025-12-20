<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// === 1. 深度連動主題協議 (增加橙/粉，修復空值崩潰) ===
const themes = {
    classic: { name: '經典藍白', primary: '#2563eb', secondary: '#3b82f6', bg: '#f8fafc', sidebar: '#ffffff', card: '#ffffff', text: '#1e293b', border: '#e2e8f0' },
    dark: { name: '深邃星空', primary: '#3b82f6', secondary: '#1d4ed8', bg: '#0b0f1a', sidebar: '#111827', card: '#1f2937', text: '#f1f5f9', border: '#374151' },
    ocean: { name: '深海湛藍', primary: '#0ea5e9', secondary: '#0284c7', bg: '#082f49', sidebar: '#0c4a6e', card: '#115e7a', text: '#f0f9ff', border: '#0e7490' },
    sunset: { name: '夕陽橙金', primary: '#f59e0b', secondary: '#fbbf24', bg: '#fffbeb', sidebar: '#ffffff', card: '#ffffff', text: '#78350f', border: '#fef3c7' },
    rose: { name: '玫瑰嫩粉', primary: '#db2777', secondary: '#f472b6', bg: '#fff1f2', sidebar: '#ffffff', card: '#ffffff', text: '#881337', border: '#ffe4e6' }
}

const currentTheme = ref(localStorage.getItem('adminTheme') || 'classic')

// 核心修正：加入 || themes.classic 防止新電腦空白崩潰
const currentStyle = computed(() => themes[currentTheme.value] || themes.classic)

const setTheme = (id) => {
    currentTheme.value = id
    localStorage.setItem('adminTheme', id)
}

// === 2. 數據管理 (UID 序列化：0000, 0001...) ===
const activeTab = ref('analytics')
const tabs = [
    { id: 'analytics', label: '數據分析', icon: '📊' },
    { id: 'api', label: 'API 串接', icon: '🔌' },
    { id: 'users', label: '用戶管理', icon: '👥' },
    { id: 'system', label: '系統設定', icon: '⚙️' }
]

const users = ref([])
const searchQuery = ref('')
const selectedApi = ref(1)

const loadUsers = () => {
    // 固定核心帳號 UID
    const defaultAccount = [
        { email: 'admin', name: '管理者', role: 'admin', uid: '0000', totalSpent: 0, transactions: 0, statusText: '正常' },
        { email: 'user', name: '測試者', role: 'user', uid: '0001', totalSpent: 45800, transactions: 15, statusText: '正常' }
    ];
    const registeredUser = JSON.parse(localStorage.getItem('mma_users') || '[]');
    // 新帳戶從 0002 開始順排
    users.value = [...defaultAccount, ...registeredUser.map((u, idx) => ({
        ...u,
        uid: String(idx + 2).padStart(4, '0'),
        totalSpent: u.totalSpent || 0,
        transactions: u.transactions || 0,
        statusText: '正常'
    }))];
}

const topUsers = computed(() => {
    return users.value
        .filter(u => u.role !== 'admin')
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .map(u => ({ ...u, avgSpent: u.transactions > 0 ? Math.round(u.totalSpent / u.transactions) : 0 }))
})

const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value
    return users.value.filter(u => u.name?.includes(searchQuery.value) || u.email.includes(searchQuery.value))
})

// === 3. 操作功能 ===
const handleLogout = () => { if (confirm('確定斷開管理者連線？')) router.push('/') }
const formatCurrency = (val) => new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(val)

onMounted(() => loadUsers())
</script>

<template>
  <div class="admin-main-wrapper" :style="{ backgroundColor: currentStyle.bg, color: currentStyle.text }">
    
    <aside class="sidebar" :style="{ backgroundColor: currentStyle.sidebar, borderColor: currentStyle.border }">
        <div class="brand">
            <div class="logo-box" :style="{ background: currentStyle.primary }">M</div>
            <div class="brand-text">
                <h2 :style="{ color: currentStyle.text }">Admin</h2>
                <span :style="{ color: currentStyle.primary }">SYSTEM CONTROL</span>
            </div>
        </div>
        
        <nav class="sidebar-nav">
            <button v-for="t in tabs" :key="t.id" 
                class="nav-item" :class="{ active: activeTab === t.id }"
                :style="activeTab === t.id ? { color: currentStyle.primary, background: currentStyle.primary + '10', borderRight: `4px solid ${currentStyle.primary}` } : { color: currentStyle.text + '80' }"
                @click="activeTab = t.id">
                <span class="icon">{{ t.icon }}</span> {{ t.label }}
            </button>
        </nav>

        <div class="sidebar-footer">
            <button class="logout-btn" @click="handleLogout">安全退出 🚪</button>
        </div>
    </aside>

    <main class="content-area">
        <header class="top-header" :style="{ background: currentStyle.sidebar, borderBottom: `1px solid ${currentStyle.border}` }">
            <div class="path" :style="{ color: currentStyle.text + '80' }">
                控制中心 / <span :style="{ color: currentStyle.primary }">{{ tabs.find(t => t.id === activeTab).label }}</span>
            </div>
            <div class="admin-tag">
                <span class="pulse-dot"></span> 管理員：在線
            </div>
        </header>

        <div class="view-viewport">
            
            <div class="stats-row">
                <div v-for="s in [
                    {l:'總用戶量', v:users.length, i:'👥', c:currentStyle.primary},
                    {l:'全站資產', v:'$12,458,900', i:'💰', c:'#10b981'},
                    {l:'核心延遲', v:'120ms', i:'⚡', c:'#f59e0b'}
                ]" :key="s.l" class="stat-card" :style="{ backgroundColor: currentStyle.card, borderColor: currentStyle.border }">
                    <div class="stat-data">
                        <span class="label" :style="{ color: currentStyle.text + '80' }">{{ s.l }}</span>
                        <div class="value" :style="{ color: currentStyle.text }">{{ s.v }}</div>
                    </div>
                    <div class="icon-box-large" :style="{ background: s.c + '15', color: s.c }">{{ s.i }}</div>
                </div>
            </div>

            <div class="main-panel" :style="{ backgroundColor: currentStyle.card, borderColor: currentStyle.border }">
                
                <div v-if="activeTab === 'analytics'" class="tab-pane">
                    <h3 class="pane-title">消費權重即時排行</h3>
                    <table class="modern-table">
                        <thead>
                            <tr :style="{ color: currentStyle.text + '80', borderBottom: `2px solid ${currentStyle.primary}20` }">
                                <th>排名</th><th>管理權限</th><th>累計流量</th><th>交易次</th><th>均值</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(u, i) in topUsers" :key="u.uid">
                                <td><span class="rank-tag" :style="{ background: currentStyle.primary }">#{{ i+1 }}</span></td>
                                <td class="bold">{{ u.name }}</td>
                                <td class="bold" :style="{ color: currentStyle.primary }">{{ formatCurrency(u.totalSpent) }}</td>
                                <td>{{ u.transactions }}</td>
                                <td style="opacity: 0.6">{{ formatCurrency(u.avgSpent) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="activeTab === 'api'" class="tab-pane">
                    <h3 class="pane-title">核心 API 節點狀態</h3>
                    <div class="api-grid">
                        <div v-for="api in apiServices" :key="api.id" 
                            class="api-card" :class="{ selected: selectedApi === api.id }"
                            :style="{ backgroundColor: currentStyle.bg, borderColor: selectedApi === api.id ? currentStyle.primary : currentStyle.border }"
                            @click="selectedApi = api.id">
                            <div class="api-head">
                                <span class="name">{{ api.name }}</span>
                                <span class="online-tag">ONLINE</span>
                            </div>
                            <p class="desc" :style="{ color: currentStyle.text + '70' }">{{ api.desc }}</p>
                            <div class="api-stats-box">
                                <span>成功率: <b :style="{ color: '#10b981' }">{{ api.successRate }}%</b></span>
                                <span>延遲: <b>{{ api.latency }}ms</b></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'users'" class="tab-pane">
                    <div class="search-row">
                        <input v-model="searchQuery" placeholder="🔍 搜尋用戶名稱或 UID..." class="m-input" :style="{ background: currentStyle.bg, border: `1px solid ${currentStyle.border}`, color: currentStyle.text }">
                    </div>
                    <table class="modern-table">
                        <thead>
                            <tr :style="{ color: currentStyle.text + '80' }">
                                <th>UID</th><th>管理權限</th><th>電子郵件</th><th>權限等級</th><th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in filteredUsers" :key="u.uid">
                                <td class="uid-font" :style="{ color: currentStyle.primary }">{{ u.uid }}</td>
                                <td class="bold">{{ u.name }}</td>
                                <td style="opacity: 0.7">{{ u.email }}</td>
                                <td>
                                    <select v-model="u.role" :disabled="u.email === 'admin'" class="m-select" :style="{ background: currentStyle.bg, color: currentStyle.text, borderColor: currentStyle.border }">
                                        <option value="user">一般使用者</option>
                                        <option value="admin">管理者</option>
                                    </select>
                                </td>
                                <td>
                                    <button v-if="u.email !== 'admin'" class="btn-del" @click="users = users.filter(x => x.uid !== u.uid)">註銷</button>
                                    <span v-else class="locked-text">🔒 核心鎖定</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="activeTab === 'system'" class="tab-pane">
                    <h3 class="pane-title">視覺化主題協議選擇 (全量變色)</h3>
                    <div class="theme-grid">
                        <div v-for="(style, id) in themes" :key="id" 
                            class="theme-card" :class="{ active: currentTheme === id }"
                            :style="{ border: currentTheme === id ? `2px solid ${style.primary}` : `1px solid ${currentStyle.border}`, background: currentTheme === id ? style.bg : '' }"
                            @click="setTheme(id)">
                            <div class="theme-sample" :style="{ background: style.bg }">
                                <div class="sample-side" :style="{ background: style.sidebar }"></div>
                                <div class="sample-accent" :style="{ background: style.primary }"></div>
                            </div>
                            <p class="theme-label" :style="{ color: currentTheme === id ? style.primary : '' }">{{ style.name }}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </main>
  </div>
</template>

<style scoped>
/* 佈局容器：解決所有捲軸與白邊問題 */
.admin-main-wrapper { display: flex; width: 100vw; height: 100vh; overflow: hidden; transition: 0.4s ease-in-out; position: fixed; top: 0; left: 0; }

/* 側邊欄 */
.sidebar { width: 260px; height: 100%; display: flex; flex-direction: column; padding: 32px 0; border-right: 1px solid; flex-shrink: 0; }
.brand { padding: 0 24px; margin-bottom: 48px; display: flex; align-items: center; gap: 14px; }
.logo-box { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.brand-text h2 { font-size: 22px; font-weight: 700; margin: 0; line-height: 1; }
.brand-text span { font-size: 10px; font-weight: 700; letter-spacing: 1px; margin-top: 4px; display: block; }

.nav-item { width: 100%; border: none; background: none; padding: 15px 24px; text-align: left; cursor: pointer; font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 12px; transition: 0.2s; }
.nav-item.active { font-weight: 700; }
.sidebar-footer { padding: 24px; margin-top: auto; }
.logout-btn { width: 100%; padding: 12px; border: 1px solid #fca5a5; color: #ef4444; background: #fff1f2; border-radius: 10px; cursor: pointer; font-weight: 700; }

/* 右側主內容：自適應寬度 */
.content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
.top-header { height: 64px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; flex-shrink: 0; }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; display: inline-block; margin-right: 8px; box-shadow: 0 0 8px #10b981; }

/* 內部滾動視口 */
.view-viewport { padding: 32px 40px; overflow-y: auto; flex: 1; }

/* 統計卡片：Icon 大幅放大 */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 32px; }
.stat-card { border-radius: 20px; padding: 24px; display: flex; justify-content: space-between; align-items: center; border: 1px solid; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
.stat-value { font-size: 28px; font-weight: 800; margin-top: 4px; letter-spacing: -0.5px; }
.stat-label { font-size: 13px; font-weight: 600; }
.icon-box-large { width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; }

/* 功能面板 */
.main-panel { border-radius: 24px; padding: 40px; border: 1px solid; min-height: 500px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
.pane-title { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
.pane-title small { font-weight: 400; opacity: 0.5; font-size: 13px; margin-left: 8px; }

/* 表格細節 */
.modern-table { width: 100%; border-collapse: collapse; }
.modern-table th { text-align: left; padding: 12px 16px; border-bottom: 2px solid rgba(0,0,0,0.05); font-size: 13px; }
.modern-table td { padding: 18px 16px; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; }
.rank-tag { color: white; padding: 2px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; }
.uid-font { font-family: 'Courier New', monospace; font-weight: 700; }
.bold { font-weight: 600; }

/* API 與主題選擇 */
.api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.api-card { padding: 24px; border: 2px solid; border-radius: 20px; cursor: pointer; transition: 0.3s; }
.api-stats-box { display: flex; justify-content: space-between; font-size: 12px; padding: 10px; border-radius: 10px; margin-top: 15px; background: rgba(0,0,0,0.03); }

.theme-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
.theme-card { padding: 14px; border-radius: 20px; cursor: pointer; text-align: center; transition: 0.3s; background: rgba(0,0,0,0.02); }
.theme-sample { height: 70px; border-radius: 12px; position: relative; overflow: hidden; border: 1px solid rgba(0,0,0,0.1); margin-bottom: 10px; }
.sample-side { width: 22px; height: 100%; position: absolute; left: 0; }
.sample-accent { width: 10px; height: 10px; position: absolute; bottom: 8px; right: 8px; border-radius: 50%; }

/* 其他組件 */
.m-input { padding: 12px 18px; border-radius: 12px; border: 1px solid; outline: none; width: 340px; margin-bottom: 24px; font-size: 14px; }
.m-select { padding: 6px 12px; border-radius: 8px; border: 1px solid; cursor: pointer; font-size: 13px; outline: none; }
.btn-del { color: #ef4444; border: 1px solid #ef4444; background: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 13px; }
.locked-text { font-size: 11px; font-weight: 800; opacity: 0.5; }
.online-text { font-weight: 700; color: #10b981; font-size: 13px; }
</style>