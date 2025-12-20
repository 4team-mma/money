<script setup>
import { ref, computed } from 'vue'
import Nav from '@/components/Nav.vue'

// 用戶等級
const userLevel = ref({
    level: 12,
    title: '理財達人',
    description: '您已經掌握了基本的理財技巧',
    currentXP: 2850,
    nextLevelXP: 4000,
    progress: 71
})

// 每日重置倒數
const dailyResetTime = ref('23:45:30')

// 每日挑戰
const dailyChallenges = ref([
    {
        id: 1,
        icon: '📝',
        title: '記錄交易',
        description: '今日記錄 5 筆交易',
        current: 3,
        target: 5,
        xp: 50,
        completed: false,
        claimed: false
    },
    {
        id: 2,
        icon: '💰',
        title: '預算控制',
        description: '支出不超過預算',
        current: 1,
        target: 1,
        xp: 100,
        completed: true,
        claimed: false
    },
    {
        id: 3,
        icon: '📊',
        title: '查看報表',
        description: '查看財務分析圖表',
        current: 1,
        target: 1,
        xp: 30,
        completed: true,
        claimed: true
    },
    {
        id: 4,
        icon: '🎯',
        title: '設定目標',
        description: '設定一個儲蓄目標',
        current: 0,
        target: 1,
        xp: 80,
        completed: false,
        claimed: false
    }
])

// 成就分類
const activeCategory = ref('all')
const achievementCategories = [
    { id: 'all', name: '全部' },
    { id: 'transaction', name: '交易' },
    { id: 'savings', name: '儲蓄' },
    { id: 'investment', name: '投資' },
    { id: 'special', name: '特殊' }
]

// 成就列表
const achievements = ref([
    {
        id: 1,
        category: 'transaction',
        icon: '🌟',
        title: '初次記帳',
        description: '完成第一筆交易記錄',
        points: 10,
        unlocked: true,
        unlockedDate: '2024-01-15',
        requirement: null
    },
    {
        id: 2,
        category: 'transaction',
        icon: '📝',
        title: '記帳新手',
        description: '累計記錄 50 筆交易',
        points: 50,
        unlocked: true,
        unlockedDate: '2024-02-20',
        requirement: null
    },
    {
        id: 3,
        category: 'transaction',
        icon: '📚',
        title: '記帳達人',
        description: '累計記錄 500 筆交易',
        points: 200,
        unlocked: false,
        unlockedDate: null,
        requirement: '還需記錄 257 筆交易'
    },
    {
        id: 4,
        category: 'savings',
        icon: '💰',
        title: '小額儲蓄',
        description: '儲蓄達到 $10,000',
        points: 30,
        unlocked: true,
        unlockedDate: '2024-03-05',
        requirement: null
    },
    {
        id: 5,
        category: 'savings',
        icon: '💎',
        title: '儲蓄高手',
        description: '儲蓄達到 $100,000',
        points: 150,
        unlocked: false,
        unlockedDate: null,
        requirement: '還需儲蓄 $42,500'
    },
    {
        id: 6,
        category: 'investment',
        icon: '📈',
        title: '投資新手',
        description: '完成第一筆投資',
        points: 50,
        unlocked: true,
        unlockedDate: '2024-04-10',
        requirement: null
    },
    {
        id: 7,
        category: 'investment',
        icon: '🚀',
        title: '投資獲利',
        description: '投資獲利達 20%',
        points: 300,
        unlocked: false,
        unlockedDate: null,
        requirement: '目前獲利 12%'
    },
    {
        id: 8,
        category: 'special',
        icon: '🎉',
        title: '連續記帳',
        description: '連續 30 天記帳',
        points: 100,
        unlocked: false,
        unlockedDate: null,
        requirement: '已連續 15 天'
    },
    {
        id: 9,
        category: 'special',
        icon: '🏆',
        title: '預算大師',
        description: '連續 3 個月預算控制完美',
        points: 250,
        unlocked: false,
        unlockedDate: null,
        requirement: '已完成 1 個月'
    }
])

