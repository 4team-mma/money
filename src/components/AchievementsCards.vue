<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCardCollection } from '@/api/gamification'

const activeTab = ref(0)
const rawCards = ref([])
const isLoading = ref(true)

// 放大預覽與翻轉控制
const selectedPreview = ref(null)
const isFlipped = ref(false) 

const mbtiStructure = {
  'SJ': { rare: '守護長老', normals: ['ESTJ', 'ISTJ', 'ESFJ', 'ISFJ'] },
  'NF': { rare: '幻夢領袖', normals: ['ENFJ', 'INFJ', 'ENFP', 'INFP'] },
  'SP': { rare: '戰神', normals: ['ESTP', 'ISTP', 'ESFP', 'ISFP'] },
  'NT': { rare: '永恆智者', normals: ['ENTJ', 'INTJ', 'ENTP', 'INTP'] }
}
const groupKeys = ['SJ', 'NF', 'SP', 'NT']

const fetchCollection = async () => {
  try {
    isLoading.value = true
    const res = await getCardCollection()
    rawCards.value = Array.isArray(res) ? res : (res.data || [])
  } catch (error) {
    console.error("卡牌API錯誤:", error)
  } finally {
    isLoading.value = false
  }
}

defineExpose({ fetchCollection })

onMounted(fetchCollection)

const cardSets = computed(() => {
  const names = { 'SJ': '理財初心者', 'NF': '節流冒險者', 'SP': '投資先鋒', 'NT': '財富領主' }
  const rewards = { 'SJ': '解鎖特殊主題', 'NF': '年度報表', 'SP': '特殊背景A', 'NT': '特殊背景B' }

  return groupKeys.map(group => {
    const apiGroupCards = rawCards.value.filter(c => c.category === group)
    const targetNormals = mbtiStructure[group].normals
    const normalCards = targetNormals.map(targetName => {
        const found = apiGroupCards.find(c => c.title.includes(targetName))
        return (found && found.is_owned) ? { ...found, is_owned: true } : { lib_id: `lock-${targetName}`, is_owned: false }
    })

    const rareItem = apiGroupCards.find(c => c.difficulty === 'RARE')
    const ownedCount = normalCards.filter(c => c.is_owned).length

    return {
      name: names[group],
      group: group,
      reward: rewards[group],
      ownedCount: ownedCount,
      isRareOwned: !!(rareItem && rareItem.is_owned),
      rareCard: {
        title: (rareItem && rareItem.is_owned) ? rareItem.title : mbtiStructure[group].rare,
        frontImg: (rareItem && rareItem.is_owned) ? rareItem.image_url : null,
        data: (rareItem && rareItem.is_owned) ? rareItem : null
      },
      normalCards: normalCards
    }
  })
})

const currentSet = computed(() => cardSets.value[activeTab.value] || null)

// 計算背面圖片 URL
const getBackImgUrl = (frontUrl) => {
    if (!frontUrl) return '';
    return frontUrl.replace('SP01', 'SP02');
}

// 點擊放大邏輯
const openPreview = (card) => {
    if (card && card.is_owned) {
        selectedPreview.value = card
        isFlipped.value = false 
    }
}
const closePreview = () => {
    selectedPreview.value = null
    isFlipped.value = false
}
</script>

