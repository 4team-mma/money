# 專案使用套件說明
[回首頁](../README.md)

## 核心框架
* ![Vue 3](https://img.shields.io/badge/Vue-3.5.26-42b883?logo=vue.js)  
前端框架，採用 Composition API，提供高效能與易維護的結構。
* ![Vue Router](https://img.shields.io/badge/Vue_Router-4.6.4-42b883?logo=vue.js)  
Vue 官方路由管理工具，用於處理 SPA 的頁面切換。
* ![Pinia](https://img.shields.io/badge/Pinia-3.0.4-fad000?logo=pinia)  
Vue 3 官方推薦的狀態管理工具，取代 Vuex，簡單且支援 TypeScript。

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

## 工具
* ![Axios](https://img.shields.io/badge/Axios-1.13.2-5a29e4?logo=axios)  
HTTP 請求工具，用於與後端 API 溝通。

## 開發工具
* ![Vite](https://img.shields.io/badge/Vite-7.3.0-646cff?logo=vite)  
前端建構工具，提供快速開發與打包。

* ![@vitejs/plugin-vue](https://img.shields.io/badge/@vitejs/plugin--vue-6.0.3-646cff?logo=vite)  
Vite 的 Vue 插件，支援 Vue 單檔元件 (SFC)。

* ![vite-plugin-vue-devtools](https://img.shields.io/badge/vite--plugin--vue--devtools-8.0.5-646cff?logo=vite)  
Vue DevTools 插件，方便在開發過程中除錯。

## 安裝指令（使用 pnpm）

```bash
pnpm add @popperjs/core axios bootstrap bootstrap-icons element-plus pinia v-calendar vue vue-router
pnpm add -D @vitejs/plugin-vue vite vite-plugin-vue-devtools
```