const filteredAchievements = computed(() => {
    if (activeCategory.value === 'all') {
        return achievements.value
    }
    return achievements.value.filter(a => a.category === activeCategory.value)
})

const unlockedAchievements = computed(() => {
    return achievements.value.filter(a => a.unlocked).length
})

const totalAchievements = computed(() => {
    return achievements.value.length
})

// 排行榜
const leaderboardPeriod = ref('weekly')
const leaderboard = ref([
    { id: 1, name: '王小明', avatar: '👨', level: 25, xp: 18500, achievements: 42, isCurrentUser: false },
    { id: 2, name: '李小華', avatar: '👩', level: 22, xp: 15200, achievements: 38, isCurrentUser: false },
    { id: 3, name: '張美玲', avatar: '👧', level: 20, xp: 13800, achievements: 35, isCurrentUser: false },
    { id: 4, name: '陳大同', avatar: '👨', level: 18, xp: 11500, achievements: 30, isCurrentUser: false },
    { id: 5, name: '您', avatar: '🎯', level: 12, xp: 8200, achievements: 24, isCurrentUser: true },
    { id: 6, name: '林小芳', avatar: '👩', level: 10, xp: 6500, achievements: 20, isCurrentUser: false },
    { id: 7, name: '黃志明', avatar: '👨', level: 8, xp: 4200, achievements: 15, isCurrentUser: false }
])

const getRankClass = (index) => {
    if (index === 0) return 'gold'
    if (index === 1) return 'silver'
    if (index === 2) return 'bronze'
    return ''
}

const claimReward = (challengeId) => {
    const challenge = dailyChallenges.value.find(c => c.id === challengeId)
    if (challenge) {
        challenge.claimed = true
        userLevel.value.currentXP += challenge.xp
        userLevel.value.progress = Math.floor((userLevel.value.currentXP / userLevel.value.nextLevelXP) * 100)
    }
}
</script>


