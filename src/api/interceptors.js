import service from "./index";
import { ElMessage } from "element-plus";



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

service.interceptors.response.use(
  (response) => {
    //  攔截器幫你 .data，所以組件拿到的 response 直接就是後端回傳的 JSON
    return response.data;
  },
  (error) => {
// 增加一個保護邏輯，防止 error.response 是 undefined
    if (!error.response) {
      ElMessage.error("無法連線至伺服器，請檢查網路或後端是否啟動");
      return Promise.reject(error);
    }

    const { status } = error.response;
    switch (status) {
      case 401:
        ElMessage.error("登入逾期或權限不足，請重新登入");
        localStorage.removeItem('user_token'); //  清除對應的 Key
        localStorage.removeItem('currentUser');
        // window.location.href = '/'; 
        break;
      case 403:
        ElMessage.error("無權限存取");
        break;
      case 404:
        ElMessage.error("請求的資源不存在");
        break;
      case 500:
        ElMessage.error("伺服器內部錯誤");
        break;
      default:
        ElMessage.error(error.response.data?.detail || "系統錯誤");
    }
    return Promise.reject(error);
  }
);

export default service;