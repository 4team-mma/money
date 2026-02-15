import service from "./service";
import { ElMessage } from "element-plus";
import router from "@/router";

// 🌟 1. 定義一個全域變數作為標記，紀錄是否正在顯示「登入過期」的警告
let is401Alerting = false;

service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("user_token") || localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.method === "get") {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }

    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMsg = data?.detail || data?.msg || "伺服器異常";

      switch (status) {
        case 401:
          // 🌟 2. 判斷如果「還沒」彈出過警告，才執行彈窗與跳轉
          if (!is401Alerting) {
            is401Alerting = true; // 立刻上鎖
            
            ElMessage.error(errorMsg || "登入時間過長，請重新登入");

            // 清除過期資訊
            localStorage.removeItem("user_token");
            localStorage.removeItem("token");
            localStorage.removeItem("currentUser");

            // 跳回登入頁
            router.push("/");

            // 🌟 3. 設定 3 秒後解除標記，避免未來重新登入後再次出錯時不提示
            setTimeout(() => {
              is401Alerting = false;
            }, 3000);
          }
          break;
        case 403:
          ElMessage.error(errorMsg || "無權限存取");
          break;
        case 404:
          ElMessage.error(errorMsg || "請求的資源不存在");
          break;
        case 422:
          ElMessage.error("請求格式正確，但是由於含有語意錯誤，無法回應");
          break;
        case 429:
          ElMessage.error("請求過於頻繁，請稍後再試");
          break;
        case 500:
          ElMessage.error("伺服器內部錯誤");
          break;
        default:
          ElMessage.error(error.response.data?.detail || "系統錯誤");
      }
    } else if (error.request) {
      ElMessage.error("無法連線到伺服器，請檢查網路或稍後再試");
    } else {
      ElMessage.error("請求設定異常");
    }
    return Promise.reject(error);
  },
);

export default service;