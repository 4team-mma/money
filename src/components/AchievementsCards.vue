<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCardCollection } from '@/api/gamification'

const activeTab = ref(0)
const rawCards = ref([])
const flippedState = ref({})
const isLoading = ref(true)

const mbtiStructure = {
  'SJ': { rare: '守護長老', normals: ['ESTJ', 'ISTJ', 'ESFJ', 'ISFJ'] },
  'NF': { rare: '幻夢領袖', normals: ['ENFJ', 'INFJ', 'ENFP', 'INFP'] },
  'SP': { rare: '戰神', normals: ['ESTP', 'ISTP', 'ESFP', 'ISFP'] },
  'NT': { rare: '永恆智者', normals: ['ENTJ', 'INTJ', 'ENTP', 'INTP'] }
}

const groupKeys = ['SJ', 'NF', 'SP', 'NT']

onMounted(async () => {
  try {
    isLoading.value = true
    const res = await getCardCollection()
    // Axios 攔截器若已處理 data，則 res 即為陣列
    rawCards.value = Array.isArray(res) ? res : (res.data || [])
  } catch (error) {
    console.error("卡牌API錯誤:", error)
  } finally {
    isLoading.value = false
  }
})

const cardSets = computed(() => {
  const names = { 'SJ': '理財初心者', 'NF': '節流冒險者', 'SP': '投資先鋒', 'NT': '財富領主' }
  const rewards = { 'SJ': '解鎖特殊主題背景1', 'NF': '年度資產圖表', 'SP': '解鎖特殊主題背景2', 'NT': '解鎖特殊主題背景3' }

  return groupKeys.map(group => {
    // 🌟 修正點 1：使用 category 進行篩選
    const apiGroupCards = rawCards.value.filter(c => c.category === group)
    
    // --- 普通卡處理 ---
    const targetNormals = mbtiStructure[group].normals
    const normalCards = targetNormals.map(targetName => {
        // 🌟 修正點 2：使用 includes 模糊匹配 "ENTP 發明貓" 裡的 "ENTP"
        const found = apiGroupCards.find(c => c.title.includes(targetName))
        if (found && found.is_owned) {
            return { ...found, is_owned: true }
        } else {
            return { lib_id: `lock-${targetName}`, is_owned: false, displayTitle: '???' }
        }
    })

    // --- 稀有卡處理 ---
    // 🌟 修正點 3：改用難度 RARE 且標題包含特定關鍵字或圖片包含 SP01
    const rareFront = apiGroupCards.find(c => c.difficulty === 'RARE')
    const ownedCount = normalCards.filter(c => c.is_owned).length

    return {
      name: names[group],
      group: group,
      reward: rewards[group],
      ownedCount: ownedCount,
      isRareOwned: !!(rareFront && rareFront.is_owned),
      isRareReady: ownedCount === 4 && !(rareFront && rareFront.is_owned),
      rareCard: {
        title: (rareFront && rareFront.is_owned) ? rareFront.title : mbtiStructure[group].rare,
        frontImg: (rareFront && rareFront.is_owned) ? rareFront.image_url : null
      },
      normalCards: normalCards
    }
  })
})

const currentSet = computed(() => cardSets.value[activeTab.value] || null)

const toggleFlip = (index) => { flippedState.value[index] = !flippedState.value[index] }
</script>

<template>
  <div class="ach-card-container">
    <div class="card-tabs-nav">
      <button v-for="(set, i) in cardSets" :key="i" 
        @click="activeTab = i" :class="{ active: activeTab === i }">
        {{ set.name }}
      </button>
    </div>

    <div class="card-content-wrapper" v-if="!isLoading && currentSet">
      <div class="meta-status">
        <span>解鎖進度: <strong>{{ currentSet.ownedCount }} / 4</strong></span>
      </div>
      
      <div class="card-visual-layout">
        <div class="rare-card-perspective">
            <div class="rare-face front">
              <div class="card-center-content">
                <img v-if="currentSet.isRareOwned" :src="currentSet.rareCard.frontImg" class="cat-main-img" />
                <div v-else class="lock-circle">
                   <span class="lock-icon">🔒</span>
                   <p class="lock-text">{{ currentSet.isRareReady ? '特殊任務待完成' : '收齊 4 張一般卡解鎖' }}</p>
                </div>
              </div>
            </div>
        </div>

        <div class="normal-cards-grid">
          <div v-for="card in currentSet.normalCards" :key="card.lib_id" 
            class="normal-slot" :class="{ active: card.is_owned }">
            <div class="small-card-content">
              <img v-if="card.is_owned" :src="card.image_url" class="small-cat-img" />
              <span v-else class="small-lock-icon">🔒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.cat-main-img, .small-cat-img { object-fit: contain; width: 100%; height: 100%; border-radius: 1rem; }
.normal-slot.active { background: #fff; border: 2px solid #3b82f6; box-shadow: 0 4px 12px rgba(59,130,246,0.1); }
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