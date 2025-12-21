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
      const defaultAccount = [
        {
          email: "admin",
          name: "管理者",
          role: "admin",
          uid: "0000",
          totalSpent: 0,
          transactions: 0,
          statusText: "正常",
        },
        {
          email: "user",
          name: "測試者",
          role: "user",
          uid: "0001",
          totalSpent: 45800,
          transactions: 15,
          statusText: "正常",
        },
      ];

      const registeredUser = JSON.parse(
        localStorage.getItem("mma_users") || "[]"
      );

      this.users = [
        ...defaultAccount,
        ...registeredUser.map((u, idx) => ({
          ...u,
          role: this.normalizeRole(u.role),
          uid: String(idx + 2).padStart(4, "0"),
          totalSpent: u.totalSpent || 0,
          transactions: u.transactions || 0,
          statusText: "正常",
        })),
      ];
    },

    deleteUser(uid) {
      this.users = this.users.filter((u) => u.uid !== uid);
    },
  },
});
