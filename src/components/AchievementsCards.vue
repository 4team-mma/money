<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCardCollection } from '@/api/gamification'

const activeTab = ref(0)
const rawCards = ref([])
const flippedState = ref({})
const isLoading = ref(true)

// 1. 定義 MBTI 靜態結構 (確保佔位)
const mbtiStructure = {
  'SJ': { rare: '守護長老', normals: ['ESTJ', 'ISTJ', 'ESFJ', 'ISFJ'] },
  'NF': { rare: '幻夢領袖', normals: ['ENFJ', 'INFJ', 'ENFP', 'INFP'] },
  'SP': { rare: '戰神', normals: ['ESTP', 'ISTP', 'ESFP', 'ISFP'] },
  'NT': { rare: '永恆智者', normals: ['ENTJ', 'INTJ', 'ENTP', 'INTP'] }
}

const groupsFull = { 'SJ': 'SJ 守成組', 'NF': 'NF 說故事組', 'SP': 'SP 破局組', 'NT': 'NT 造局組' }
const groupKeys = ['SJ', 'NF', 'SP', 'NT']

// 2. 取得 API 資料
onMounted(async () => {
  try {
    const res = await getCardCollection()
    // 防呆：無論回傳格式為何，都轉為陣列
    if (Array.isArray(res)) rawCards.value = res
    else if (res && Array.isArray(res.data)) rawCards.value = res.data
    else rawCards.value = []
  } catch (error) {
    console.error("卡牌API錯誤:", error)
    rawCards.value = []
  } finally {
    isLoading.value = false
  }
})

// 3. 資料整合
const cardSets = computed(() => {
  const names = { 'SJ': '理財初心者', 'NF': '節流冒險者', 'SP': '投資先鋒', 'NT': '財富領主' }
  const rewards = { 'SJ': '專屬金屬頭像框', 'NF': '年度資產圖表', 'SP': '複利計算器', 'NT': '自定義主題' }

  return groupKeys.map(group => {
    // 找出該組 API 資料
    const apiGroupCards = rawCards.value.filter(c => c.series_name === group)
    
    // --- 普通卡處理 ---
    const targetNormals = mbtiStructure[group].normals
    const normalCards = targetNormals.map(targetName => {
        // 比對 Title 是否包含檔名 (例如 "ESTJ")
        const found = apiGroupCards.find(c => c.title && c.title.includes(targetName))
        
        if (found) {
            // 已獲得：使用 API 的 image_url (後端已給完整網址)
            return { ...found, is_owned: true, displayTitle: found.title, image_url: found.image_url }
        } else {
            // 未獲得：佔位
            return { lib_id: `placeholder-${targetName}`, title: targetName, displayTitle: '???', is_owned: false, image_url: '' }
        }
    })

    // --- 稀有卡處理 ---
    const rareFront = apiGroupCards.find(c => c.title.includes('SP01'))
    const rareBack = apiGroupCards.find(c => c.title.includes('SP02'))
    const ownedCount = normalCards.filter(c => c.is_owned).length

    return {
      name: names[group],
      group: group,
      groupFull: groupsFull[group],
      reward: rewards[group],
      ownedCount: ownedCount,
      
      isRareOwned: !!rareFront,
      isRareReady: ownedCount === 4 && !rareFront,
      
      rareCard: {
        title: rareFront ? rareFront.description : mbtiStructure[group].rare,
        // 直接使用後端 URL，若無則預備拼接 (確保前端路徑正確)
        frontImg: rareFront ? rareFront.image_url : new URL(`../assets/images/${group}/${group}_SP01.png`, import.meta.url).href,
        backImg: rareBack ? rareBack.image_url : new URL(`../assets/images/${group}/${group}_SP02.png`, import.meta.url).href
      },
      normalCards: normalCards
    }
  })
})

const currentSet = computed(() => {
  if (cardSets.value.length > 0 && cardSets.value[activeTab.value]) {
    return cardSets.value[activeTab.value]
  }
  return null
})

const toggleFlip = (index) => {
  flippedState.value[index] = !flippedState.value[index]
}
</script>

