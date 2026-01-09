import { defineStore } from "pinia";

export const useCategoryStore = defineStore("category", {
    state: () => ({
    // 初始預設選項
    categories: [
    { id: 1, itemName: "飲食", icon: "🍔" },
    { id: 2, itemName: "交通", icon: "🚗" },
    { id: 3, itemName: "居家", icon: "🏠" },
    { id: 4, itemName: "娛樂", icon: "🎮" },
    ],
    members: [
    { id: 1, itemName: "自己" },
    { id: 2, itemName: "父母" },
    { id: 3, itemName: "孩子" },
    ],
    tags: [
    { id: 1, itemName: '一般', color: '#004B97' },
    { id: 2, itemName: '旅遊', color: '#22c55e' },
    { id: 3, itemName: '必要', color: '#3b82f6' },
    { id: 4, itemName: '衝動', color: '#ef4444' },
    ],
    }),
    persist: true, // 開啟持久化，重新整理就不會消失
    actions: {
    addCustomCategory(newItem) {
        this.categories.push(newItem);
    },
    addCustomMember(newItem) {
        this.members.push(newItem);

    },addCustomTag(newItem) {
        this.tags.push(newItem);
    },


    },
});
