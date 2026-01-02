import { defineStore } from "pinia";
import axios from "axios";

const API_BASE_URL = 'http://localhost:8000';

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
     * 🌟 載入用戶：優先資料庫，失敗則回退本地
     */
    async loadUsers() {
      try {
        console.log("正在從資料庫獲取用戶名單...");
        const response = await axios.get(`${API_BASE_URL}/users/`);
        
        this.users = response.data.map(u => ({
          uid: u.user_id, // 資料庫原始 ID
          username: u.username,
          name: u.name,
          email: u.email,
          role: u.role,
          job: u.job || "一般用戶",
          statusText: "正常",
          totalSpent: u.totalSpent || (u.role === 'user' ? 45800 : 0), 
          transactions: u.transactions || (u.role === 'user' ? 15 : 0),
        }));
        
        console.log("資料庫載入成功！");
      } catch (err) {
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
     * 註銷用戶功能
     */
    async deleteUser(uid) {
      if (confirm('確定要註銷此用戶嗎？(此操作不可逆)')) {
        try {
          await axios.delete(`${API_BASE_URL}/users/${uid}`);
          await this.loadUsers(); 
          alert('用戶已從資料庫刪除');
        } catch (err) {
          this.users = this.users.filter((u) => u.uid !== uid);
          const updatedLocal = this.users.filter(u => u.role === 'user' && !['0000', '0001'].includes(u.uid));
          localStorage.setItem("mma_users", JSON.stringify(updatedLocal));
        }
      }
    },
  },
});