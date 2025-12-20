# mma-app

說明文件: git 下載

## 🧰 需要先準備的東西（只檢查一次）

請先確認電腦已安裝：

- ✅ Node.js（建議 LTS 版本）
- ✅ npm（安裝 Node.js 時會一起安裝）
- ✅ Git
- ✅ Visual Studio Code（或其他 IDE）

檢查方式（打開終端機輸入）
```cmd
node -v
npm -v
git --version
```

## 📥 第一次下載專案（Clone Main）
- 只做一次。
```cmd
git clone https://github.com/xu3ru8p/money.git
```
- 下載後 → 會得到你 GitHub 的 main 內容。

## 📦 安裝專案套件（第一次或套件更新後）
```cmd
npm install
npm install pinia
```
- 這是在安裝專案需要用到的套件
- 通常只在「第一次」或「套件有變更」時需要執行

## ▶️ 啟動專案（開始開發）
```cmd
npm run dev
```
啟動後，終端機會出現網址，例如：
```
http://localhost:5173
```
- 用瀏覽器打開即可看到畫面

## 📦 打包專案
```cmd
npm run build
```
- 只有在要部署或正式打包時才需要

## 👥 團隊開發流程（非常重要）
### ① 開始開發前，同步最新 main 🔁
每次開始寫程式前「一定要做」
```cmd
cd money
git checkout main
git pull origin main
```

### ② 隊友開自己的分支開發（例如 apple 分支）🌱
```cmd
git checkout -b apple
```
- 隊友所有開發都在 apple 分支進行
- 不會碰到主線 main
- 不會互相干擾
> ⚠️ 請用自己的名字或功能命名分支 <br>
> 例如：apple、login_feature、apple_v2

### ③ 隊友開發完後，推上自己的分支（例如 apple 分支）📤
先查看自己位於哪個分支
```cmd
git branch
```
加入變更並提交
```cmd
git add .
git commit -m "完成 apple 分支的功能"
```
推送到 GitHub
```cmd
git push -u origin apple
```
此時 GitHub 上會多一個分支：
👉 https://github.com/xu3ru8p/money/tree/apple

### ④ 隊友發 Pull Request（PR）給主控者的審核流程🔀：
1. 打開 GitHub 專案頁面：https://github.com/xu3ru8p/money
2. 點擊「Compare & pull request」
3. 設定：
   - from：`apple`
   - to：`main`
4. 填寫簡單說明
5. 點「Create pull request」(送出 PR)
> 📌 這代表隊友「申請把程式合併到主線(main)」

### ⑤ 主控者會做的事：審核後，合併到 main✅
- 幫隊友看程式碼
- 沒問題就 Merge pull request
- main 分支更新完成

### ⑥ 隊友同步最新 main，繼續下一輪開發
```cmd
git checkout main
git pull origin main
```

### ⑦ 接著想做新功能就再開一個新的分支，例如：
```cmd
git checkout -b apple_v2
```
