import { defineStore } from "pinia";
import api from "@/api";

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [],
    userInsights: [],
    selectedUser: null, // 當前查看的用戶
    loading: false,
    loadingDetail: false,
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

    // 🧪 自動產出帶有 T-xx 編號的測試帳號列表
    formattedTestUsers: (state) => {
      return state.users
        .filter((u) => u.role === "test")
        .map((u, index) => ({
          ...u,
          displayUid: `T-${(index + 1).toString().padStart(2, "0")}`,
        }));
    },

    // 📊 財富排行榜邏輯
    topUsers: (state) =>
      state.users
        .filter((u) => u.role === "user")
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
          status: u.status,
          job: u.job || (u.role === "admin" ? "管理員" : "一般用戶"),
          totalSpent: u.totalSpent || 0,
          transactions: u.transactions || 0,
          createdAt: u.created_at || null,
          lastLogin: u.last_login,
        }));
      } catch (err) {
        console.error("載入失敗:", err);
      } finally {
        this.loading = false;
      }
    },

    // 🔍 顯示詳情 Action
    async showUserDetails(uid) {
      this.loadingDetail = true;
      // 1. 先用列表現有資料墊底 (Optimistic UI)
      const quickFind = this.users.find((u) => u.uid === uid);
      if (quickFind) this.selectedUser = { ...quickFind };

      try {
        // 2. 抓取完整資料（例如註冊時間、地址等列表沒顯示的欄位）
        const fullData = await api.get(`/admin/users/${uid}`);
        this.selectedUser = { ...this.selectedUser, ...fullData };
      } catch (err) {
        console.error("抓取詳細資料失敗");
      } finally {
        this.loadingDetail = false;
      }
    },

    clearSelectedUser() {
      this.selectedUser = null;
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
      const currentUser = JSON.parse(
        localStorage.getItem("currentUser") || "{}",
      );

      // 防禦性判斷：如果不是管理員，直接進入本地模式，不發 API 請求
      if (currentUser.role !== "admin") {
        this.users = [
          {
            uid: currentUser.user_id || "0001",
            username: currentUser.username,
            name: currentUser.name || "測試者",
            email: currentUser.email,
            role: "user",
            job: currentUser.job || "小菜鳥",
          },
        ];
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

    

    // 手動加經驗值
    async adjustXP(uid, amount) {
      if (!uid || amount === undefined) return;

      try {
        const val = parseInt(amount);

        const response = await api.post(`/admin/users/${uid}/xp`, null, {
          params: { amount: val },
        });

        if (response && response) {
          const { new_xp, new_level } = response;

          // 更新本地狀態 (詳情視窗)
          if (this.selectedUser && this.selectedUser.uid === uid) {
            this.selectedUser.xp = new_xp;
            this.selectedUser.level = new_level;
          }

          // 更新主列表
          const user = this.users.find((u) => u.uid === uid);
          if (user) {
            user.xp = new_xp;
            user.level = new_level;
          }

          return response;
        }
      } catch (err) {
        console.error("❌ XP 調整失敗詳情:", {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
        });

        const errMsg = err.response?.data?.detail || "網路連線異常";
        alert(`調整失敗：${errMsg}`);
        throw err;
      }
    },

    // 發送系統通知(單一用戶通知)
    async sendNotification(uid, title, description) {
      try {
        const response = await api.post(`/admin/users/${uid}/notify`, null, {
          params: {
            title: title,
            description: description,
          },
        });
        return response; // 成功回傳
      } catch (err) {
        console.error("發送通知失敗:", err.response?.data);
        alert("發送失敗：" + (err.response?.data?.detail || "網路異常"));
        throw err;
      }
    },

    // 停用或恢復帳號
    async toggleUserStatus(uid) {
      try {
        // 發送 PATCH 請求到後端
        const response = await api.patch(`/admin/users/${uid}/block`);
        const newStatus = response.status;

        // 1. 更新全域用戶列表中的狀態
        const user = this.users.find((u) => u.uid === uid);
        if (user) user.status = newStatus;

        // 2. 如果詳情視窗開著，也同步更新
        if (this.selectedUser && this.selectedUser.uid === uid) {
          this.selectedUser.status = newStatus;
        }
      } catch (err) {
        alert("操作失敗，請檢查權限");
      }
    },

    /**
     * 註銷用戶功能
     */
    async deleteUser(uid) {
      if (
        !confirm("⚠️ 警告：這將永久刪除該用戶及其所有帳務資料，確定要註銷嗎？")
      )
        return;

      try {
        await api.delete(`/admin/users/${uid}`);

        // 成功後從本地 state 移除，不需重新 fetchUsers 以節省流量
        this.users = this.users.filter((u) => u.uid !== uid);
        alert("用戶已成功註銷");
      } catch (err) {
        console.error("刪除失敗:", err);
        alert(err.response?.data?.detail || "刪除失敗，請檢查權限");
      }
    },

    // 建立測試帳號
    async createTestAccount(data) {
      try {
        await api.post("/admin/users/test-account", null, {
          params: {
            username: data.username,
            email: data.email,
            password: data.password,
          },
        });
        // 成功後重新抓取列表，讓新帳號出現在畫面上
        await this.fetchUsers(0, 20);
        return true;
      } catch (err) {
        alert(err.response?.data?.detail || "建立失敗");
        return false;
      }
    },

    // 一鍵重置所有測試帳號數據
    async resetTestAccounts() {
      if (!confirm("⚠️ 警告：這將刪除所有測試帳號的記帳紀錄與點數，確定執行？"))
        return;
      try {
        const response = await api.post("/admin/users/test-accounts/reset");
        // 重置後重新抓取用戶列表，更新畫面的 XP 與等級顯示
        await this.fetchUsers(0, 50);
        alert(response.msg);
      } catch (err) {
        alert("重置失敗");
      }
    },

    // 隨機為測試帳號生成測試數據
    async generateTestData() {
      try {
        const response = await api.post(
          "/admin/users/test-accounts/generate-data",
        );
        await this.fetchUsers(0, 50); // 刷新列表看 XP 變化
        alert(response.msg);
      } catch (err) {
        alert("生成失敗");
      }
    },

    // 建立管理者
    async createAdmin(data) {
      try {
        await api.post("/admin/admins", null, {
          params: {
            username: data.username,
            email: data.email,
            password: data.password,
            name: data.name,
          },
        });
        // 重新獲取用戶列表，確保 adminFiltered 響應式更新
        await this.fetchUsers(0, 50);
        return true;
      } catch (err) {
        alert(err.response?.data?.detail || "建立失敗");
        return false;
      }
    },
    // 🌟 新增：獲取用戶行為分析與四力指標
    async fetchUserInsights() {
    this.loading = true;
    try {
        const response = await api.get("/admin/stats/rankings");
        // 🔍 在這裡印出來
        console.log("後端 200 回傳的原始資料：", response);

        // 如果 response 直接就是陣列
        if (Array.isArray(response)) {
            this.userInsights = response;
        }
        // 如果 response 是一個物件，裡面包著 user_insights
        else if (response && response.user_insights) {
            this.userInsights = response.user_insights;
        }
        console.log("存入 Store 後的資料：", this.userInsights);
    } catch (err) {
        console.error("雖然 200 但處理資料出錯:", err);
    } finally {
        this.loading = false;
    }
  },
  },
});
