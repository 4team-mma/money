# 專案使用套件說明
[回首頁](../README.md)

## 核心框架（Core）
* ![Vue 3](https://img.shields.io/badge/Vue-3.5.26-42b883?logo=vue.js)  
前端框架，採用 Composition API，提供高效能與易維護的結構。
* ![Vue Router](https://img.shields.io/badge/Vue_Router-4.6.4-42b883?logo=vue.js)  
Vue 官方路由管理工具，用於處理 SPA 的頁面切換、巢狀路由與權限控管。
* ![Pinia](https://img.shields.io/badge/Pinia-3.0.4-fad000?logo=pinia)  
Vue 3 官方推薦的狀態管理工具，取代 Vuex，簡單且支援 TypeScript。
* ![Pinia Persistedstate](https://img.shields.io/badge/Pinia_Persistedstate-4.7.1-fad000?logo=pinia)  
Pinia 狀態持久化插件，用於將指定 store 狀態保存至 localStorage / sessionStorage，常見應用情境包含：登入狀態、使用者偏好設定等。

## UI 與樣式

* ![Element Plus](https://img.shields.io/badge/Element_Plus-2.13.0-409eff?logo=element)  
Vue 3 專用的 UI 元件庫，提供豐富的表單、表格、對話框等元件。

* ![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952b3?logo=bootstrap)  
CSS 框架，提供響應式設計與基本樣式。

* ![Bootstrap Icons](https://img.shields.io/badge/Bootstrap_Icons-1.13.1-7952b3?logo=bootstrap)  
Bootstrap 官方圖示套件，方便在專案中使用 SVG Icons。

* ![V-Calendar](https://img.shields.io/badge/V--Calendar-3.0.1-00bfa5?logo=calendar)  
Vue 的日曆與日期選擇元件，適用於排程或日期選擇功能。

* ![@popperjs/core](https://img.shields.io/badge/@popperjs/core-2.11.8-ff6f61?logo=popper)  
提供彈出式提示（Tooltip、Dropdown）定位功能，V-Calendar 及其他 UI 元件會用到。

## 資料視覺化（Charts）
* ![Chart.js](https://img.shields.io/badge/Chart.js-4.5.1-ff6384?logo=chart.js)  
資料視覺化函式庫，用於呈現折線圖、長條圖、圓餅圖等統計圖表，常用於儀表板與報表頁面。

## 工具套件（Utilities）
* ![Axios](https://img.shields.io/badge/Axios-1.13.2-5a29e4?logo=axios)  
HTTP 請求工具，用於與後端 API 溝通。常搭配攔截器統一處理 Token 與錯誤回應。

## 開發工具（Dev Tools）
* ![Vite](https://img.shields.io/badge/Vite-7.3.0-646cff?logo=vite)  
前端建構工具，提供快速開發與打包。

* ![@vitejs/plugin-vue](https://img.shields.io/badge/@vitejs/plugin--vue-6.0.3-646cff?logo=vite)  
Vite 的 Vue 插件，支援 Vue 單檔元件 (SFC)。

* ![vite-plugin-vue-devtools](https://img.shields.io/badge/vite--plugin--vue--devtools-8.0.5-646cff?logo=vite)  
Vue DevTools 插件，方便在開發過程中除錯。

## 安裝指令（使用pnpm）

```bash
# Runtime dependencies
pnpm add \
  vue@3.5.26 \
  vue-router@4.6.4 \
  pinia@3.0.4 \
  pinia-plugin-persistedstate@4.7.1 \
  axios@1.13.2 \
  element-plus@2.13.0 \
  bootstrap@5.3.8 \
  bootstrap-icons@1.13.1 \
  v-calendar@3.0.1 \
  @popperjs/core@2.11.8 \
  chart.js@4.5.1

# Dev dependencies
pnpm add -D \
  vite@7.3.0 \
  @vitejs/plugin-vue@6.0.3 \
  vite-plugin-vue-devtools@8.0.5
```