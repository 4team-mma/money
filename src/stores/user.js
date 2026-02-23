import { defineStore } from "pinia";
import api from "@/api";

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [],
  }),

  getters: {
    // 🛡️ 自動產出帶有 A-xx 編號的管理員列表
    formattedAdmins: (state) => {
      return state.users
        .filter((u) => u.role === "admin")
        .map((u, index) => ({
          ...u,
          // 生成 A-01, A-02 格式
          displayUid: `A-${(index + 1).toString().padStart(2, "0")}`,
        }));
    },

    // 👤 自動產出帶有 U-xx 編號的一般用戶列表
    formattedNormalUsers: (state) => {
      return state.users
        .filter((u) => u.role === "user")
        .map((u, index) => ({
          ...u,
          // 生成 U-01, U-02 格式
          displayUid: `U-${(index + 1).toString().padStart(2, "0")}`,
        }));
    },

    // 📊 財富排行榜邏輯
    topUsers: (state) =>
      state.users
        .filter((u) => u.role !== "admin")
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .map((u) => ({
          ...u,
          avgSpent:
            (u.transactions || 0) > 0
              ? Math.round((u.totalSpent || 0) / u.transactions)
              : 0,
        })),
  },

  actions: {
    // 支援分頁的獲取用戶函式
    async fetchUsers(skip = 0, limit = 20) {
      this.loading = true;
      try {
        // 向 API 發送 skip 和 limit 參數
        const response = await api.get(
          `/admin/users?skip=${skip}&limit=${limit}`,
        );

        this.users = response.map((u) => ({
          uid: u.user_id,
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          job: u.job || "一般用戶",
          totalSpent: u.totalSpent || 0,
          transactions: u.transactions || 0,
        }));
      } catch (err) {
        console.error("載入失敗:", err);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 🌟 載入用戶：優先資料庫，失敗則回退本地
     */
    async loadUsers() {
      // 🛡️ 避免重複載入：如果 users 已經有資料，就不再抓取
      if (this.users.length > 0) {
        return; 
      }

      // 1. 先抓出目前登入者的資訊
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

      // 防禦性判斷：如果不是管理員，直接進入本地模式，不發 API 請求
      if (currentUser.role !== 'admin') {
        this.users = [{
          uid: currentUser.user_id || '0001',
          username: currentUser.username,
          name: currentUser.name || '測試者',
          email: currentUser.email,
          role: 'user',
          job: currentUser.job || '小菜鳥'
        }];
        return; // 直接結束，就不會觸發 api.get 導致 403
      }

      // 如果是管理員，才執行原本的 API 請求
      try {
        const response = await api.get("/users/");
        this.users = response.map(u => ({
          uid: u.user_id, // 資料庫原始 ID
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          job: u.job || "一般用戶",
          statusText: "正常",
          totalSpent: u.totalSpent || (u.role === "user" ? 45800 : 0),
          transactions: u.transactions || (u.role === "user" ? 15 : 0),
        }));
      } catch (err) {
        // 這裡的 catch 留著處理網路連線等其他錯誤
        this.useLocalFallback(); 
      }
    },

    /**
     * 註銷用戶功能
     */
    async deleteUser(uid) {
      if (confirm("確定要註銷此用戶嗎？(此操作不可逆)")) {
        try {
          await api.delete(`/users/${uid}`);
          await this.loadUsers();
          alert("用戶已從資料庫刪除");
        } catch (err) {
          this.users = this.users.filter((u) => u.uid !== uid);
          const updatedLocal = this.users.filter(
            (u) => u.role === "user" && !["0000", "0001"].includes(u.uid),
          );
          localStorage.setItem("mma_users", JSON.stringify(updatedLocal));
        }
      }
    },
  },
});
