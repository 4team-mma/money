import service from "./index";
import { ElMessage } from "element-plus";

service.interceptors.request.use((config) => {
  // 1. 自動添加 JWT token
  const token = localStorage.getItem('token'); // 💡 確保登入成功後存入的 key 叫 'token'
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
    return response.data;
  },
  (error) => {
    const { status } = error.response;
    switch (status) {
      case 401:
        ElMessage.error("登入逾期，請重新登入");
        localStorage.removeItem('token'); // 清除過期 token
        // window.location.href = '/'; // 視情況跳轉回登入頁
        break;
      case 403:
        ElMessage.error("無權限存取");
        break;
      case 404:
        ElMessage.error("請求的資源不存在");
        break;
      default:
        ElMessage.error("系統錯誤，請稍後再試");
    }
    return Promise.reject(error);
  }
);

export default service;