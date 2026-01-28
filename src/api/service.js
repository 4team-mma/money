import axios from "axios";

const service = axios.create({
 // 優先讀取環境變數，如果沒有才用預設值
    baseURL: import.meta.env.VITE_API_BASE_URL || "/api", 
    timeout: 10_000
});

export default service;