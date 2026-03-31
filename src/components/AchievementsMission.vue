<script setup>
import { ref, onMounted } from 'vue'
import { getDailyMissions, claimMissionReward } from '@/api/gamification'
import api from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
// 引入獨立的計時組件
import MissionTimer from './MissionTimer.vue'

const dailyMissions = ref([])
const loading = ref(true)

// Icon 映射邏輯
const getMissionIcon = (m) => {
    if (m.has_card_reward) return '🎯'
    const cat = m.category?.trim()
    const categoryMap = {
        'SJ': '🧱', 'NT': '🧪', 'NF': '✨', 'SP': '⚡',
        '記帳': '📝', '系統': '⚙️', '轉帳': '💸',
        '報表': '📊', '預算': '💰', '挑戰': '🔥',
        'SJ_任務': '🧱', 'NT_任務': '🧪', 'NF_任務': '✨', 'SP_任務': '⚡'
    }
    return categoryMap[cat] || '🎯'
}

// 獲取任務列表
const fetchMissions = async () => {
    try {
        loading.value = true
        dailyMissions.value = []
        const res = await getDailyMissions()
        // 確保資料依據 slot_num 排序，位置才會固定
        const data = Array.isArray(res) ? res : []
        dailyMissions.value = data.sort((a, b) => a.slot_num - b.slot_num)
    } catch (error) {
        console.error("抓取任務失敗", error)
    } finally {
        loading.value = false
    }
}

// 接取任務
const handleAccept = async (m) => {
    try {
        await api.post(`/game/missions/${m.miss_id}/accept`)
        ElMessage.success('已接取任務，開始修煉吧！')
        fetchMissions()
    } catch (error) {
        ElMessage.error('接取失敗')
    }
}

// 放棄任務
const handleAbandon = async (m) => {
    try {
        await ElMessageBox.confirm('確定要放棄此修煉嗎？放棄後任務將重新回到隨機池。', '提示', {
            confirmButtonText: '確定放棄',
            cancelButtonText: '取消',
            type: 'warning'
        })
        await api.post(`/game/missions/${m.miss_id}/abandon`)
        ElMessage.info('已放棄任務')
        fetchMissions()
    } catch (e) {
        // 使用者取消操作
    }
}

const emit = defineEmits(['reward-claimed'])

// 領取獎勵
const handleClaim = async (m) => {
    if (m.isClaiming) return; // 🌟 防止重複點擊
    
    try {
        m.isClaiming = true; // 開始領取，鎖定狀態
        await claimMissionReward(m.miss_id);
        ElMessage.success('領取獎勵成功！');
        
        // 成功後才執行這個，這會觸發父組件 handleGlobalSync
        emit('reward-claimed'); 
        
        await fetchMissions(); // 重新整理列表
    } catch (error) {
        console.error("領取失敗", error);
        // 如果失敗了，可以把按鈕還給用戶
        m.isClaiming = false;
    }
};

// 🌟 必須加上這行，父組件才呼叫得到！
defineExpose({ fetchMissions });

onMounted(() => {
    fetchMissions()
})
</script>

<template>
    <section class="mission-container">
        <div class="card-header">
            <h2>⚡ 隨機任務</h2>
            <MissionTimer class="countdown" @refresh="fetchMissions" />
        </div>
        
        <div v-if="loading" class="placeholder-box">任務載入中...</div>

        <div v-else class="mission-stack">
            <div v-for="m in dailyMissions" :key="m.miss_id || m.slot_num" 
                class="m-card-elite" :class="[m.difficulty.toLowerCase(), { 'completed': m.miss_status === 2 }]">
                
                <template v-if="m.miss_status !== 2">
                    <div class="m-visual">{{ getMissionIcon(m) }}</div>
                    <div class="m-content">
                        <div class="m-header-row">
                            <h3>{{ m.title }}</h3>
                            <span class="m-rarity-badge">{{ m.difficulty }}</span>
                        </div>
                        <p>{{ m.description }}</p>
                        <div class="m-reward-row">
                            <span class="xp-tag">+{{ m.xp_reward }} XP</span>
                            <span v-if="m.has_card_reward" class="card-tag">🎁 隱藏卡牌獎勵</span>
                        </div>
                        <div class="m-progress-section">
                            <div class="m-bar-bg">
                                <div class="m-bar-fill" :style="{ width: (m.target_val > 0 ? (m.current_val/m.target_val*100) : 0) + '%' }"></div>
                            </div>
                            <span class="m-count-label">任務進度：<strong>{{ m.current_val }}</strong> / {{ m.target_val }}</span>
                        </div>
                    </div>

                    <div class="m-action-zone">
                        <button v-if="m.miss_status === 0" class="btn-action start" @click="handleAccept(m)">接取任務</button>
                        
                        <div v-else-if="m.miss_status === 1 && m.current_val < m.target_val" class="status-running-group">
                            <div class="status-running"><span class="dot-blink"></span> 任務中...</div>
                            <button class="btn-abandon" @click="handleAbandon(m)">放棄任務</button>
                        </div>
                        
                        <button v-else-if="m.miss_status === 1 && m.current_val >= m.target_val" class="btn-action claim" @click="handleClaim(m)">領取獎勵</button>
                    </div>
                </template>

                <div v-else class="mission-done-placeholder">
                    <div class="done-check">✅</div>
                    <div class="done-info">
                        <h4>此任務已達成</h4>
                        <p>獎勵已發放。新任務請等待倒數刷新。</p>
                    </div>
                </div>
            </div>

            <div v-if="dailyMissions.length === 0" class="all-missions-complete">
                <h3>✨ 登峰造極 ✨</h3>
                <p>所有任務已完成！新挑戰將在午夜重新發布。</p>
            </div>
        </div>
    </section>
