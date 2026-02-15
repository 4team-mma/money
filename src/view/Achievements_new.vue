<script setup>
import { ref, computed, onMounted } from 'vue'
import { checkinApi } from '@/api/checkin';
import Nav from '@/components/Nav.vue'
import { ElMessage, ElMessageBox } from 'element-plus';

// --- 1. 使用者身份等級 (精準對接 Excel 稱號) ---
const userLevel = ref({
    level: 12,
    currentXP: 2850,
    nextLevelXP: 4000,
    streak: 0,
    hasCheckedIn: false
})

const identity = computed(() => {
    const lv = userLevel.value.level;
    if (lv >= 61) return { rank: '財富領主', title: '財務自由大師', theme: 'legendary' };
    if (lv >= 31) return { rank: '金幣執行長', title: '資產配置師', theme: 'epic' };
    if (lv >= 11) return { rank: '銀幣精算師', title: '預算控制專家', theme: 'rare' };
    return { rank: '銅幣實習生', title: '錢包守門員', theme: 'common' };
})

const xpProgress = computed(() => Math.floor((userLevel.value.currentXP / userLevel.value.nextLevelXP) * 100));

// --- 2. 隨機修煉任務 (區分難度 & 稀有度) ---
const dailyMissions = ref([
    { id: 'm1', rarity: 'common', diff: 'EASY', title: '隨手記帳', desc: '記錄今日 1 筆消費', xp: 20, icon: '📝', progress: 1, target: 1 },
    { id: 'm2', rarity: 'rare', diff: 'NORMAL', title: '財務巡檢', desc: '查看收支分析報表', xp: 45, icon: '📊', progress: 0, target: 1 },
    { id: 'm3', rarity: 'epic', diff: 'HARD', title: '絕地省錢', desc: '今日完全零消費挑戰', xp: 200, icon: '🔥', progress: 0, target: 1 }
])

// --- 3. 卡片收集系統 (完形心理學：任務完成機率獲得卡片) ---
const cardSets = ref([
    {
        name: '理財初心者',
        collected: 2,
        total: 4,
        cards: [
            { id: 101, name: '首記之光', active: true },
            { id: 102, name: '記帳連擊', active: true },
            { id: 103, name: '預算大師', active: false },
            { id: 104, name: '存錢奇才', active: false }
        ],
        reward: '解鎖特殊頭像框'
    },
    {
        name: '節流冒險者',
        collected: 1,
        total: 3,
        cards: [
            { id: 201, name: '不渴大師', active: true },
            { id: 202, name: '戒菸勇者', active: false },
            { id: 203, name: '抗慾騎士', active: false }
        ],
        reward: '年度資產對比圖表'
    }
])

// --- 4. 榮耀成就牆 ---
const achievements = ref([
    { id: 1, title: '初次記帳', icon: '🌟', date: '2024-01-15', pts: 10, unlocked: true },
    { id: 2, title: '儲蓄高手', icon: '💎', req: '還需 $42,500', pts: 50, unlocked: false },
    { id: 3, title: '不渴大師', icon: '🥤', req: '已堅持 15 天', pts: 100, unlocked: false },
    { id: 4, title: '投資先驅', icon: '📈', req: '完成首筆投資', pts: 80, unlocked: false }
])


// 簽到領獎功能

// 簽到狀態回應 (對應後端 CheckinStatus Schema) ---
const checkinStatus = ref({
    hasCheckedIn: false,
    currentCycleDay: 0, // 這是後端傳回來的 1~7 循環
    todayXpReward: 0,
    weeklyRewards: [10, 10, 20, 20, 20, 20, 50] // 預設值，之後會被後端覆蓋
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
            // 1. 基本領取成功通知
            ElMessage.success(`簽到成功！獲得了 ${data.earned_xp} XP`);
            
            // 2. 更新本機等級資訊 (可選)
            userLevel.value.streak = data.streak_count;

            // 3. 🎯 處理特別 Bonus 彈窗
            if (data.show_bonus_modal) {
                await ElMessageBox.alert(
                    '🎉 恭喜！你已累計打卡滿 10 次，額外獲得 50 XP！', 
                    '成就達成', 
                    { confirmButtonText: '太棒了', type: 'success' }
                );
            }

            if (data.show_monthly_bonus) {
                await ElMessageBox.alert(
                    '🏆 太強了！本月全勤達成，額外獎勵 100 XP！', 
                    '月全勤大師', 
                    { confirmButtonText: '領取獎勵', type: 'success' }
                );
            }
            // 4. 重新刷狀態
            await fetchMyCheckinStatus();
        }
    } catch (err) {
        const errorMsg = err.response?.data?.detail || "簽到失敗";
        ElMessage.error(errorMsg);
    }
};

// 簽到卡片介面設定
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
    fetchMyCheckinStatus();
});

</script>
<template>
    <Nav>

