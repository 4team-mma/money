import service from "./service";
import { ElMessage } from "element-plus";

// 🌟 必須引入 router 才能在攔截器裡做 router.push
import router from '@/router';

service.interceptors.request.use((config) => {
  // 1. 自動添加 JWT token
  // 確保 Key 與 Home.vue 存入時的名字一致
  const token = localStorage.getItem('user_token'); 
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // 2. GET 請求添加時間戳防止快取
  if (config.method === "get") {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }

  // 3. 自動設定 FormData 的 Content-Type
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = "multipart/form-data";
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

/**
 * 回應攔截器
 * 統一處理回應資料和錯誤
 */
service.interceptors.response.use(
  (response) => {
    //  請求成功，攔截器幫你 .data，所以組件拿到的 response 直接就是後端回傳的 JSON
    return response.data;
  },
  (error) => {
    // 請求失敗，判斷錯誤類型
    if (error.response) {
      // 1. 伺服器有回應，但狀態碼非 2xx (如 401, 404, 500)
      const { status,data } = error.response;
      // 💡 使用 ?. 防止當 data 為空時崩潰
      const errorMsg = data?.detail || data?.msg || "伺服器異常";

      switch (status) {
        case 401:
          // 顯示後端傳來的 "帳號或密碼錯誤"
          ElMessage.error(error.response.data.detail || '登入逾期或權限不足，請重新登入');
          localStorage.removeItem('user_token'); //  清除對應的 Key
          localStorage.removeItem('currentUser');
          router.push('/') // 跳回登入頁
          break;
        case 403:
          ElMessage.error("無權限存取");
          break;
        case 404:
          ElMessage.error("請求的資源不存在");
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
        case 502:
        case 503:
        case 504:
          ElMessage.error("服務暫時不可用，請稍後再試");
          break;
        default:
          ElMessage.error(error.response.data?.detail || "系統錯誤");
      }
    } else if (error.request) {
      // 2. 請求已發出，但「沒收到回應」(例如網路斷線、伺服器停機)
      ElMessage.error('無法連線到伺服器，請檢查網路或稍後再試');
    } else {
      // 3. 設定請求時發生錯誤 (例如設定錯誤)
      ElMessage.error('請求設定異常');
    }
    return Promise.reject(error);
  }
);

export default service;