<script setup>
import { ref, computed, onMounted } from 'vue'
import { checkinApi } from '@/api/checkin' // 引入隊友的 API
import { ElMessage, ElMessageBox } from 'element-plus'
import Nav from '@/components/Nav.vue'
import AchievementsMission from '@/components/AchievementsMission.vue'
import AchievementsCards from '@/components/AchievementsCards.vue'
import AchievementsReward from '@/components/AchievementsReward.vue'

// --- 1. 使用者身份與等級資訊 (整合 Julia 的動態稱號) ---
const userLevel = ref({ 
    level: 12, 
    currentXP: 2850, 
    nextLevelXP: 4000, 
    streak: 15, 
    hasCheckedIn: false 
})

// 稱號邏輯：根據等級自動變換 [來自 Julia 的更新]
const identity = computed(() => {
    const lv = userLevel.value.level;
    if (lv >= 61) return { rank: '財富領主', title: '財務自由大師', theme: 'legendary' };
    if (lv >= 31) return { rank: '金幣執行長', title: '資產配置師', theme: 'epic' };
    if (lv >= 11) return { rank: '銀幣精算師', title: '預算控制專家', theme: 'rare' };
    return { rank: '銅幣實習生', title: '錢包守門員', theme: 'common' };
})

const xpProgress = computed(() => Math.floor((userLevel.value.currentXP / userLevel.value.nextLevelXP) * 100))

// --- 2. 簽到功能邏輯 (完全保留 Julia 的 API 介接) ---
const checkinStatus = ref({
    hasCheckedIn: false,
    currentCycleDay: 0,
    todayXpReward: 0,
    weeklyRewards: [10, 10, 20, 20, 20, 20, 50]
});

// 取得打卡狀態
const fetchMyCheckinStatus = async () => {
    try {
        const res = await checkinApi.getStatus();
        const data = res.data || res;
        if (data) {
            checkinStatus.value.hasCheckedIn = data.has_checked_in;
            checkinStatus.value.currentCycleDay = data.current_cycle_day; 
            checkinStatus.value.todayXpReward = data.today_xp_reward;
            checkinStatus.value.weeklyRewards = data.weekly_rewards;
        }
    } catch (err) {
        console.error("無法載入打卡狀態", err);
    }
};

// 執行打卡動作
const handleDoCheckin = async () => {
    try {
        const res = await checkinApi.performAction();
        const data = res.data || res;
        if (data) {
            ElMessage.success(`簽到成功！獲得了 ${data.earned_xp} XP`);
            userLevel.value.streak = data.streak_count; // 更新連續天數
            
            if (data.show_bonus_modal) {
                await ElMessageBox.alert('🎉 恭喜！你已累計打卡滿 10 次，額外獲得 50 XP！', '成就達成', { type: 'success' });
            }
            if (data.show_monthly_bonus) {
                await ElMessageBox.alert('🏆 太強了！本月全勤達成，額外獎勵 100 XP！', '月全勤大師', { type: 'success' });
            }
            await fetchMyCheckinStatus(); // 重新刷狀態
        }
    } catch (err) {
        ElMessage.error(err.response?.data?.detail || "簽到失敗");
    }
};

// 動態計算簽到節點狀態
const checkInDays = computed(() => {
    const rewards = checkinStatus.value.weeklyRewards;
    const currentDay = checkinStatus.value.currentCycleDay === 0 ? 1 : checkinStatus.value.currentCycleDay;
    const isTodayClaimed = checkinStatus.value.hasCheckedIn;

    return rewards.map((xp, index) => {
        const dayNum = index + 1;
        let status = 'locked';
        if (dayNum < currentDay) status = 'claimed';
        else if (dayNum === currentDay) status = isTodayClaimed ? 'claimed' : 'ready';
        return { day: dayNum, xp: xp, status: status, big: xp >= 50 };
    });
});

onMounted(() => {
    fetchMyCheckinStatus();
});
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
                    <h2>💰 連續簽到獎勵</h2>
                    <button class="btn-primary-large" :disabled="checkinStatus.hasCheckedIn"
                        @click="handleDoCheckin">
                        {{ checkinStatus.hasCheckedIn ? '今日已領取' : `立即領取 ${checkinStatus.todayXpReward} XP` }}
                    </button>
                </div>
                
                <div class="checkin-flex">
                    <div v-for="d in checkInDays" :key="d.day" class="checkin-node" :class="[d.status, { 'special-card': d.big }]">
                        <span class="ci-day">DAY {{ d.day }}</span>
                        <span class="ci-icon" style="font-size: 2rem; margin: 10px 0;">{{ d.big ? '💎' : '💰' }}</span>
                        <span class="ci-reward" style="font-weight: 800;">+{{ d.xp }} XP</span>
                        <div v-if="d.status === 'claimed'" class="ci-completed">✔</div>
                    </div>
                </div>
                <p class="checkin-hint">* 連續簽到獎勵每 7 天循環一次。累積滿 10 次及月全勤另有額外驚喜！</p>
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

.interactive-split-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr; 
    gap: 3rem;
    width: 100%;
}

.checkin-hint { margin: 8px 0 0 8px; font-size: 12px; color: #888; }

/* Julia 的鎖定狀態樣式 */
.checkin-node.locked {
    background-color: rgba(200, 200, 210, 0.15); 
    border: 1.5px dashed rgba(150, 150, 150, 0.4);
    transform: scale(0.95);
    color: #999;
    filter: grayscale(1);
    backdrop-filter: blur(2px);
}
</style>