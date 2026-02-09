import axios from "axios";

// 1. 建立 API 實例
const api = axios.create({
  // 為了相容不同環境，建議使用相對路徑並搭配 Vite Proxy
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
  timeout: 120000, // 🚀 統一使用 120 秒，確保 Mac 的本地模型不會超時
});

// 2. 🚀 通用攔截器：解決 Token 命名與注入問題
api.interceptors.request.use(
  (config) => {
    // 🛡️ 同時嘗試讀取 Mac 版的 'user_token' 與 Win 版的 'token'
    const token =
      localStorage.getItem("user_token") || localStorage.getItem("token");

    if (token) {
      // 確保 Header 格式正確注入
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }

    // 🛠️ 路徑自動修正：確保路徑開頭包含 /api (防止兩邊路徑配置不同)
    if (!config.url.startsWith("/api")) {
      config.url = `/api${config.url.startsWith("/") ? "" : "/"}${config.url}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. 匯出通用 API 介面
export const robotApi = {
  // 取得 AI 配置
  getAiRobotConfig: () => api.get("/ai_models/config"),

  // 儲存 AI 配置
  saveAiRobotConfig: (data) => api.post("/ai_models/save", data),

  // AI 對話測試
  postAiRobotChat: (data) => api.post("/ai_models/chat", data),
};
