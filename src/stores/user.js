import { defineStore } from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    users: [],
  }),

  getters: {
    topUsers: (state) =>
      state.users
        .filter((u) => u.role !== "admin")
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .map((u) => ({
          ...u,
          avgSpent:
            u.transactions > 0 ? Math.round(u.totalSpent / u.transactions) : 0,
        })),
  },

  actions: {
    normalizeRole(role) {
      if (role === "一般用戶") return "user";
      if (role === "管理者") return "admin";
      return role || "user";
    },

loadUsers() {
  // 1. 修正測試帳號：將帳號與信箱分開
  const defaultAccount = [
    {
      uid: "0001",
      username: "user",              // 這是帳號
      name: "測試者",                 // 這是顯示名稱
      email: "mma.save.money@gmail.com", // 這是真實信箱
      role: "user",
      totalSpent: 45800,
      transactions: 15,
      statusText: "正常",
    },
  ];

  const registeredUser = JSON.parse(
    localStorage.getItem("mma_users") || "[]"
  );

  // 2. 合併資料時，確保註冊的使用者也有 username
  this.users = [
    ...defaultAccount,
    ...registeredUser.map((u, idx) => ({
      uid: u.uid || String(idx + 2).padStart(4, "0"),
      username: u.username || u.email.split('@')[0], // 如果註冊沒存帳號，就拿信箱前面當帳號
      name: u.name || "未命名用戶",
      email: u.email,
      role: this.normalizeRole(u.role),
      totalSpent: u.totalSpent || 0,
      transactions: u.transactions || 0,
      statusText: "正常",
    })),
  ];
},

 

    deleteUser(uid) {
      this.users = this.users.filter((u) => u.uid !== uid);
      // 同步更新 localStorage，否則重新整理會跑回來
      const updatedLocal = this.users.filter(u => u.role === 'user' && !['0000', '0001'].includes(u.uid));
      localStorage.setItem("mma_users", JSON.stringify(updatedLocal));
    },
  },
});