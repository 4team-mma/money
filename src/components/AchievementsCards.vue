<script setup>
import { ref, computed } from 'vue'

const activeTab = ref(0)
const cardSets = ref([
    {
        name: '理財初心者',
        group: 'SJ 守成組',
        collected: 2,
        total: 5,
        reward: '專屬金屬頭像框',
        // RARE 卡片預設 active 改為 false，需判斷 normalCards 是否全滿
        rareCard: { id: 1, name: '守護長老：金字塔貓', icon: '🏛️', unlocked: false },
        normalCards: [
            { id: 101, name: 'ESTJ 管理貓', active: true, icon: '📋' },
            { id: 102, name: 'ISTJ 檢查貓', active: true, icon: '🔍' },
            { id: 103, name: 'ESFJ 供應貓', active: false, icon: '🥐' },
            { id: 104, name: 'ISFJ 守護貓', active: false, icon: '🛡️' }
        ]
    },
    {
        name: '節流冒險者',
        group: 'NF 說故事組',
        collected: 1,
        total: 5,
        reward: '年度資產圖表',
        rareCard: { id: 2, name: '幻夢領袖: 獨角獸貓', icon: '🦄', unlocked: false },
        normalCards: [
            { id: 201, name: 'ENFJ 主角貓', active: true, icon: '🎭' },
            { id: 202, name: 'INFJ 提倡貓', active: false, icon: '🕯️' },
            { id: 203, name: 'ENFP 競選貓', active: false, icon: '📣' },
            { id: 204, name: 'INFP 調停貓', active: false, icon: '🎨' }
        ]
    },
    {
        name: '投資先鋒',
        group: 'SP 破局組',
        collected: 0,
        total: 5,
        reward: '複利計算器',
        rareCard: { id: 3, name: '戰神: 狂暴山貓', icon: '⚡', unlocked: false },
        normalCards: [
            { id: 301, name: 'ESTP 冒險貓', active: false, icon: '🏎️' },
            { id: 302, name: 'ISTP 鑒賞貓', active: false, icon: '🛠️' },
            { id: 303, name: 'ESFP 表演貓', active: false, icon: '✨' },
            { id: 304, name: 'ISFP 藝術貓', active: false, icon: '🖌️' }
        ]
    },
    {
        name: '財富領主',
        group: 'NT 造局組',
        collected: 0,
        total: 5,
        reward: '自定義主題',
        rareCard: { id: 4, name: '永恆智者: 宇宙貓', icon: '🪐', unlocked: false },
        normalCards: [
            { id: 401, name: 'ENTJ 指揮貓', active: false, icon: '👑' },
            { id: 402, name: 'INTJ 策劃貓', active: false, icon: '♟️' },
            { id: 403, name: 'ENTP 發明貓', active: false, icon: '💡' },
            { id: 404, name: 'INTP 邏輯貓', active: false, icon: '🧪' }
        ]
    }
])

// --- 邏輯修正：判斷普通卡是否全滿來解鎖 RARE ---
const isRareUnlocked = computed(() => {
    const currentSet = cardSets.value[activeTab.value]
    // 檢查所有普通卡是否 active 皆為 true
    return currentSet.normalCards.every(card => card.active)
})
</script>

<template>
    <div class="ach-card-container">
        <div class="card-header">
            <div class="header-main">
                <h2>🃏 卡片收集進度</h2>
                <span class="group-badge">{{ cardSets[activeTab].group }}</span>
            </div>
        </div>

        <div class="card-tabs-nav">
            <button v-for="(set, i) in cardSets" :key="i" @click="activeTab = i" :class="{ active: activeTab === i }">
                {{ set.name }}
            </button>
        </div>

        <div class="card-content-wrapper" v-if="cardSets[activeTab]">
            <div class="meta-status">
                <span>已點亮人格: <strong>{{cardSets[activeTab].normalCards.filter(c => c.active).length}} /
                        4</strong></span>
                <span class="reward-hint">🎁 最終獎勵：{{ cardSets[activeTab].reward }}</span>
            </div>

            <div class="card-visual-layout">
                <div class="rare-card-box" :class="{ active: isRareUnlocked }">
                    <span class="rare-tag">RARE</span>
                    <div class="card-inner">
                        <span class="rare-icon">{{ isRareUnlocked ? cardSets[activeTab].rareCard.icon : '❓' }}</span>
                        <p class="rare-name">{{ isRareUnlocked ? cardSets[activeTab].rareCard.name : '收齊四名人格解鎖' }}</p>
                    </div>
                    <div v-if="!isRareUnlocked" class="lock-overlay">🔒</div>
                </div>

                <div class="normal-cards-grid">
                    <div v-for="card in cardSets[activeTab].normalCards" :key="card.id" class="normal-slot"
                        :class="{ active: card.active }">
                        <div class="small-card-content">
                            <span class="small-icon">{{ card.active ? card.icon : '🔒' }}</span>
                            <p class="small-name">{{ card.active ? card.name.split(' ')[0] : '???' }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* 繼承你之前的 CSS，加入一些優化 */
.ach-card-container {
    background: white;
    padding: 2rem;
    border-radius: 2rem;
    border: 1px solid #eef2f6;
    width: 100%;
    box-sizing: border-box;
}

.header-main {
    display: flex;
    align-items: center;
    gap: 15px;
}

.group-badge {
    background: #f0f7ff;
    color: #3b82f6;
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: bold;
}

.card-tabs-nav {
    display: flex;
    gap: 8px;
    margin-bottom: 1.5rem;
    overflow-x: auto;
}

.card-tabs-nav button {
    padding: 0.5rem 1rem;
    border-radius: 2rem;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: 0.3s;
}

.card-tabs-nav button.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.meta-status {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    color: #64748b;
}

.card-visual-layout {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 20px;
    width: 100%;
}

.rare-card-box {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    aspect-ratio: 3 / 4;
    min-width: 0;
    overflow: hidden;
}

.rare-card-box.active {
    border-color: #f59e0b;
    background: linear-gradient(135deg, #fff9eb 0%, #fff 100%);
    box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2);
}

.lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
}

.rare-tag {
    position: absolute;
    top: 15px;
    left: 20px;
    font-weight: 800;
    color: #f59e0b;
    font-size: 1rem;
}

.rare-icon {
    font-size: clamp(3rem, 6vw, 6rem);
    transition: 0.5s;
}

.rare-card-box.active .rare-icon {
    transform: scale(1.1);
}

.rare-name {
    font-weight: bold;
    margin-top: 15px;
    font-size: 0.9rem;
    color: #475569;
    text-align: center;
    padding: 0 10px;
}

.normal-cards-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.normal-slot {
    background: #f1f5f9;
    border-radius: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 3 / 4;
    transition: 0.3s;
}

.normal-slot.active {
    background: white;
    border: 1px solid #3b82f6;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.1);
}

.small-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.small-icon {
    font-size: 1.5rem;
}

.small-name {
    font-size: 0.7rem;
    font-weight: bold;
    color: #64748b;
}
</style>