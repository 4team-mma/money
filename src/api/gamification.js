// src/api/gamification.js
import api from '@/api'; // 引用統一的 axios 實例

// ==================== 每日簽到 (Checkin) ====================

/**
 * 執行每日簽到
 * @returns {Promise} 回傳簽到結果與獎勵
 */
export const checkinAction = () => {
  return api.post('/game/checkin/action');
};

/**
 * 查詢簽到狀態 (是否已簽、連續天數)
 * @returns {Promise}
 */
export const getCheckinStatus = () => {
  return api.get('/game/checkin/status');
};

// ==================== 每日任務 (Missions) ====================

/**
 * 獲取今日任務列表
 * @returns {Promise} 任務陣列
 */
export const getDailyMissions = () => {
  return api.get('/game/missions/today');
};

/**
 * 領取任務獎勵
 * @param {Number} missId - 任務 ID
 */
export const claimMissionReward = (missId) => {
  return api.post(`/game/missions/${missId}/claim`);
};

// ==================== 成就與卡牌 (Cards) ====================

/**
 * 獲取卡牌與成就圖鑑
 * @returns {Promise} 圖鑑列表
 */
export const getCardCollection = () => {
  return api.get('/game/cards/collection');
};

// ==================== 玩家摘要 (Summary) ====================

/**
 * 獲取玩家摘要資訊 (用於 Header 顯示等級、XP)
 */
export const getGameSummary = () => {
  return api.get('/game/summary/info');
};