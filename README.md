<h1 align="center">
  <br>
  <img src="/favicon.png" alt="mma-app" width="200">
  <br>
  mma-app
  <br>
</h1>

## 專案簡介
MMA App 是一個基於 Vue 3、Vite 的開發中的前端專案，整合 Element Plus、Bootstrap、Pinia、Vue Router，並使用 Axios 與後端 API 溝通，適合開發現代化、響應式的 Web 應用程式。

![Vue 3](https://img.shields.io/badge/Vue-3.5.26-42b883?logo=vue.js)
![Vue Router](https://img.shields.io/badge/Vue_Router-4.6.4-42b883?logo=vue.js)
![Pinia](https://img.shields.io/badge/Pinia-3.0.4-fad000?logo=pinia)
![Element Plus](https://img.shields.io/badge/Element_Plus-2.13.0-409eff?logo=element)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.8-7952b3?logo=bootstrap)
![Bootstrap Icons](https://img.shields.io/badge/Bootstrap_Icons-1.13.1-7952b3?logo=bootstrap)
![V-Calendar](https://img.shields.io/badge/V--Calendar-3.1.2-00bfa5?logo=calendar)
![@popperjs/core](https://img.shields.io/badge/@popperjs/core-2.11.8-ff6f61?logo=popper)
![Axios](https://img.shields.io/badge/Axios-1.13.2-5a29e4?logo=axios)
<br>開發工具：
![Vite](https://img.shields.io/badge/Vite-7.3.0-646cff?logo=vite)
![@vitejs/plugin-vue](https://img.shields.io/badge/@vitejs/plugin--vue-6.0.3-646cff?logo=vite)
![vite-plugin-vue-devtools](https://img.shields.io/badge/vite--plugin--vue--devtools-8.0.5-646cff?logo=vite)

[團隊開發流程（非常重要）](docs/git-workflow.md) |
[專案結構說明](docs/architecture.md) |
[專案使用套件說明](docs/dependencies.md) |
[專案怎麼從 npm 改成 pnpm](docs/migration-npm-to-pnpm.md)

## 命名規則
componment命名：
大駝峰->例如：AccountAdd

## 遷移說明
Vue 專案不需要重新下載，請在 money 資料夾內打開終端機，輸入這行指令即可：
```bash
git remote set-url origin https://github.com/4team-mma/money.git
```
輸入完後可用`git remote -v`確認地址是否已變更為`4team-mma`。

## 功能特色
- Vue 3 + Composition API：高效能、易維護。
- Vite：超快的開發與打包速度。
- Element Plus：完整的 UI 元件庫。
- Bootstrap + Icons：響應式設計與圖示支援。
- Pinia：官方推薦的狀態管理工具。
- Vue Router：SPA 路由管理。
- Axios：簡單易用的 HTTP 請求工具。
- V-Calendar：日期選擇與日曆功能。

## 開始專案需要先準備的東西（只檢查一次）

請先確認電腦已安裝：

- ✅ Node.js（建議 LTS 版本）
- ✅ pnpm
- ✅ Git
- ✅ Visual Studio Code（或其他 IDE）

檢查方式（打開終端機輸入）
```bash
node -v       # 檢查 Node 版本
pnpm -v       # 檢查 pnpm 版本
git --version # 檢查 git 版本
```

如果還沒安裝 pnpm
```bash
npm i -g pnpm
```

## 第一次下載專案（從 GitHub Clone Main）
- 只做一次。
```bash
git clone https://github.com/4team-mma/money.git
```
- 下載後 → 會得到 GitHub 的 main 內容。

## 安裝專案套件（第一次或套件更新後）
```bash
pnpm install
pnpm add pinia
pnpm install element-plus

# 安裝 v-calendar 套件
pnpm install v-calendar@next @popperjs/core
```
- 這是在安裝專案需要用到的套件
- 通常只在「第一次」或「套件有變更」時需要執行

快速檢查指令
```bash
pnpm list        # 查看已安裝套件
pnpm outdated    # 檢查是否有過期套件
```

## 啟動專案（開始開發）
```bash
pnpm dev
```
啟動後，終端機會出現網址，例如：
```
http://localhost:5173
```
- 用瀏覽器打開即可看到畫面

## 打包專案
```bash
pnpm build
```
- 只有在要部署或正式打包時才需要

## 預覽打包結果
```bash
pnpm run preview
```

## Contributors

<a href="https://github.com/4team-mma/money/graphs/contributors">
  <img src="https://contributors-img.web.app/image?repo=4team-mma/money" />
</a>
