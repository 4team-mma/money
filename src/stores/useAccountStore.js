// stores/useAccountStore.js
import { defineStore } from "pinia";
import api from "@/api";

export const useAccountStore = defineStore("account", {
  state: () => ({
    accounts: [],
    loading: false,
  }),

  actions: {
    //🌟 引用餘額的內容使用formatAccountBalance
    // 如果根本沒選帳戶，回傳提示
      formatAccountBalance(selectedAccount) {
        if (!selectedAccount) return "請選擇帳戶";

        // 1. 🌟 不管是物件還是 ID，我們都只要拿它的 "ID"
        const targetId = typeof selectedAccount === "object" 
          ? selectedAccount.account_id 
          : selectedAccount;

        // 2. 🌟 永遠從 Store 的 accounts 清單（金庫原始資料）裡找
        // 這樣才能確保拿到 loadAccounts() 抓回來的最新 current_balance
        const goldAccount = this.accounts.find((acc) => acc.account_id == targetId);

        if (!goldAccount) return this.loading ? "讀取中..." : "NT$ 0";

        const balance = Math.floor(goldAccount.current_balance ?? 0);
        const currency = goldAccount.currency || "NT$";
        return `${currency} ${balance.toLocaleString()}`;
      }
    ,

    /**
     * 讀取帳戶列表
     */
    async loadAccounts() {
      this.loading = true;
      try {
        const response = await api.get("/accounts/");

        //  確保回傳的是陣列，避免 .map 崩潰
        const rawData =
          response?.data || (Array.isArray(response) ? response : []);

        this.accounts = rawData.map((acc) => ({
          account_id: acc.account_id,
          itemName: acc.account_name,
          icon: acc.account_icon || "💰",
          account_type: acc.account_type,
          currency: acc.currency || "NT$",
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
