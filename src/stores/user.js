import { defineStore } from "pinia";
import axios from "axios"; // 🌟 記得匯入 axios

const API_BASE_URL = 'http://localhost:8000';

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [],
  }),

  getters: {
    // 🌟 保持不變，但增加預設值保護防止報錯
    topUsers: (state) =>
      state.users
        .filter((u) => u.role !== "admin")
        .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
        .map((u) => ({
          ...u,
          avgSpent:
            (u.transactions || 0) > 0 ? Math.round((u.totalSpent || 0) / u.transactions) : 0,
        })),
  },

  actions: {
    normalizeRole(role) {
      if (role === "一般用戶") return "user";
      if (role === "管理者") return "admin";
      return role || "user";
    },

    /**
     * 🌟 修改為非同步版本：優先讀取資料庫
     */
    async loadUsers() {
      try {
        console.log("正在從資料庫獲取用戶名單...");
        const response = await axios.get(`${API_BASE_URL}/users/`);
        
        // 1. 真修：將資料庫欄位映射到前端需要的格式 (如 user_id -> uid)
        this.users = response.data.map(u => ({
          uid: u.user_id, //  這裡將後端的 user_id 轉為前端習慣的 uid
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          job: u.job || "一般用戶", // 
          statusText: "正常",
          // 以下資料庫目前可能還沒有，我們先給測試值
          totalSpent: u.totalSpent || (u.role === 'user' ? 45800 : 0), 
          transactions: u.transactions || (u.role === 'user' ? 15 : 0),
        }));
        
        console.log("資料庫載入成功！");
      } catch (err) {
        // 2. 備援：API 失敗時，回退到你原本的測試帳號與 LocalStorage
        console.warn("API 連線失敗，啟動本地備援模式");
        
        const defaultAccount = [
          {
            uid: "0001",
            username: "user",
            name: "測試者",
            email: "mma.save.money@gmail.com",
            role: "user",
            job: "小菜鳥",
            totalSpent: 45800,
            transactions: 15,
            statusText: "正常",
          },
        ];

        const registeredUser = JSON.parse(localStorage.getItem("mma_users") || "[]");

        this.users = [
          ...defaultAccount,
          ...registeredUser.map((u, idx) => ({
            uid: u.uid || String(idx + 2).padStart(4, "0"),
            username: u.username || u.email.split('@')[0],
            name: u.name || "未命名用戶",
            email: u.email,
            role: this.normalizeRole(u.role),
            totalSpent: u.totalSpent || 0,
            transactions: u.transactions || 0,
            statusText: "正常",
          })),
        ];
      }
    },

    /**
     * 🌟 註銷功能也建議未來可以「真刪」資料庫
     */
    async deleteUser(uid) {
      if (confirm('確定要註銷此用戶嗎？(此操作不可逆)')) {
        try {
          // 如果是資料庫的 UID (數字字串)，則呼叫 API 刪除 (假設路徑是 DELETE /users/{id})
          await axios.delete(`${API_BASE_URL}/users/${uid}`);
          await this.loadUsers(); // 重新整理列表
          alert('用戶已從資料庫刪除');
        } catch (err) {
          // 如果 API 失敗，僅在本地過濾 (你原本的邏輯)
          this.users = this.users.filter((u) => u.uid !== uid);
          const updatedLocal = this.users.filter(u => u.role === 'user' && !['0000', '0001'].includes(u.uid));
          localStorage.setItem("mma_users", JSON.stringify(updatedLocal));
        }
      }
    },
  },
});