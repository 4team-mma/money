// stores/useAccountStore.js
import { defineStore } from "pinia";
import api from "@/api";

export const useAccountStore = defineStore("account", {
  state: () => ({
    accounts: [],
    loading: false,
  }),

  actions: {
    /**
     * 讀取帳戶列表
     */
    async loadAccounts() {
      this.loading = true;
      try {
        const response = await api.get('/accounts/');
        
        // 🛡️ 確保回傳的是陣列，避免 .map 崩潰
        const data = Array.isArray(response) ? response : (response.data || []);

        this.accounts = data.map(acc => ({
          account_id: acc.account_id,
          itemName: acc.account_name, // 轉為前端統一的 itemName
          icon: acc.icon_id || "💰",
          account_type: acc.account_type,
          current_balance: acc.current_balance
        }));
      } catch (err) {
        console.warn("API 連線失敗，啟動本地備援:", err);
        this.accounts = [
          { account_id: 1, itemName: '銀行', icon: '🏦' },
          { account_id: 2, itemName: '現金', icon: '💰' }
        ];
      } finally {
        this.loading = false;
      }
    },

    /**
     * 新增帳戶到資料庫
     * @param {Object} payload - 包含 account_name, icon_id 等資料的物件
     */
    async addAccount(payload) {
      try {
        await api.post('/accounts/', payload);
        await this.loadAccounts(); // 新增後刷新列表，確保拿到真實的 account_id
        return true;
      } catch (err) {
        console.error("新增帳戶到資料庫失敗:", err);
        return false;
      }
    }
  }
});