<template>
  <div class="ach-card-container">
    <div class="card-tabs-nav">
      <button v-for="(set, i) in cardSets" :key="i" @click="activeTab = i" :class="{ active: activeTab === i }">
        {{ set.name }}
      </button>
    </div>

    <div class="card-content-wrapper" v-if="!isLoading && currentSet">
      <div class="card-visual-layout">
        <div class="rare-card-perspective" @click="openPreview(currentSet.rareCard.data)">
            <div class="rare-face front" :class="{ 'tech-rare-face': currentSet.isRareOwned }">
              <div class="card-center-content">
                <img v-if="currentSet.isRareOwned" :src="currentSet.rareCard.frontImg" class="cat-main-img" />
                <div v-else class="lock-circle">
                   <span class="lock-icon">🔒</span>
                   <p class="lock-text">收齊 4 張一般卡解鎖</p>
                </div>
              </div>
              <template v-if="currentSet.isRareOwned">
                <div class="tech-laser-beam"></div>
                <div class="tech-scan-bar"></div>
              </template>
            </div>
        </div>

        <div class="normal-cards-grid">
          <div v-for="card in currentSet.normalCards" :key="card.lib_id" 
            class="normal-slot" :class="{ active: card.is_owned }" @click="openPreview(card)">
            <div class="small-card-content">
              <img v-if="card.is_owned" :src="card.image_url" class="small-cat-img" />
              <span v-else class="small-lock-icon">🔒</span>
              <div v-if="card.is_owned" class="laser-shine-small"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="zoom">
        <div v-if="selectedPreview" class="modal-overlay-global" @click="closePreview">
          <div class="big-card-container" @click.stop>
            
            <div class="flip-card-scene" @click="isFlipped = !isFlipped">
              <div class="flip-card-inner" :class="{ 'is-flipped': isFlipped }">
                
                <div class="preview-card-body flip-face-front" 
                     :class="{ 'tech-rare-modal': selectedPreview.difficulty === 'RARE', 'rare-glow': selectedPreview.difficulty === 'RARE' }">
                    <div class="preview-img-wrap">
                        <img :src="selectedPreview.image_url" class="full-card-img" />
                        <template v-if="selectedPreview.difficulty === 'RARE'">
                            <div class="tech-laser-beam"></div>
                            <div class="tech-scan-bar"></div>
                        </template>
                        <div v-else class="card-holo-layer"></div>
                    </div>
                    <div class="card-text-content">
                        <h3>{{ selectedPreview.title }}</h3>
                        <p>{{ selectedPreview.description }}</p>
                    </div>
                </div>

                <div class="preview-card-body flip-face-back" 
                     :class="{ 'tech-rare-modal': selectedPreview.difficulty === 'RARE', 'rare-glow': selectedPreview.difficulty === 'RARE' }">
                    <div class="preview-img-wrap">
                        <img :src="selectedPreview.difficulty === 'RARE' ? getBackImgUrl(selectedPreview.image_url) : selectedPreview.image_url" class="full-card-img" />
                        <div v-if="selectedPreview.difficulty === 'RARE'" class="tech-purple-render"></div>
                        <template v-if="selectedPreview.difficulty === 'RARE'">
                            <div class="tech-laser-beam" style="animation-delay: -2s;"></div>
                        </template>
                    </div>
                    <div class="card-text-content">
                        <h3>{{ selectedPreview.title }}</h3>
                        <p>{{ selectedPreview.description }}</p>
                    </div>
                </div>

              </div>
            </div>
            
            <button class="top-right-close" @click="closePreview">✕</button>
            <p class="flip-hint">💡 點擊卡片翻轉查看詳細能力</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* 基礎樣式 */
