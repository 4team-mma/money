# mma-app
[團隊開發流程（非常重要）](docs/git-workflow.md) |
[專案怎麼從 npm 改成 pnpm](docs/migration-npm-to-pnpm.md)

## 命名規則：
componment命名：
大駝峰->例如：AccountAdd

## 遷移說明:
Vue 專案不需要重新下載，請在 money 資料夾內打開終端機，輸入這行指令即可：
```bash
git remote set-url origin https://github.com/4team-mma/money.git
```
輸入完後可用`git remote -v`確認地址是否已變更為`4team-mma`。

## 開始專案需要先準備的東西（只檢查一次）

請先確認電腦已安裝：

- ✅ Node.js（建議 LTS 版本）
- ✅ pnpm
- ✅ Git
- ✅ Visual Studio Code（或其他 IDE）

檢查方式（打開終端機輸入）
```bash
node -v
pnpm -v
git --version
```

如果還沒安裝 pnpm
```bash
npm i -g pnpm
```

## 第一次下載專案（Clone Main）
- 只做一次。
```bash
git clone https://github.com/4team-mma/money.git
```
- 下載後 → 會得到 GitHub 的 main 內容。

## 安裝專案套件（第一次或套件更新後）
```bash
pnpm install
pnpm add pinia

## 安裝 v-calendar 套件
pnpm install v-calendar@next @popperjs/core
```
- 這是在安裝專案需要用到的套件
- 通常只在「第一次」或「套件有變更」時需要執行

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
