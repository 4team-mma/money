// web_app/frontend/src/stores/useAiAdminStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

// ⚡️ 修改點 1：改用具名匯入，只引入需要的 getAiRobotConfig
import { getAiRobotConfig } from '../api/robot'

export const useAiAdminStore = defineStore('aiAdmin', () => {
    // 儲存各個 Provider 的完整狀態
    const configs = ref({
        gemini: { hasKey: false, version: 'gemini-2.0-flash', prompt: '' },
        ollama: { version: 'gemma-3-1b-it', prompt: '' },
        anythingllm: { hasKey: false, prompt: '' }
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
                if (provider === 'gemini') {
                    configs.value.gemini.hasKey = d.has_key;
                    configs.value.gemini.version = d.model_version;
                    configs.value.gemini.prompt = d.system_prompt;
                } else if (provider === 'ollama') {
                    configs.value.ollama.version = d.model_version;
                    configs.value.ollama.prompt = d.system_prompt;
                } else if (provider === 'anythingllm') {
                    configs.value.anythingllm.hasKey = d.has_key;
                    configs.value.anythingllm.prompt = d.system_prompt;
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
        const providers = ['gemini', 'ollama', 'anythingllm'];
        // 平行執行，節省時間
        await Promise.all(providers.map(p => fetchConfig(p)));
    }

    return { configs, currentActiveProvider, fetchConfig, initAllAiConfigs }
})