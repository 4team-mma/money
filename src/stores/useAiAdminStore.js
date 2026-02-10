// web_app/frontend/src/stores/useAiAdminStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { robotApi } from '../api/robot'

export const useAiAdminStore = defineStore('aiAdmin', () => {
    // 儲存各個 Provider 的完整狀態
    const configs = ref({
        gemini: { hasKey: false, version: 'gemini-2.0-flash', prompt: '' },
        ollama: { version: 'gemma-3-1b-it', prompt: '' },
        anythingllm: { hasKey: false, prompt: '' }
    })
    
    const currentActiveProvider = ref('')

    // 抓取並暫存特定大腦的設定
    const fetchConfig = async (provider) => {
        try {
            const res = await robotApi.getAiRobotConfig(provider);
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
            }
        } catch (error) {
            console.error(`🍍 暫存 ${provider} 資訊失敗:`, error);
        }
    }

    return { configs, currentActiveProvider, fetchConfig }
})