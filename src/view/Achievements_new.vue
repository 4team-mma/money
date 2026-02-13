<script setup>
import { ref, computed } from 'vue'
import Nav from '@/components/Nav.vue'
import AchievementsMission from '@/components/AchievementsMission.vue'
import AchievementsCards from '@/components/AchievementsCards.vue'
import AchievementsReward from '@/components/AchievementsReward.vue'

// --- 使用者等級與身分定義 ---
const userLevel = ref({ 
    level: 12, 
    currentXP: 2850, 
    nextLevelXP: 4000, 
    streak: 15, 
    hasCheckedIn: false 
})

const identity = computed(() => ({ 
    rank: '銀幣精算師', 
    title: '預算控制專家', 
    theme: 'rare' 
}))

const xpProgress = computed(() => 71)

// --- 補回簽到資料 ---
const checkInDays = ref([
    { day: 1, xp: 10, status: 'claimed' },
    { day: 2, xp: 10, status: 'claimed' },
    { day: 3, xp: 20, status: 'ready' },
    { day: 4, xp: 10, status: 'locked' },
    { day: 5, xp: 10, status: 'locked' },
    { day: 6, xp: 10, status: 'locked' },
    { day: 7, xp: 100, status: 'locked', big: true }
])
</script>

<template>
    <Nav>
        <div class="mms-full-layout">
            
            <header class="hero-identity-banner" :class="identity.theme">
                <div class="banner-left">
                    <div class="main-orb">
                        <span class="orb-label">Lv</span>
                        <span class="orb-number">{{ userLevel.level }}</span>
                    </div>
                    <div class="identity-info">
                        <div class="rank-tag">{{ identity.rank }}</div>
                        <h1 class="identity-title">{{ identity.title }}</h1>
                        <div class="xp-row">
                            <div class="xp-meta"><span>經驗值 ({{ xpProgress }}%)</span></div>
                            <div class="xp-bar-track">
                                <div class="xp-bar-fill" :style="{ width: xpProgress + '%' }"></div>
                            </div>
                        </div>
                        <p class="combo-badge">🔥 連續修煉 {{ userLevel.streak }} 天</p>
                    </div>
                </div>
                <div class="banner-right">
                    <h3>🚀 下一級解鎖獎勵</h3>
                    <ul class="reward-list">
                        <li>🎁 專屬金屬頭像框</li>
                        <li>🎁 專屬徽章</li>
                        <li>🔥 專屬特色背景</li>
                    </ul>
                </div>
            </header>

            <section class="board-card">
                <div class="card-header">
                    <h2>📅 每日簽到領獎</h2>
                    <button class="btn-primary-large" :disabled="userLevel.hasCheckedIn"
                        @click="userLevel.hasCheckedIn = true">
                        {{ userLevel.hasCheckedIn ? '今日已領取' : '立即簽到領取獎勵' }}
                    </button>
                </div>
                
                <div class="checkin-flex">
                    <div v-for="d in checkInDays" :key="d.day" class="checkin-node" :class="d.status">
                        <span class="ci-day">DAY {{ d.day }}</span>
                        <span class="ci-icon" style="font-size: 2rem; margin: 10px 0;">{{ d.big ? '💎' : '💰' }}</span>
                        <span class="ci-reward" style="font-weight: 800;">+{{ d.xp }} XP</span>
                        <div v-if="d.status === 'claimed'" class="ci-completed">✔</div>
                    </div>
                </div>
            </section>

            <div class="interactive-split-grid">
                <AchievementsMission />
                <AchievementsCards />
            </div>

            <AchievementsReward />
            
        </div>
    </Nav>
</template>

<style scoped>
@import '../assets/css/achievements.css';

/* 保持你的 Grid 比例設定 */
.interactive-split-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr; 
    gap: 3rem;
    width: 100%;
}
.hero-identity-banner rare{
    
    max-height: 20%;

}
</style>