.ach-card-container { background: white; padding: 2rem; border-radius: 2rem; border: 1px solid #eef2f6; width: 100%; box-sizing: border-box; }
.card-tabs-nav { display: flex; gap: 8px; margin-bottom: 1.5rem; }
.card-tabs-nav button { padding: 0.5rem 1rem; border-radius: 2rem; border: 1px solid #e2e8f0; background: #f8fafc; cursor: pointer; white-space: nowrap; }
.card-tabs-nav button.active { background: #3b82f6; color: white; border-color: #3b82f6; }
.card-visual-layout { display: grid; grid-template-columns: 1.3fr 1fr; gap: 15px; width: 100%; }
.rare-card-perspective { perspective: 1200px; aspect-ratio: 3 / 4; cursor: pointer; }
.rare-face { position: relative; width: 100%; height: 100%; border-radius: 1.5rem; border: 2px solid #e2e8f0; background: #f8fafc; overflow: hidden; display: flex; justify-content: center; align-items: center; }
.cat-main-img { max-width: 90%; max-height: 80%; object-fit: contain; z-index: 5; }
.normal-cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.normal-slot { background: #f1f5f9; border-radius: 1rem; aspect-ratio: 3 / 4; display: flex; justify-content: center; align-items: center; cursor: pointer; overflow: hidden; position: relative; }
.normal-slot.active { background: white; border: 1px solid #3b82f6; }
.small-cat-img { width: 80%; height: 80%; object-fit: contain; }

/* 🌟 特殊卡科技感 */
.tech-rare-face {
  background: radial-gradient(circle at center, #2d1b4e 0%, #0f0a1f 100%) !important;
  border-color: #a855f7 !important;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), inset 0 0 15px rgba(168, 85, 247, 0.2) !important;
}

.tech-laser-beam {
  position: absolute; top: -100%; left: -100%; width: 300%; height: 300%;
  background: linear-gradient(135deg, transparent 45%, rgba(255, 255, 255, 0.9) 50%, transparent 55%);
  mix-blend-mode: overlay; animation: techLaserSweep 4s infinite linear; z-index: 10; pointer-events: none;
}

.tech-scan-bar {
  position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: rgba(168, 85, 247, 0.8);
  box-shadow: 0 0 15px #a855f7; animation: techScanMove 5s infinite ease-in-out; z-index: 11; opacity: 0.6;
}

@keyframes techLaserSweep { 0% { transform: translate(-10%, -10%); } 100% { transform: translate(30%, 30%); } }
@keyframes techScanMove { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }

.laser-shine-small { position: absolute; inset: 0; background-size: 200% 200%; animation: shine 5s infinite; }
@keyframes shine { 0% { background-position: -200% -200%; } 100% { background-position: 200% 200%; } }

/* 🌟 3D 翻轉容器：修正高度被遮住問題 */
.flip-card-scene {
  width: 420px; 
  height: 600px; /* 增加高度防止文字被切掉 */
  perspective: 1500px; 
  cursor: pointer;
}

.flip-card-inner {
  position: relative; width: 100%; height: 100%;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.flip-card-inner.is-flipped { transform: rotateY(180deg); }

.flip-face-front, .flip-face-back {
  position: absolute; width: 100%; height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 24px; overflow: hidden;
  display: flex; flex-direction: column; /* 讓文字靠下排列 */
}

.flip-face-back { transform: rotateY(180deg); }

/* 🌟 背面紫色渲染層 */
.tech-purple-render {
  position: absolute; inset: 0;
  background: radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, rgba(15, 10, 31, 0.6) 100%);
  mix-blend-mode: multiply;
  z-index: 3;
}

/* Modal 基礎樣式修正 */
.modal-overlay-global {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.92); backdrop-filter: blur(15px);
  display: flex; align-items: center; justify-content: center; z-index: 10000;
}

.preview-card-body {
  flex: 1; display: flex; flex-direction: column;
  background: #1e293b; box-shadow: 0 0 50px rgba(0,0,0,0.5);
}

.tech-rare-modal { background: #0f0a1f !important; border: 3px solid #a855f7 !important; }
.rare-glow { box-shadow: 0 0 80px rgba(168, 85, 247, 0.4) !important; }

/* 🌟 限制圖片高度，確保描述區塊有足夠空間 */
.preview-img-wrap {
  flex: 3; /* 圖片佔大部分比例 */
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.full-card-img { max-height: 100%; max-width: 100%; object-fit: contain; z-index: 2; position: relative; }

/* 文字內容區塊 */
.card-text-content { 
  flex: 1; /* 自動適應剩下的空間 */
  padding: 20px; background: rgba(15, 23, 42, 0.95); 
  color: white; border-top: 1px solid rgba(255,255,255,0.1); 
  z-index: 5;
}
.card-text-content h3 { margin: 0 0 8px 0; font-size: 1.4rem; color: #f8fafc; }
.card-text-content p { margin: 0; font-size: 0.9rem; color: #94a3b8; line-height: 1.5; }

.top-right-close { position: absolute; top: -45px; right: -10px; color: white; background: none; border: none; font-size: 2.5rem; cursor: pointer; z-index: 101; }
.flip-hint { position: absolute; bottom: -45px; width: 100%; text-align: center; color: #a855f7; font-weight: bold; font-size: 1rem; text-shadow: 0 0 10px rgba(168,85,247,0.5); }

/* 普通預覽雷射特效 */
.card-holo-layer {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,0,0,0.1) 0%, rgba(0,255,0,0.1) 25%, rgba(0,0,255,0.1) 50%, rgba(255,255,0,0.1) 75%, rgba(255,0,0,0.1) 100%);
  mix-blend-mode: color-dodge; background-size: 400% 400%; animation: holoMove 6s infinite linear; opacity: 0.6;
}
@keyframes holoMove { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }

.zoom-enter-active, .zoom-leave-active { transition: all 0.4s ease; }
.zoom-enter-from, .zoom-leave-to { opacity: 0; transform: scale(0.8); }
.lock-icon { display: flex; justify-content: center; }
.small-card-content { display: flex; justify-content: center; }
.card-center-content{
  display: flex; justify-content: center;
}
</style>