<!-- Header部分 -->
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
                            <div class="xp-meta">
                                <span>經驗值 ({{ xpProgress }}%)</span>
                                <span>{{ userLevel.currentXP }} / {{ userLevel.nextLevelXP }} XP</span>
                            </div>
                            <div class="xp-bar-track">
                                <div class="xp-bar-fill" :style="{ width: xpProgress + '%' }"></div>
                            </div>
                        </div>
                        <div class="combo-badge">🔥 連續修煉 {{ userLevel.streak }} 天</div>
                    </div>
                </div>
                <div class="banner-right">
                    <h3>🚀 下一級解鎖獎勵</h3>
                    <ul>
                        <li>🎁 專屬金屬頭像框</li>
                        <li>🎁 專屬徽章</li>
                        <li>🔥 專屬特色背景</li>
                        <li>📊 年度資產對比分析</li>
                    </ul>
                </div>
            </header>
<!-- Header部分結尾 -->



<!-- 每日簽到部分 -->

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
                        <span class="ci-icon">💰</span>
                        <span class="ci-reward">+{{ d.xp }} XP</span>
                        <div v-if="d.status === 'claimed'" class="ci-completed">✔</div>
                    </div>
                </div>
                <p style="margin: 8px 0 0 8px; font-size: 12px; color: #888;">* 連續簽到獎勵每 7 天循環一次，若簽到中斷，則從 DAY 1 重新累計。</p>
                <p style="margin: 0px 0 0 8px; font-size: 12px; color: #888;">* 累積滿 10 次及月全勤另有額外驚喜！</p>
            </section>
<!-- 每日簽到部分結尾 -->


<!-- 隨機修練部分 -->
            <div class="main-interactive-grid">
                <section class="mission-container">
                    <div class="card-header">
                        <h2>⚡ 隨機修煉任務</h2>
                        <span class="countdown">刷新倒數 08:22:15</span>
                    </div>
                    <div class="mission-stack">
                        <div v-for="m in dailyMissions" :key="m.id" class="m-card-elite" :class="m.rarity">
                            <div class="m-rarity-label">{{ m.rarity.toUpperCase() }}</div>
                            <div class="m-visual">{{ m.icon }}</div>
                            <div class="m-content">
                                <h3>{{ m.title }}</h3>
                                <p>{{ m.desc }}</p>
                                <div class="m-progress-bar-group">
                                    <div class="m-bar-bg">
                                        <div class="m-bar-fill" :style="{ width: (m.progress / m.target * 100) + '%' }">
                                        </div>
                                    </div>
                                    <span>{{ m.progress }} / {{ m.target }}</span>
                                </div>
                            </div>
                            <div class="m-reward-action">
                                <span class="reward-xp">+{{ m.xp }} XP</span>
                            </div>
                        </div>
                    </div>
                </section>

<!-- 隨機修練部分結尾 -->

<!-- 卡牌收集部分 -->
                <section class="collection-container">
                    <div class="card-header">
                        <h2>🃏 卡片收集進度</h2>
                    </div>
                    <div v-for="set in cardSets" :key="set.name" class="collection-set-card">
                        <div class="set-header">
                            <span>{{ set.name }}</span>
                            <span class="set-count">{{ set.collected }} / {{ set.total }}</span>
                        </div>
                        <div class="card-slot-grid">
                            <div v-for="card in set.cards" :key="card.id" class="card-slot"
                                :class="{ active: card.active }">
                                <span v-if="card.active" class="card-icon">🎴</span>
                            </div>
                        </div>
                        <p class="set-reward-text">🎁 達成獎勵：{{ set.reward }}</p>
                    </div>
                </section>
            </div>

            <section class="board-card">
                <div class="card-header">
                    <h2>🏆 榮耀成就收集</h2>
                    <span class="total-stats-tag">已達成 12 / 48 項成就</span>
                </div>
                <div class="achievement-grid-rwd">
                    <div v-for="a in achievements" :key="a.id" class="badge-elite" :class="{ locked: !a.unlocked }">
                        <div class="badge-icon-wrap">{{ a.icon }}</div>
                        <h4>{{ a.title }}</h4>
                        <p v-if="a.unlocked" class="unlock-date">達成於 {{ a.date }}</p>
                        <p v-else class="lock-req">{{ a.req }}</p>
                        <span class="pts-badge">{{ a.pts }} pts</span>
                    </div>
                </div>
            </section>
        </div>

<!-- 卡牌收集部分結尾 -->

    </Nav>
</template>

<style scoped>
/* 核心版面控制：解決左右空白紅框 */
.mms-full-layout {
    padding: 3rem;
    background-color: #f0f7ff;
    /* Money MMA 經典淡藍底色 */
    min-height: 100vh;
    width: 96%;
    max-width: 1600px;
    /* 提升上限，不再留大邊 */
    margin: 0 auto;
}

