<script setup>
import { ref, computed } from 'vue'

const achievements = ref([
    { id: 1, title: '初次記帳', icon: '🌟', date: '2024-01-15', pts: 10, unlocked: true },
    { id: 2, title: '儲蓄高手', icon: '💎', req: '還需 $42,500', pts: 50, unlocked: false },
    { id: 3, title: '預算守衛', icon: '🛡️', req: '30天不超支', pts: 100, unlocked: false },
    { id: 4, title: '投資先驅', icon: '📈', req: '首筆投資', pts: 80, unlocked: false },
    { id: 5, title: '資產翻倍', icon: '🚀', req: '淨值+100%', pts: 500, unlocked: false },
    { id: 6, title: '理財達人', icon: '🎓', req: '已達成', pts: 30, unlocked: true },
    { id: 7, title: '省錢戰士', icon: '⚔️', req: '連續7天零消費', pts: 40, unlocked: false },
    { id: 8, title: '記帳狂人', icon: '🔥', req: '累計365筆', pts: 200, unlocked: false },
    { id: 9, title: '第二頁成就', icon: '📦', req: '解鎖更多', pts: 10, unlocked: false },
])

const currentPage = ref(0)
const itemsPerPage = 8
const totalPages = computed(() => Math.ceil(achievements.value.length / itemsPerPage))

const paginatedAchievements = computed(() => {
    const start = currentPage.value * itemsPerPage
    return achievements.value.slice(start, start + itemsPerPage)
})
</script>

<template>
    <section class="reward-wall-full">
        <div class="card-header">
            <div class="header-left">
                <h2>🏆 榮耀成就收集</h2>
                <span class="count-tag">已達成 12 / 48</span>
            </div>
            <div class="pagination-controls" v-if="totalPages > 1">
                <button @click="currentPage--" :disabled="currentPage === 0">◀</button>
                <span>{{ currentPage + 1 }} / {{ totalPages }}</span>
                <button @click="currentPage++" :disabled="currentPage === totalPages - 1">▶</button>
            </div>
        </div>

        <div class="achievement-paged-grid">
            <div v-for="a in paginatedAchievements" :key="a.id" 
                 class="reward-item-card" :class="{ locked: !a.unlocked }">
                <div class="reward-icon-box">{{ a.icon }}</div>
                <div class="reward-info">
                    <h4>{{ a.title }}</h4>
                    <p>{{ a.unlocked ? (a.date || '已解鎖') : a.req }}</p>
                    <span class="pts-text">{{ a.pts }} pts</span>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.reward-wall-full {
    background: white; border-radius: 2rem; padding: 2rem; margin-top: 2rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.count-tag { background: #f1f5f9; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; color: #64748b; }

.pagination-controls { display: flex; align-items: center; gap: 15px; }
.pagination-controls button { 
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 5px 10px; cursor: pointer;
}
.pagination-controls button:disabled { opacity: 0.3; cursor: not-allowed; }

.achievement-paged-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-top: 1.5rem;
}
.reward-item-card {
    display: flex; align-items: center; gap: 1rem; padding: 1.2rem;
    background: #fcfdfe; border: 1px solid #f1f5f9; border-radius: 1.2rem;
}
.reward-icon-box { font-size: 1.8rem; width: 45px; }
.reward-info h4 { margin: 0; font-size: 0.95rem; }
.reward-info p { margin: 2px 0; font-size: 0.75rem; color: #94a3b8; }
.pts-text { font-size: 0.8rem; font-weight: 800; color: #3b82f6; }
.reward-item-card.locked { opacity: 0.6; filter: grayscale(1); border-style: dashed; }
</style>