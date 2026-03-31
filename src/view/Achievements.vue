<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AchievementsMission from '@/components/AchievementsMission.vue'
import AchievementsCards from '@/components/AchievementsCards.vue'
import AchievementsReward from '@/components/AchievementsReward.vue'
import { checkinApi,getGameSummary,} from '@/api/gamification' 

// --- 1. 等級與稱號規劃 ---
const rankNames = ["銅幣實習生", "銀幣精算師", "金幣執行長", "財富領主", "資產配置師", "金流導師", "預算大師", "省錢傳奇", "財富守護者", "記帳終結者"];
const titleNames = ["錢包守門員", "預算控制專家", "資產配置達人", "財務自由先鋒", "金流掌控大師", "理財規劃顧問", "省錢戰略家", "金權統治者", "財富門徒", "傳奇理財大師"];

// --- 2. 使用者等級數據 ---
const userLevel = ref({ 
    level: 1, 
    currentXP: 0, 
    nextLevelXP: 100, 
    streak: 0, 
    hasCheckedIn: false 
})

// 🌟 獲取玩家摘要
const fetchUserLevelSummary = async () => {
    try {
        const res = await getGameSummary();
        const data = res.data || res;

        userLevel.value = {
            level: data.level || 1,
            maxLevel: data.max_level || 100,
            currentXP: data.xp ?? 0,
            nextLevelXP: data.next_level_xp ?? 100,
            streak: data.streak_count ?? data.streak ?? 0,
            hasCheckedIn: data.has_checked_in ?? data.hasCheckedIn ?? false
        };
    } catch (err) {
        console.error("無法載入玩家等級摘要", err);
    }
}

const identity = computed(() => {
    const lv = userLevel.value.level || 1;
    // 修正：確保 index 不會超過 rankNames 的長度 (0-9)
    const index = Math.min(Math.floor((lv - 1) / 10), rankNames.length - 1);
    
    let themeClass = 'common';
    if (lv >= 91) themeClass = 'legendary';
    else if (lv >= 51) themeClass = 'epic';
    else if (lv >= 11) themeClass = 'rare';

    return { 
        rank: rankNames[index] || rankNames[0], 
        title: titleNames[index] || titleNames[0], 
        theme: themeClass 
    };
});

const xpProgress = computed(() => {
    const current = userLevel.value.currentXP || 0; 
    const next = userLevel.value.nextLevelXP || 100;
    
    if (next === 0) return 0; // 防止除以 0
    
    // 計算百分比並限制在 0~100 之間
    const percentage = Math.round((current / next) * 100);
    return Math.max(0, Math.min(percentage, 100));
})

// --- 3. 簽到功能邏輯 ---
const checkinStatus = ref({
    hasCheckedIn: false,
    currentCycleDay: 0,
    todayXpReward: 0,
    weeklyRewards: [10, 10, 20, 20, 20, 20, 50]
});

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

const handleDoCheckin = async () => {
    try {
        const res = await checkinApi.performAction();
        const data = res.data || res;
        if (data) {
            ElMessage.success(`簽到成功！獲得了 ${data.earned_xp} XP`);
            
            // 🌟 簽到後立刻更新等級摘要 (XP 會變動)
            await fetchUserLevelSummary();
            
            // 🌟 觸發任務組件重新抓取 (因為簽到通常也是一個任務)
            if (missionRef.value && typeof missionRef.value.fetchMissions === 'function') {
                missionRef.value.fetchMissions();
            }

            if (data.show_bonus_modal) {
                await ElMessageBox.alert('🎉 恭喜！你已累計打卡滿 10 次，額外獲得 50 XP！', '成就達成', { type: 'success' });
            }

            if (data.show_monthly_bonus) {
                await ElMessageBox.alert(
                    '🏆 太強了！本月全勤達成，額外獎勵 100 XP！', 
                    '月全勤大師', 
                    { confirmButtonText: '領取獎勵', type: 'success' }
                );
            }

            await fetchMyCheckinStatus(); 
        }
    } catch (err) {
        // 捕獲後端 HTTPException 的 detail 訊息
        const errorMsg = err.response?.data?.detail || "簽到失敗";
        ElMessage.error(errorMsg);
    }
};