<template>
    <Nav>
    <div class="achievements-container">
        <div class="achievements-header">
            <h1>成就系統</h1>
            <p>追蹤您的理財成就，解鎖更多獎勵</p>
        </div>

        <!-- 用戶等級 -->
        <div class="level-card">
            <div class="level-info">
                <div class="level-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span class="level-number">{{ userLevel.level }}</span>
                </div>
                <div class="level-details">
                    <h2>{{ userLevel.title }}</h2>
                    <p>{{ userLevel.description }}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: userLevel.progress + '%' }"></div>
                    </div>
                    <div class="progress-text">
                        {{ userLevel.currentXP }} / {{ userLevel.nextLevelXP }} XP
                        <span class="progress-percent">{{ userLevel.progress }}%</span>
                    </div>
                </div>
            </div>
            <div class="level-rewards">
                <h3>下一級獎勵</h3>
                <div class="rewards-list">
                    <div class="reward-item">
                        <span class="reward-icon">🎁</span>
                        <span>專屬頭像框</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">💰</span>
                        <span>100 積分</span>
                    </div>
                    <div class="reward-item">
                        <span class="reward-icon">⭐</span>
                        <span>VIP 功能解鎖</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 每日挑戰 -->
        <div class="section">
            <div class="section-header">
                <h2>每日挑戰</h2>
                <span class="timer">{{ dailyResetTime }}</span>
            </div>
            <div class="challenges-grid">
                <div v-for="challenge in dailyChallenges" :key="challenge.id"
                    :class="['challenge-card', { completed: challenge.completed }]">
                    <div class="challenge-icon">{{ challenge.icon }}</div>
                    <div class="challenge-content">
                        <h3>{{ challenge.title }}</h3>
                        <p>{{ challenge.description }}</p>
                        <div class="challenge-progress">
                            <div class="progress-bar small">
                                <div class="progress-fill"
                                    :style="{ width: (challenge.current / challenge.target * 100) + '%' }"></div>
                            </div>
                            <span class="progress-text">{{ challenge.current }}/{{ challenge.target }}</span>
                        </div>
                    </div>
                    <div class="challenge-reward">
                        <span class="reward-badge">+{{ challenge.xp }} XP</span>
                        <button v-if="challenge.completed && !challenge.claimed" class="claim-btn"
                            @click="claimReward(challenge.id)">
                            領取
                        </button>
                        <span v-if="challenge.claimed" class="claimed-text">已領取</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 成就列表 -->
        <div class="section">
            <div class="section-header">
                <h2>成就收集</h2>
                <div class="achievement-stats">
                    {{ unlockedAchievements }}/{{ totalAchievements }} 已解鎖
                </div>
            </div>

            <div class="achievement-tabs">
                <button v-for="category in achievementCategories" :key="category.id"
                    :class="['tab-btn', { active: activeCategory === category.id }]"
                    @click="activeCategory = category.id">
                    {{ category.name }}
                </button>
            </div>

            <div class="achievements-grid">
                <div v-for="achievement in filteredAchievements" :key="achievement.id"
                    :class="['achievement-card', { locked: !achievement.unlocked }]">
                    <div class="achievement-icon">
                        {{ achievement.icon }}
                        <span v-if="achievement.unlocked" class="unlock-badge">✓</span>
                    </div>
                    <div class="achievement-content">
                        <h3>{{ achievement.title }}</h3>
                        <p>{{ achievement.description }}</p>
                        <div v-if="achievement.unlocked" class="unlock-date">
                            解鎖於 {{ achievement.unlockedDate }}
                        </div>
                        <div v-else class="unlock-requirement">
                            {{ achievement.requirement }}
                        </div>
                    </div>
                    <div class="achievement-points">
                        <span class="points-badge">{{ achievement.points }} pts</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 排行榜 -->
        <div class="section">
            <div class="section-header">
                <h2>排行榜</h2>
                <select v-model="leaderboardPeriod" class="period-select">
                    <option value="daily">今日</option>
                    <option value="weekly">本週</option>
                    <option value="monthly">本月</option>
                    <option value="allTime">全部</option>
                </select>
            </div>

            <div class="leaderboard-card">
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>排名</th>
                            <th>用戶</th>
                            <th>等級</th>
                            <th>經驗值</th>
                            <th>成就數</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(user, index) in leaderboard" :key="user.id"
                            :class="{ highlight: user.isCurrentUser }">
                            <td>
                                <span :class="['rank-badge', getRankClass(index)]">
                                    {{ index + 1 }}
                                </span>
                            </td>
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">{{ user.avatar }}</div>
                                    <span class="user-name">{{ user.name }}</span>
                                </div>
                            </td>
                            <td>
                                <span class="level-badge-small">Lv.{{ user.level }}</span>
                            </td>
                            <td>{{ user.xp.toLocaleString() }}</td>
                            <td>{{ user.achievements }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    </Nav>
</template>



<style scoped>
.achievements-container {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
}

.achievements-header {
    margin-bottom: 32px;
}

.achievements-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.achievements-header p {
    color: #64748b;
    margin: 0;
}

/* 等級卡片 */
.level-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 32px;
    color: white;
    display: flex;
    gap: 32px;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.level-info {
    flex: 2;
    display: flex;
    gap: 24px;
    align-items: center;
}

.level-badge {
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    flex-shrink: 0;
    position: relative;
}

.level-badge svg {
    width: 40px;
    height: 40px;
    margin-bottom: 4px;
}

.level-number {
    font-size: 24px;
    font-weight: 700;
}

.level-details {
    flex: 1;
}

.level-details h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
}

.level-details p {
    margin: 0 0 16px 0;
    opacity: 0.9;
}

