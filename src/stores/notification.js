import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/api";
import { ElNotification } from "element-plus";

export const useNotificationStore = defineStore(
  "notification",
  () => {
    const list = ref([]);
    const now = ref(new Date());

    // 🌟 1. 鬧鐘計時器：每分鐘檢查一次，讓未來的提醒在「時間到」時自動彈窗
    setInterval(() => {
      const oldNow = new Date(now.value);
      const newNow = new Date();
      now.value = newNow; // 更新全站時間錨點

      // 檢查所有通知，找出「剛好在這一分鐘內到期」的提醒
      list.value.forEach((n) => {
        if (n.category === "manual" && !n.is_read) {
          const scheduledTime = new Date(
            `${n.reminder_date_start.replace(/-/g, "/")} ${n.reminder_time}`,
          );

          // 如果預約時間落在 [上一分鐘 ~ 這一分鐘] 之間，觸發彈窗
          if (scheduledTime > oldNow && scheduledTime <= newNow) {
            triggerElPopup(n);
          }
        }
      });
    }, 60000);

    // 🌟 2. 核心過濾邏輯：UI 只顯示「時間已到」的通知
    const activeList = computed(() => {
      const currentNow = new Date(now.value);
      return list.value.filter((n) => {
        if (n.category !== "manual") return true;

        const datePart = n.reminder_date_start.replace(/-/g, "/");
        const timePart = n.reminder_time || "00:00:00";
        const scheduledTime = new Date(`${datePart} ${timePart}`);

        return scheduledTime <= currentNow;
      });
    });

    // 🌟 3. 動態未讀計數：只計算「看得見且未讀」的
    const unreadCount = computed(() => {
      return activeList.value.filter((n) => !n.is_read).length;
    });

    // 🌟 4. 抓取 API 並判定是否彈窗 (用於預算警告/儲蓄達成)
    const fetchAll = async (showPopup = false) => {
      try {
        const newList = await api.get("/reminders/list");
        const currentNow = new Date();

        if (showPopup) {
          newList.forEach((newNote) => {
            // 檢查是否為新產生的未讀通知
            const isNew = !list.value.some(
              (old) => old.reminder_id === newNote.reminder_id,
            );
            if (isNew && !newNote.is_read) {
              const scheduledTime = new Date(
                `${newNote.reminder_date_start.replace(/-/g, "/")} ${newNote.reminder_time}`,
              );
              // 只有現在已過期的才在 fetch 時彈窗，未來的交給 setInterval 鬧鐘
              if (scheduledTime <= currentNow) {
                triggerElPopup(newNote);
              }
            }
          });
        }
        list.value = newList;
      } catch (error) {
        console.error("獲取通知失敗:", error);
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

    // 🌟 6. 各種操作 Actions
    const markAsRead = async (id) => {
      try {
        await api.patch(`/reminders/${id}/read`);
        const item = list.value.find((n) => n.reminder_id === id);
        if (item) item.is_read = true;
      } catch (e) {
        console.error(e);
      }
    };

    const readAll = async () => {
      try {
        await api.patch("/reminders/read-all");
        list.value.forEach((n) => (n.is_read = true));
      } catch (e) {
        console.error(e);
      }
    };

    const addManual = async (payload) => {
      try {
        const newNote = await api.post("/reminders/", payload);
        list.value.unshift(newNote);

        const scheduledTime = new Date(
          `${payload.reminder_date_start.replace(/-/g, "/")} ${payload.reminder_time}`,
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
        console.error(e);
      }
    };

    const deleteAll = async () => {
      try {
        // 1. 呼叫後端（後端現在只會刪除已生效的）
        await api.delete("/reminders/delete-all");

        // 2. 同步前端狀態：只保留「還沒到時間」的通知
        const nowValue = new Date();

        list.value = list.value.filter((n) => {
          if (n.category !== "manual") return false; // 非手動提醒一律被清空

          const datePart = n.reminder_date_start.replace(/-/g, "/");
          const timePart = n.reminder_time || "00:00:00";
          const scheduledTime = new Date(`${datePart} ${timePart}`);

          // 只保留未來的提醒
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
      // 💡 只持久化清單，不持久化 now (確保每次重整時間都是對的)
      paths: ["list"],
    },
  },
);