/* 英雄卡片 Banner：大幅提升字體比例 */
.hero-identity-banner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    padding: 3.5rem 4rem;
    border-radius: 2.5rem;
    color: white;
    margin-bottom: 3.5rem;
    box-shadow: 0 1.5rem 4rem rgba(59, 130, 246, 0.2);
}

.banner-left {
    display: flex;
    align-items: center;
    gap: 3.5rem;
}

.main-orb {
    width: 8rem;
    height: 8rem;
    border: 0.5rem solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.orb-label {
    font-size: 1.4rem;
    opacity: 0.8;
}

.orb-number {
    font-size: 4rem;
    font-weight: 900;
    line-height: 1;
}

.rank-tag {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.4rem 1.4rem;
    border-radius: 5rem;
    font-size: 1.2rem;
}

.identity-title {
    font-size: 3.2rem;
    font-weight: 800;
    margin: 0.8rem 0 1.5rem;
}

/* 區塊通用標題 */
.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    margin-bottom: 2rem;
}

.card-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
}

/* 打卡區域 */
.checkin-flex {
    display: flex;
    gap: 1.2rem;
    margin-top: 1.5rem;
}

.checkin-node {
    flex: 1;
    background: white;
    border-radius: 1.5rem;
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    border: 0.2rem solid #e2e8f0;
    position: relative;
    transition: 0.3s;
}

.checkin-node.claimed {
    background: #e0f2fe;
    border-color: #3b82f6;
    opacity: 0.8;
}

.ci-completed {
    position: absolute;
    inset: 0;
    background: rgba(59, 130, 246, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #3b82f6;
    border-radius: 1.5rem;
}

/* 任務(2/3) + 卡片(1/3) 排版 */
.main-interactive-grid {
    display: grid;
    grid-template-columns: 1.8fr 1fr;
    /* 平衡視覺重點 */
    gap: 3.5rem;
    margin-bottom: 4rem;
}

.mission-stack {
    display: grid;
    gap: 1.5rem;
}

.m-card-elite {
    background: white;
    border-radius: 2rem;
    padding: 2.2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    position: relative;
    border: 1px solid #eef2f6;
    transition: 0.3s ease-out;
}

.m-card-elite:hover {
    transform: scale(1.02);
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.05);
}

.m-rarity-label {
    position: absolute;
    top: 1.2rem;
    right: 2rem;
    font-size: 0.9rem;
    font-weight: 800;
    color: #94a3b8;
}

.m-visual {
    font-size: 3.5rem;
}

.m-content h3 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
}

/* 卡片收集槽 */
.collection-set-card {
    background: white;
    padding: 2.5rem;
    border-radius: 2rem;
    border: 1px solid #eef2f6;
    margin-bottom: 2rem;
}

.card-slot-grid {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
}

.card-slot {
    width: 4.5rem;
    height: 6rem;
    background: #f1f5f9;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
}

.card-slot.active {
    background: #3b82f6;
    box-shadow: 0 0.8rem 2rem rgba(59, 130, 246, 0.3);
}

.card-icon {
    font-size: 2.5rem;
}

/* 成就徽章牆 */
.achievement-grid-rwd {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
}

.badge-elite {
    background: white;
    border-radius: 2rem;
    padding: 3rem 2rem;
    text-align: center;
    border: 1px solid #f1f5f9;
    transition: 0.3s;
}

.badge-elite.locked {
    opacity: 0.5;
    filter: grayscale(1);
}

.badge-icon-wrap {
    font-size: 4rem;
    margin-bottom: 1.5rem;
}

.pts-badge {
    margin-top: 1.5rem;
    display: inline-block;
    background: #eff6ff;
    color: #3b82f6;
    padding: 0.5rem 1.5rem;
    border-radius: 5rem;
    font-weight: 800;
    font-size: 1.1rem;
}

/* 按鈕美化 */
.btn-primary-large {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 1rem 2.5rem;
    border-radius: 1rem;
    font-size: 1.4rem;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 1rem 2rem rgba(59, 130, 246, 0.3);
}

/* RWD 適應 */
@media (max-width: 1200px) {
    .main-interactive-grid {
        grid-template-columns: 1fr;
    }

    .mms-full-layout {
        padding: 1.5rem;
    }
}

.checkin-node.locked {
    /* 1. 使用淡紫色或淡灰色，增加一點點色偏，比純灰色高級 */
    background-color: rgba(200, 200, 210, 0.15); 
    
    /* 2. 使用虛線或點狀邊框，暗示「結構不穩定，還沒成形」 */
    border: 1.5px dashed rgba(150, 150, 150, 0.4);
    
    /* 3. 縮小一點點，製造物理上的壓抑感 */
    transform: scale(0.95);
    
    /* 4. 內容物變淡變灰 */
    color: #999;
    filter: grayscale(1);
    
    /* 5. 加上一點點毛玻璃 (如果背景有顏色的話很有感) */
    backdrop-filter: blur(2px);

}
</style>