// --- 4. 其他輔助邏輯 ---
const cardsRef = ref(null);
const missionRef = ref(null);

// 🌟 當任務獎勵被領取時觸發
const refreshCardsAndLevel = async () => {
    if (cardsRef.value?.fetchCollection) {
        cardsRef.value.fetchCollection();
    }
    // 更新等級摘要，因為任務獎勵包含 XP
    await fetchUserLevelSummary();
};

const checkInDays = computed(() => {
    const rewards = checkinStatus.value.weeklyRewards || [10, 10, 20, 20, 20, 20, 50];

    // 💡 關鍵：如果 cycle_day 是 0，代表是新的一輪，要把目標對準第 1 天
    // 注意：這裡要確認你的變數名是 currentCycleDay 還是 current_cycle_day (根據 API 欄位)
    const currentDay = (checkinStatus.value.currentCycleDay === 0)
                    ? 1
                    : checkinStatus.value.currentCycleDay;

    const isTodayClaimed = checkinStatus.value.hasCheckedIn;

    return rewards.map((xp, index) => {
        const dayNum = index + 1;
        let status = 'locked';

        if (dayNum < currentDay) {
            status = 'claimed'; // 過去的進度
        } else if (dayNum === currentDay) {
            // 今天的進度：沒領過就是 ready (會亮起來)，領過就是 claimed
            status = isTodayClaimed ? 'claimed' : 'ready';
        } else {
            status = 'locked'; // 未來的進度
        }

        return {
            day: dayNum,
            xp: xp,
            status: status,
            big: xp >= 50
        };
    });
});

onMounted(() => {
    fetchUserLevelSummary(); 
    fetchMyCheckinStatus(); 
    window.addEventListener('sync-money-data', fetchTransactions); 
});
</script>

