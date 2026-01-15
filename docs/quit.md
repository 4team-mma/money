# 懶人包

## 開啟專案步驟
### 一、打開及更新mySQL(確保code是最新的)
### 二、money-api檔，終端機輸入以下<br>
1. 更新main及自己分支檔案
   ```
   git switch main
   git pull origin main
   git checkout julia
   git pull origin main
   ```
2. 特殊狀況需要執行的行為<br>
   (1) 套件變更時
   ```
   uv sync
   ```
   (2) 重新git clone時：需要建立.env檔(貼Line群內容) <br>
   
3. 最後執行
   ```
   /dev.sh
   ```
### 三、money檔，終端機輸入以下<br>
1. 重新git clone或套件更新時
   ```
   pnpm run dev
   ```
3. 最後執行
   ```
   pnpm install
   ```
## Git Pull流程
1. 終端機輸入以下(分支名稱及更新訊息自行調整)
```
git branch
git checkout julia
git add .
git commit -m "完成 <分支名稱> 分支的功能”
git push
```
2. 到Git網頁，通知給白白
## Git Clone流程
```
cd ~/Documents/AI_Course/Project
pwd
git clone https://github.com/xxx/xxx.git
```
說明：cd定位專案載入位置、pwd再次確認所在位置
