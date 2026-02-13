<script setup>
import { ref } from 'vue'

const dailyMissions = ref([
    { id: 'm1', rarity: 'common', title: '隨手記帳', desc: '記錄今日 1 筆消費', xp: 20, icon: '📝', progress: 1, target: 1, state: 'idle' },
    { id: 'm2', rarity: 'rare', title: '財務巡檢', desc: '查看收支分析報表', xp: 45, icon: '📊', progress: 0, target: 1, state: 'idle' },
    { id: 'm3', rarity: 'epic', title: '絕地省錢', desc: '今日完全零消費挑戰', xp: 200, icon: '🔥', progress: 0, target: 1, state: 'idle' }
])

const startMission = (m) => { m.state = 'active' }
const claimMission = (m) => { m.state = 'completed' }
</script>

<template>
    <section class="mission-container">
        <div class="card-header">
            <h2>⚡ 隨機修煉任務</h2>
            <span class="countdown">刷新倒數 08:22:15</span>
        </div>
        
        <div class="mission-stack">
            <div v-for="m in dailyMissions" :key="m.id" class="m-card-elite" :class="[m.rarity, m.state]">
                <template v-if="m.state !== 'completed'">
                    <div class="m-visual">{{ m.icon }}</div>
                    <div class="m-content">
                        <div class="m-header-row">
                            <h3>{{ m.title }}</h3>
                            <span class="m-rarity-badge">{{ m.rarity.toUpperCase() }}</span>
                        </div>
                        <p>{{ m.desc }}</p>
                        
                        <div v-if="m.state === 'active'" class="m-progress-group">
                            <div class="m-bar-bg"><div class="m-bar-fill" :style="{ width: (m.progress/m.target*100)+'%' }"></div></div>
                            <span class="m-count">{{ m.progress }} / {{ m.target }}</span>
                        </div>
                    </div>
                    
                    <div class="m-action-zone">
                        <button v-if="m.state === 'idle'" class="btn-action start" @click="startMission(m)">接取任務</button>
                        <button v-else-if="m.state === 'active' && m.progress >= m.target" class="btn-action claim" @click="claimMission(m)">領取獎勵 (+{{m.xp}}XP)</button>
                        <span v-else class="status-working">進行中...</span>
                    </div>
                </template>
                
                <div v-else class="mission-done-empty">
                    <span class="check-icon">✅</span>
                    <p>此修煉已完成。新任務請等待倒數刷新。</p>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@import '../assets/css/achievements.css';

.m-header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.m-rarity-badge { font-size: 0.6rem; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #64748b; font-weight: 800; }

.btn-action {
    padding: 0.6rem 1.2rem;
    border-radius: 0.8rem;
    border: none;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s;
}
.btn-action.start { background: #1e293b; color: white; }
.btn-action.claim { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
.status-working { color: #3b82f6; font-weight: 800; font-size: 0.9rem; }

.mission-done-empty {
    width: 100%; text-align: center; color: #94a3b8;
    display: flex; align-items: center; justify-content: center; gap: 1rem;
}
.m-card-elite.completed { background: #f8fafc; border-style: dashed; opacity: 0.8; }
</style>