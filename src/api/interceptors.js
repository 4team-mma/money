import service from "./index";
import { ElMessage } from "element-plus";
// import router from "@/router";

service.interceptors.request.use((config) => {
  // 1. ⾃動添加 JWT token, ⽤來驗證⽤⼾的登⼊狀態（後⾯的內容會說明）
  /*
    const authStore = useAuthStore();
    if (authStore.accessToken) {
      config.headers["Authorization"] = `Bearer ${authStore.accessToken}`;
    }
    */
  // 2. GET 請求添加時間戳防⽌快取
  if (config.method === "get") {
    config.params = {
      ...config.params,
      _t: Date.now(),
    };
  }

  // 3. ⾃動設定 FormData 的 Content-Type
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = "multipart/form-data";
  }

  return config;
});

service.interceptors.response.use(
  (response) => {
    // 成功：直接返回資料
    return response.data;
  },
  (error) => {
    // 錯誤處理
    const { status } = error.response;

    switch (status) {
      case 401:
      // 未授權：清除 token 並跳轉登⼊⾴
      /*
      const authStore = useAuthStore();
      authStore.clearAuth();
      router.push({ path: '/login', query: { redirect: ... } });
      break;
      */
      case 403:
        ElMessage.error("無權限存取");
        break;

      case 404:
        ElMessage.error("請求的資源不存在");
        break;

      // ... 其他錯誤處理
    }
  }
);
