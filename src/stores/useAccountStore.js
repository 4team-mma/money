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
        const response = await api.get("/accounts/");

        //  確保回傳的是陣列，避免 .map 崩潰
        const data = Array.isArray(response) ? response : response.data || [];

        this.accounts = data.map((acc) => ({
          account_id: acc.account_id,
          itemName: acc.account_name, // 轉為前端統一的 itemName
          icon: acc.account_icon || "💰",
          account_type: acc.account_type,
          current_balance: acc.current_balance,
        }));
      } catch (err) {
        console.error("API 連線失敗:", err);
        this.accounts = []; //  API 壞了，就給空陣列
      } finally {
        this.loading = false;
      }
    },

    /**
     * 新增帳戶到資料庫
     * @param {Object} payload - 包含 account_name, account_icon 等資料的物件
     */
    async addAccount(payload) {
      try {
        await api.post("/accounts/", payload);
        await this.loadAccounts();
        return true;
      } catch (err) {
        console.error("新增帳戶到資料庫失敗:", err);
        return false;
      }
    },
    //刪除功能
    async deleteAccount(account_id) {
      try {
        await api.delete(`/accounts/${account_id}`);
        await this.loadAccounts(); // 刪除後刷新
        return true;
      } catch (err) {
        console.error("刪除失敗:", err);
        return false;
      }
    },
  },
});
