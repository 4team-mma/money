import { defineStore } from "pinia";
import api from "@/api";

export const useCategoryStore = defineStore("categoryStats", {
    state: () => ({
        // 存放來自後端的所有排行榜數據
        allRankings: {
            category_spending: [], // 各路財神消費榜
            active_bees: [],       // 勤勞小蜜蜂獎
            wealth_masters: [],    // 金庫大總管
            xp_immortals: []       // 修仙進度表
        },
        loading: false,
    }),

    actions: {
        async fetchAllRankings() {
            this.loading = true;
            try {
                // 呼叫更新後的綜合排行 API
                const response = await api.get("/admin/stats/rankings");

                // 針對「各路財神」類別消費榜進行 Emoji 美化處理
                const emojiMap = {
                    餐飲: "🍕", 交通: "🚗", 購物: "🛍️",
                    娛樂: "🎮", 醫療: "🏥", 居家: "🏠",
                    食: "🍱", 衣: "👕", 住: "🏠", 行: "🚌"
                };

                const data = response;

                // 加工處理類別名稱
                data.category_spending = data.category_spending.map((item) => ({
                    ...item,
                    displayName: `${emojiMap[item.name] || "💰"} ${item.name}`,
                }));

                this.allRankings = data;
            } catch (error) {
                console.error("獲取綜合排名失敗:", error);
            } finally {
                this.loading = false;
            }
        },
    },
});