<template>
        <div class="mms-full-layout">
            <header class="hero-identity-banner" :class="identity.theme">
                <div class="banner-left">
                    <div class="main-orb">
                        <svg viewBox="0 0 36 36" class="orb-svg">
                            <path
                                class="orb-bg"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                                class="orb-progress"
                                :stroke-dasharray="xpProgress + ', 100'"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                        </svg>
                        <div class="orb-content">
                            <span class="orb-label">Lv</span>
                            <span class="orb-number">{{ userLevel.level }}</span>
                        </div>
                    </div>
                    
                    <div class="identity-info">
                        <div class="rank-tag">{{ identity.rank }}</div>
                        
                        <h1 class="identity-title">{{ identity.title }}</h1>
                        
                        <div class="xp-row">
                            <div class="xp-meta">
                                <span>
                                    進度 {{ xpProgress }}% 
                                    ({{ userLevel.currentXP || 0 }} / {{ userLevel.nextLevelXP || 100 }})
                                </span>                            
                            </div>
                        </div>
                        <p class="combo-badge">🔥 連續簽到 {{ userLevel.streak || 0}} 天</p>
                    </div>
                </div>
                <div class="banner-right">
                    <div v-if="userLevel.level < 50" class="milestone-box">
                        <br>
                        <h3>🚀 50級解鎖獎勵</h3>
                        <br>
                        <ul class="reward-list">
                            <li>🎁 沙漠綠洲專屬主題</li>
                            <br>
                            <br>
                            <li class="goal-hint">距離目標還差 {{ 50 - userLevel.level }} 級</li>
                        </ul>
                    </div>

                    <div v-else-if="userLevel.level < 100" class="milestone-box">
                        <br>
                        <h3>🚀 100級解鎖獎勵</h3>
                        <br>
                        <p v-if="userLevel.level === 50" style="color: #fbbf24; font-size: 12px; margin-bottom: 5px;">🎉 已成功解鎖沙漠綠洲！</p>
                        <ul class="reward-list">
                            <li>🎁 午夜霓虹終極主題</li>
                            <br>
                            <br>
                            <li class="goal-hint">距離滿級還差 {{ 100 - userLevel.level }} 級</li>
                        </ul>
                    </div>

                    <div v-else class="milestone-box">
                        <h3>🎉 傳奇成就達成</h3>
                        <ul class="reward-list">
                            <li>🌟 已解鎖所有傳奇獎勵</li>
                            <li>🔥 傳奇稱號：{{ identity.rank }}</li>
                        </ul>
                    </div>
                </div>
            </header>

            <section class="board-card">
                <div class="card-header">
                    <h2>💰 連續簽到獎勵</h2>
                    <button class="btn-primary-large" :disabled="checkinStatus.hasCheckedIn" @click="handleDoCheckin">
                        {{ checkinStatus.hasCheckedIn ? '今日已領取' : `立即領取 ${checkinStatus.todayXpReward} XP` }}
                    </button>
                </div>
                
                <div class="checkin-flex">
                    <div v-for="d in checkInDays" :key="d.day" class="checkin-node" :class="[d.status, { 'special-card': d.big }]">
                        <span class="ci-day">DAY {{ d.day }}</span>
                        <span class="ci-icon" style="font-size: 2rem; margin: 10px 0;">💰</span>
                        <span class="ci-reward" style="font-weight: 800;">+{{ d.xp }} XP</span>
                        <div v-if="d.status === 'claimed'" class="ci-completed">✔</div>
                    </div>
                </div>
                <p style="margin: 25px 0 0 8px; font-size: 12px; color: #888;">* 連續簽到獎勵每 7 天循環一次，若簽到中斷，則從 DAY 1 重新累計。</p>
                <p style="margin: 0px 0 0 8px; font-size: 12px; color: #888;">* 累積滿 10 次及月全勤另有額外驚喜！</p>
            </section>

            <div class="interactive-split-grid">
                <AchievementsMission ref="missionRef" @reward-claimed="refreshCardsAndLevel" />
                <AchievementsCards ref="cardsRef" />
            </div>
            <AchievementsReward />
        </div>
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

/* --- 現代化等級圓環 (與預算樣式統一) --- */
.main-orb {
    position: relative;
    width: 120px; /* 稍微加大一點更有氣勢 */
    height: 120px;
    border:none;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.orb-svg {
    position: absolute;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg); /* 讓進度從正上方開始 */
}

/* 淺色底環：建議使用比 Banner 背景稍淺的顏色 */
.orb-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.2); /* 半透明白，適配所有主題背景 */
    stroke-width: 3.5; /* 粗度 */
}

/* XP 進度環：純白或亮金色 */
.orb-progress {
    fill: none;
    stroke: #ffffff; /* 純白進度條 */
    stroke-width: 3.5;
    stroke-linecap: round; /* 圓角端點 */
    transition: stroke-dasharray 0.8s ease-in-out;
}

/* 中心文字疊加 */
.orb-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
}

.orb-label {
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
    margin-bottom: -4px; /* 縮小字距 */
}

.orb-number {
    font-size: 36px;
    font-weight: 900;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

/* 針對不同稀有度的主題，可以動態改變進度條顏色 (選做) */
.hero-identity-banner.legendary .orb-progress {
    stroke: #fbbf24; /* 傳奇等級用金色進度條 */
}

.goal-hint {
    margin-top: 12px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.8);
    font-style: italic;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    padding-top: 8px;
    list-style: none !important; /* 去掉圓點 */
}

/* 讓獎勵列表更漂亮 */
.reward-list li {
    margin: 8px 0;
    font-weight: 500;
}
</style>