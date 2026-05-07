// src/api/tokenRadar.js
import api from '@/api'; // 引用你的 index.js (已包含攔截器)

const BASE = '/token-radar';

/**
 * 取得儀表板彙總數據
 * @param {Object} params - { date_range: 'today'|'week'|'month'|'all', provider?: string }
 */
export const getTokenRadarSummary = (params = {}) =>
    api.get(`${BASE}/summary`, { params });

/**
 * 取得詳細流水帳（分頁）
 * @param {Object} params - { page, limit, date_range, provider?, intent_type? }
 */
export const getTokenRadarLogs = (params = {}) =>
    api.get(`${BASE}/logs`, { params });