</template>

<style scoped>
@import '../assets/css/achievements.css';

/* 1. 卡片基礎佈局修正 */
.m-header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.m-rarity-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #64748b; font-weight: 800; text-transform: uppercase; }

/* 2. 難度顏色邊框 */
.m-card-elite.rare { border-left: 5px solid #3b82f6; }
.m-card-elite.epic { border-left: 5px solid #a855f7; }
.m-card-elite.legendary { border-left: 5px solid #f59e0b; }

/* 3. 已完成卡片預留位置的樣式 (對齊你的截圖需求) */
.mission-done-placeholder {
    width: 100%;
    height: 100px; /* 固定高度保持排版穩定 */
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    color: #94a3b8;
}
.done-check { font-size: 2.5rem; }
.done-info h4 { margin: 0; color: #64748b; font-size: 1.1rem; }
.done-info p { margin: 4px 0 0 0; font-size: 0.85rem; }
.m-card-elite.completed {
    background: #f8fafc;
    border: 2px dashed #e2e8f0;
    box-shadow: none;
    opacity: 0.8;
}

/* 4. 放棄任務按鈕美化 (針對你的需求調整) */
.status-running-group {
    display: flex;
    flex-direction: column;
    align-items: center; /* 改為置中 */
    justify-content: center;
    gap: 12px; /* 增加間距 */
}
.btn-abandon {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    color: #94a3b8;
    font-size: 0.9rem; /* 字大一點 */
    font-weight: 600;
    padding: 6px 16px; /* 增加點擊區域 */
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
    width: 100px; /* 固定寬度便於置中對齊 */
    text-align: center;
}
.btn-abandon:hover {
    color: #f43f5e;
    border-color: #fca5a5;
    background: #fff1f2;
}

/* 5. 進行中動畫 */
.status-running {
    color: #3b82f6;
    font-weight: 800;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #eff6ff;
    padding: 8px 16px;
    border-radius: 12px;
}
.dot-blink {
    width: 10px;
    height: 10px;
    background: #3b82f6;
    border-radius: 50%;
    animation: blink 1.2s infinite;
    will-change: opacity, transform;
}
@keyframes blink {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
}

/* 6. 其他 UI 細節 */
.m-count-label { display: block; margin-top: 6px; font-size: 0.9rem; color: #64748b; }
.m-count-label strong { color: #1e293b; font-size: 1.1rem; }
.xp-tag { background: #fffbeb; color: #d97706; font-weight: bold; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #fde68a; }
.card-tag { background: #f5f3ff; color: #7c3aed; font-weight: bold; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; border: 1px solid #ddd6fe; }
.btn-action { padding: 0.8rem 1.5rem; border-radius: 1rem; border: none; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 1rem; }
.btn-action.start { background: #1e293b; color: white; }
.btn-action.claim { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }

/* 增加 CSS Layer，減少 Painting 壓力 */
.m-card-elite {
    -webkit-font-smoothing: antialiased; /* 或 subpixel-antialiased */
    transform: translateZ(0);

    /* 👇 新增以下這段來禁止文字被選取 👇 */
        /* 已經在achievements.css的.mms-full-layout寫了 */
}
</style>