<template>
  <div class="ach-card-container">
    <div class="card-header">
      <div class="header-main" v-if="currentSet">
        <h2>🃏 卡片收集進度</h2>
        <span class="group-badge">{{ currentSet.groupFull }}</span>
      </div>
    </div>

    <div class="card-tabs-nav" v-if="cardSets.length > 0">
      <button v-for="(set, i) in cardSets" :key="i" 
        @click="activeTab = i" :class="{ active: activeTab === i }">
        {{ set.name }}
      </button>
    </div>

    <div class="card-content-wrapper" v-if="!isLoading && currentSet">
      <div class="meta-status">
        <span>解鎖卡牌: <strong>{{ currentSet.ownedCount }} / 4</strong></span>
        <span class="reward-hint">🎁 {{ currentSet.reward }}</span>
      </div>
      
      <div class="card-visual-layout">
        
        <div class="rare-card-perspective" 
             @click="currentSet.isRareOwned && toggleFlip(activeTab)">
          
          <div class="rare-card-inner" :class="{ 'is-flipped': flippedState[activeTab] }">
            <div class="rare-face front">
              <span class="rare-tag">RARE</span>
              <div class="card-center-content">
                <img v-if="currentSet.isRareOwned" :src="currentSet.rareCard.frontImg" class="cat-main-img" />
                <div v-else-if="currentSet.isRareReady" class="mission-alert">
                   <span class="mission-icon">📜</span>
                   <p class="mission-text">特殊任務開啟！</p>
                </div>
                <div v-else class="lock-circle">
                   <span class="lock-icon">🔒</span>
                   <p class="lock-text">收齊 4 張解鎖</p>
                </div>
                <p v-if="currentSet.isRareOwned" class="rare-name">{{ currentSet.rareCard.title }}</p>
              </div>
            </div>

            <div class="rare-face back">
              <span class="rare-tag">INFO</span>
              <div class="card-center-content">
                <img :src="currentSet.rareCard.backImg" class="cat-main-img" />
                <p class="rare-desc">隱藏天賦已覺醒</p>
              </div>
            </div>
          </div>
        </div>

        <div class="normal-cards-grid">
          <div v-for="card in currentSet.normalCards" :key="card.lib_id" 
            class="normal-slot" :class="{ active: card.is_owned }">
            <div class="small-card-content">
              <img v-if="card.is_owned" :src="card.image_url" class="small-cat-img" />
              <div v-else class="small-lock-wrap">
                <span class="small-lock-icon">🔒</span>
                <p class="small-lock-name">???</p> 
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-else-if="isLoading" class="state-msg">載入中...</div>
  </div>
</template>

<style scoped>
.ach-card-container {
  background: white; padding: 2rem; border-radius: 2rem; border: 1px solid #eef2f6; width: 100%; box-sizing: border-box;
}

.header-main { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
.group-badge { background: #f0f7ff; color: #3b82f6; padding: 4px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: bold; }

.card-tabs-nav { display: flex; gap: 8px; margin-bottom: 1.5rem; overflow-x: auto; }
.card-tabs-nav button { padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; white-space: nowrap; }
.card-tabs-nav button.active { background: #3b82f6; color: white; border-color: #3b82f6; }

.meta-status { display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 0.85rem; color: #64748b; }

/* 核心佈局修正：鎖死 Grid 比例，防止溢出 */
.card-visual-layout { 
  display: grid; 
  grid-template-columns: 1.3fr 1fr; /* 左大右小 */
  gap: 15px; 
  width: 100%; 
}

/* 稀有卡 */
.rare-card-perspective { perspective: 1200px; aspect-ratio: 3 / 4; cursor: pointer; min-width: 0; }
.rare-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.8s; transform-style: preserve-3d; }
.rare-card-inner.is-flipped { transform: rotateY(180deg); }

.rare-face {
  position: absolute; inset: 0; backface-visibility: hidden; border-radius: 1.5rem; border: 2px solid #e2e8f0; background: #f8fafc;
  display: flex; justify-content: center; align-items: center; text-align: center;
}
.rare-face.back { transform: rotateY(180deg); background: #0f172a; color: white; }

.card-center-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; width: 100%; height: 100%; }
.cat-main-img { max-width: 90%; max-height: 80%; object-fit: contain; }

/* 普通卡網格：強制 2x2，並防止撐開 */
.normal-cards-grid { 
  display: grid; 
  grid-template-columns: repeat(2, 1fr); 
  grid-template-rows: repeat(2, 1fr);
  gap: 10px; 
  min-width: 0; /* 關鍵：防止內容撐破容器 */
}

.normal-slot {
  background: #f1f5f9; border-radius: 1rem; 
  aspect-ratio: 3 / 4; /* 鎖定 3:4 */
  display: flex; justify-content: center; align-items: center; 
  border: 1px solid transparent; min-width: 0;
}
.normal-slot.active { background: white; border: 1px solid #3b82f6; }

.small-card-content { display: flex; flex-direction: column; align-items: center; gap: 5px; width: 100%; }
.small-cat-img { width: 80%; height: 80%; object-fit: contain; }
.small-lock-wrap { text-align: center; color: #cbd5e1; }
.small-lock-icon { font-size: 1.5rem; }
.small-lock-name { font-size: 0.7rem; margin-top: 5px; }

.lock-circle { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #94a3b8; }
.lock-icon { font-size: 3rem; }
.lock-text { font-size: 0.9rem; }
.rare-tag { position: absolute; top: 15px; left: 20px; font-weight: 800; color: #f59e0b; font-size: 0.8rem; }
.state-msg { padding: 40px; text-align: center; color: #94a3b8; }
</style>