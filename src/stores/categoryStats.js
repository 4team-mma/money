import { defineStore } from "pinia";
import api from "@/api";
import { useUserStore } from "@/stores/user";

export const useCategoryStore = defineStore("categoryStats", {
    state: () => ({
        summary: {
            total_users: 0,
            active_users: 0,
            total_transactions: "0",
            avg_activity: "0%",
            avg_coverage: "0%"
        },
        // 存放來自後端的所有排行榜數據
        allRankings: {
            category_spending: [],
            active_bees: [],
        },
        categoryAnalysis: [],
        accountAnalysis: [],
        loading: false,
        isLoaded: false, // 標記是否已同步過排行榜
    }),

    actions: {
        // 1. 專門抓小卡數據
        async fetchDashboardSummary() {
            try {
                const response = await api.get("/admin/stats/dashboard-summary");
                this.summary = response;
            } catch (error) {
                console.error("小卡數據抓取失敗", error);
            }
        },

        // 2. 專門抓排行榜 (改回原本的路徑)
        async fetchAllRankings(force = false) {
            if (this.isLoaded && !force) return;
            this.loading = true;
            try {
                const response = await api.get("/admin/stats/rankings");
                const userStore = useUserStore(); // ✨ 取得 userStore 實例
                const emojiMap = {
                    餐飲: "🍕", 交通: "🚗", 購物: "🛍️",
                    娛樂: "🎮", 醫療: "🏥", 居家: "🏠",
                    食: "🍱", 衣: "👕", 住: "🏠", 行: "🚌"
                };

                // 處理排行榜數據
                const data = response;
                if (data.category_spending) {
                    data.category_spending = data.category_spending.map((item) => ({
                        ...item,
                        displayName: `${emojiMap[item.name] || "💰"} ${item.name}`,
                    }));
                }

                this.allRankings = data;


                // ✨ 關鍵：把後端傳回來的 user_insights 塞進 userStore

                if (response.user_insights) {
                userStore.userInsights = response.user_insights;
                }

                this.isLoaded = true;

            } catch (error) {
                console.error("獲取綜合排名失敗:", error);
                this.isLoaded = false;
            } finally {
                this.loading = false;
            }
        },

        async fetchCategoryAnalysis(type = 0) {
            this.loading = true;
            try {
                const response = await api.get(`/admin/stats/category-analysis?type=${type}`);
                this.categoryAnalysis = response;
            } catch (error) {
                console.error("獲取分析失敗", error);
            } finally {
                this.loading = false;
            }
        },

        async fetchAccountAnalysis() {
            this.loading = true;
            try {
                const response = await api.get("/admin/stats/account-analysis");
                this.accountAnalysis = response;
            } catch (error) {
                console.error("獲取帳戶分析失敗:", error);
            } finally {
                this.loading = false;
            }
        }
    },
});