.progress-bar {
    height: 12px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #fbbf24, #f59e0b);
    border-radius: 6px;
    transition: width 0.5s ease;
}

.progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    opacity: 0.9;
}

.progress-percent {
    font-weight: 600;
}

.level-rewards {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
}

.level-rewards h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px 0;
}

.rewards-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.reward-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
}

.reward-icon {
    font-size: 20px;
}

/* 區塊 */
.section {
    margin-bottom: 40px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-header h2 {
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.timer {
    font-size: 14px;
    color: #64748b;
    background: #f1f5f9;
    padding: 6px 12px;
    border-radius: 6px;
}

/* 挑戰卡片 */
.challenges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

.challenge-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

.challenge-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.challenge-card.completed {
    background: linear-gradient(135deg, #dcfce7, #d1fae5);
}

.challenge-icon {
    font-size: 32px;
    flex-shrink: 0;
}

.challenge-content {
    flex: 1;
}

.challenge-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.challenge-content p {
    font-size: 13px;
    color: #64748b;
    margin: 0 0 12px 0;
}

.challenge-progress {
    display: flex;
    align-items: center;
    gap: 8px;
}

.progress-bar.small {
    flex: 1;
    height: 6px;
}

.challenge-progress .progress-text {
    font-size: 12px;
    color: #64748b;
    white-space: nowrap;
}

.challenge-reward {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
}

.reward-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.claim-btn {
    padding: 6px 16px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.claim-btn:hover {
    transform: scale(1.05);
}

.claimed-text {
    font-size: 12px;
    color: #10b981;
    font-weight: 500;
}

/* 成就統計 */
.achievement-stats {
    background: #f1f5f9;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    color: #475569;
    font-weight: 500;
}

/* 成就標籤頁 */
.achievement-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
}

.tab-btn {
    padding: 10px 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    background: #f8fafc;
}

.tab-btn.active {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border-color: transparent;
}

/* 成就網格 */
.achievements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
}

.achievement-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    gap: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
}

.achievement-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.achievement-card.locked {
    opacity: 0.6;
}

.achievement-icon {
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    position: relative;
    flex-shrink: 0;
}

.unlock-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    background: #10b981;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
}

.achievement-content {
    flex: 1;
}

.achievement-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.achievement-content p {
    font-size: 13px;
    color: #64748b;
    margin: 0 0 8px 0;
}

.unlock-date {
    font-size: 12px;
    color: #10b981;
}

.unlock-requirement {
    font-size: 12px;
    color: #f59e0b;
}

.achievement-points {
    display: flex;
    align-items: flex-start;
}

.points-badge {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

/* 排行榜 */
.period-select {
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #475569;
    background: white;
    cursor: pointer;
}

.period-select:focus {
    outline: none;
    border-color: #3b82f6;
}

.leaderboard-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow-x: auto;
}

.leaderboard-table {
    width: 100%;
    border-collapse: collapse;
}

.leaderboard-table thead {
    background: #f8fafc;
}

.leaderboard-table th {
    padding: 12px 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    border-bottom: 2px solid #e2e8f0;
}

.leaderboard-table td {
    padding: 12px 16px;
    font-size: 14px;
    color: #1e293b;
    border-bottom: 1px solid #f1f5f9;
}

.leaderboard-table tr:hover {
    background: #f8fafc;
}

.leaderboard-table tr.highlight {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
}

.rank-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #f1f5f9;
    color: #475569;
    border-radius: 50%;
    font-weight: 600;
    font-size: 14px;
}

.rank-badge.gold {
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: white;
}

.rank-badge.silver {
    background: linear-gradient(135deg, #cbd5e1, #94a3b8);
    color: white;
}

.rank-badge.bronze {
    background: linear-gradient(135deg, #f97316, #ea580c);
    color: white;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.user-avatar {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.user-name {
    font-weight: 500;
}

.level-badge-small {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}
</style>
