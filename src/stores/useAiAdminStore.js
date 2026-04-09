// web_app/frontend/src/stores/useAiAdminStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAiRobotConfig } from '../api/robot'

export const useAiAdminStore = defineStore('aiAdmin', () => {
    // 儲存各個 Provider 的完整狀態
    const configs = ref({
        // 🎯 修正 1：每個模型都加上 brain_version，並順手新增遺漏的 groq
        gemini: { hasKey: false, version: 'gemini-3-flash-preview', prompt: '', brain_version: 'v1' },
        groq: { hasKey: false, version: 'llama-3.3-70b-versatile', prompt: '', brain_version: 'v1' },
        ollama: { version: 'gemma4:e4b', prompt: '', brain_version: 'v1' }, // 順便把預設值改成 Gemma 4
        anythingllm: { hasKey: false, prompt: '', brain_version: 'v1' }
    })
    
    const currentActiveProvider = ref('')

    // 紀錄哪些 Provider 已經抓過資料
    const initializedProviders = ref(new Set())

    // 抓取並暫存特定大腦的設定
    const fetchConfig = async (provider, force = false) => {
        // 🛡️ 檢查是否已載入過 (除非強制重新抓取)
        if (initializedProviders.value.has(provider) && !force) {
            return;
        }

        try {
            // ⚡️ 修改點 2：直接呼叫函式，拿掉 robotApi.
            const res = await getAiRobotConfig(provider);
            
            const d = res?.data || res;
            if (d) {
                // 🎯 修正 2：在抓取資料後，把後端的 d.brain_version 存進去，並補上 groq 的判斷
                if (provider === 'gemini') {
                    configs.value.gemini.hasKey = d.has_key;
                    configs.value.gemini.version = d.model_version;
                    configs.value.gemini.prompt = d.system_prompt;
                    configs.value.gemini.brain_version = d.brain_version; // 👈 記住大腦版本
                } else if (provider === 'groq') {
                    configs.value.groq.hasKey = d.has_key;
                    configs.value.groq.version = d.model_version;
                    configs.value.groq.prompt = d.system_prompt;
                    configs.value.groq.brain_version = d.brain_version; // 👈 記住大腦版本
                } else if (provider === 'ollama') {
                    configs.value.ollama.version = d.model_version;
                    configs.value.ollama.prompt = d.system_prompt;
                    configs.value.ollama.brain_version = d.brain_version; // 👈 記住大腦版本
                } else if (provider === 'anythingllm') {
                    configs.value.anythingllm.hasKey = d.has_key;
                    configs.value.anythingllm.prompt = d.system_prompt;
                    configs.value.anythingllm.brain_version = d.brain_version; // 👈 記住大腦版本
                }
                
                if (d.is_active) currentActiveProvider.value = d.provider;

                // 標記為已初始化
                initializedProviders.value.add(provider);
            }
        } catch (error) {
            console.error(`🍍 暫存 ${provider} 資訊失敗:`, error);
        }
    }

    // 一次初始化所有機器人設定 (在中轉頁使用)
    const initAllAiConfigs = async () => {
        const providers = ['gemini', 'groq', 'ollama', 'anythingllm'];
        // 平行執行，節省時間
        await Promise.all(providers.map(p => fetchConfig(p)));
    }

    return { configs, currentActiveProvider, fetchConfig, initAllAiConfigs }
})