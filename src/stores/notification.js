import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/api";
import { ElNotification } from "element-plus";
import { parseToLocalContact, isTimeInRange } from "@/utils/dateHelper";

export const useNotificationStore = defineStore(
  "notification",
  () => {
    const list = ref([]);
    const now = ref(new Date());

    // 🌟 1. 鬧鐘計時器：每分鐘檢查一次，確保未來提醒「準點彈窗」
    setInterval(() => {
      if (!Array.isArray(list.value)) return;

      const oldNow = new Date(now.value);
      const newNow = new Date();
      
      // 更新全站時間錨點 (UI 會隨之響應式更新)
      now.value = newNow;

      list.value.forEach((n) => {
        if (n?.category === "manual" && !n.is_read) {
          const scheduledTime = parseToLocalContact(n.reminder_date_start, n.reminder_time);

          // 使用 helper 比對：若預約時間落在 [上一分鐘 ~ 這一分鐘] 之間則觸發
          if (isTimeInRange(scheduledTime, oldNow, newNow)) {
            triggerElPopup(n);
          }
        }
      });
    }, 60000);

    // 🌟 2. 核心過濾邏輯：UI 只顯示「時間已到」或「系統自動產生」的通知
    const activeList = computed(() => {
      const currentNow = new Date(now.value);

      if (!Array.isArray(list.value)) return [];

      return list.value.filter((n) => {
        if (!n) return false;
        // 非手動提醒（如預算、儲蓄）一律顯示
        if (n.category !== "manual") return true;

        const scheduledTime = parseToLocalContact(n.reminder_date_start, n.reminder_time);
        // 手動提醒僅在時間到達後顯示
        return scheduledTime <= currentNow;
      });
    });

    // 🌟 3. 動態未讀計數：計算當前「看得到且未讀」的數量
    const unreadCount = computed(() => {
      return (activeList.value || []).filter((n) => !n.is_read).length;
    });

    // 🌟 4. 抓取 API 並判定是否彈窗 (適用於初次加載或手動重新整理)
    const fetchAll = async (showPopup = false) => {
      try {
        const response = await api.get("/reminders/list");
        const newList = Array.isArray(response) ? response : [];
        const currentNow = new Date();

        if (showPopup && Array.isArray(list.value)) {
          newList.forEach((newNote) => {
            // 判斷是否為「新抓到且未讀」的通知
            const isNew = !list.value.some(
              (old) => old.reminder_id === newNote.reminder_id
            );

            if (isNew && !newNote.is_read) {
              const scheduledTime = parseToLocalContact(
                newNote.reminder_date_start, 
                newNote.reminder_time
              );
              // 只有「當下已過期」的才立即彈窗，未來的交給 setInterval
              if (scheduledTime <= currentNow) {
                triggerElPopup(newNote);
              }
            }
          });
        }
        list.value = newList;
      } catch (error) {
        console.error("獲取通知失敗:", error);
        if (!list.value) list.value = [];
      }
    };

    // 🌟 5. Element Plus 彈窗組件封裝
    const triggerElPopup = (note) => {
      const typeMap = {
        budget: { title: "預算警告", type: "warning" },
        savings: { title: "儲蓄達成", type: "success" },
        manual: { title: "定時提醒", type: "info" },
      };
      const config = typeMap[note.category] || {
        title: "新通知",
        type: "info",
      };

      ElNotification({
        title: config.title,
        message: note.reminder_title,
        type: config.type,
        position: "bottom-right",
        duration: 6000,
        offset: 100,
      });
    };

    // 🌟 6. 操作 Actions
    const markAsRead = async (id) => {
      try {
        await api.patch(`/reminders/${id}/read`);
        const item = list.value.find((n) => n.reminder_id === id);
        if (item) item.is_read = true;
      } catch (e) {
        console.error("標記已讀失敗:", e);
      }
    };

    const readAll = async () => {
      try {
        await api.patch("/reminders/read-all");
        list.value.forEach((n) => (n.is_read = true));
      } catch (e) {
        console.error("全標記已讀失敗:", e);
      }
    };

    const addManual = async (payload) => {
      try {
        const newNote = await api.post("/reminders/", payload);
        list.value.unshift(newNote);
        
        // 立即更新時間錨點，確保 UI 狀態同步
        now.value = new Date();

        const scheduledTime = parseToLocalContact(
          payload.reminder_date_start, 
          payload.reminder_time
        );
        const isFuture = scheduledTime > new Date();

        ElNotification({
          title: isFuture ? "預約成功" : "提醒已建立",
          message: isFuture
            ? `將於 ${payload.reminder_date_start} ${payload.reminder_time} 通知您`
            : payload.reminder_title,
          type: "success",
        });
        return { success: true };
      } catch (error) {
        return { success: false };
      }
    };

    const deleteReminder = async (id) => {
      try {
        await api.delete(`/reminders/${id}`);
        const index = list.value.findIndex((n) => n.reminder_id === id);
        if (index !== -1) list.value.splice(index, 1);
      } catch (e) {
        console.error("刪除失敗:", e);
      }
    };

    const deleteAll = async () => {
      try {
        await api.delete("/reminders/delete-all");
        const nowValue = new Date();

        // 僅保留「時間還沒到」的預約提醒，其餘清空
        list.value = list.value.filter((n) => {
          if (n.category !== "manual") return false;
          const scheduledTime = parseToLocalContact(n.reminder_date_start, n.reminder_time);
          return scheduledTime > nowValue;
        });
      } catch (error) {
        console.error("清空通知失敗:", error);
      }
    };

    return {
      unreadCount,
      list,
      activeList,
      fetchAll,
      markAsRead,
      readAll,
      addManual,
      deleteReminder,
      deleteAll,
    };
  },
  {
    persist: {
      paths: ["list"], // 持久化 list，排除 now 確保時間錨點永遠是當下
    },
  },
);