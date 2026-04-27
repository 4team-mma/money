//sandbox.js
import api from '@/api';

// 1. 執行 RAG 沙盒測試 (對應 /admin_helper/rag_test)
export const postRagTest = (data) => {
  return api.post("/admin_helper/rag_test", data, { timeout: 300000 });
};//將 120000 (2分鐘) 改成 300000 (5分鐘)

// 2. 儲存實驗日誌 (對應 /admin_helper/rag_test/log)
export const saveRagPerformanceLog = (data) => {
  return api.post("/admin_helper/rag_test/log", data);
};