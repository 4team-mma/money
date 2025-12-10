# mma-app


說明文件: git 下載

## Recommended IDE Setup
剛下載完：npm install
程式執行:npm run dev
打包:npm run build

###
① 隊友第一次下載你的專案（Clone Main）
只做一次。
git clone https://github.com/xu3ru8p/money.git
下載後 → 會得到你 GitHub 的 main 內容。

② 隊友開始開發前，先更新最新 main
每次開始工作前都要做（避免撞版本）。
cd money
git checkout main
git pull origin main

③ 隊友開自己的分支開發（例如 apple 分支）
git checkout -b apple
隊友所有開發都在 apple 分支進行
不會碰到主線 main
不會互相干擾

④ 隊友開發完後，推上自己的分支
git add .
git commit -m "完成 apple 分支的功能"
git push -u origin apple
此時 GitHub 上會多一個分支：
👉 https://github.com/xu3ru8p/money/tree/apple

⑤ 隊友發 Pull Request（PR）給你審核流程：
上 GitHub 專案頁面
找到「Compare & pull request」
選擇 apple → main
送出 PR

說明：送出 PR 流程（你隊友的角度）
隊友 push 他的 apple 分支到 GitHub進到你的 repo：
https://github.com/xu3ru8p/money
GitHub 會跳出：Compare & pull request點下去
選擇：from：apple 分支     to：main 分支   填一下簡短說明
按 Create pull request

⑥ 你（主控者）審核後，合併到 main
你看完、確認沒問題後 → 按「Merge pull request」。
你的 main 就會更新。

⑦ 隊友同步最新 main，繼續下一輪開發
git checkout main
git pull origin main

接著想做新功能就再開一個新的分支，例如：
git checkout -b apple_v2