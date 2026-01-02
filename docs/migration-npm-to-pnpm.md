# 專案怎麼從 npm 改成 pnpm
[回首頁](../README.md)<br>

(2025年12月20日已將專案從 npm 改成 pnpm)

## 1️⃣ 安裝 pnpm
```bash
npm install -g pnpm
```
確認是否安裝成功：
```bash
pnpm -v
```
## 2️⃣ 刪除 npm 相關檔案
刪除整個`node_modules`資料夾和`package-lock.json`

## 3️⃣ 用 pnpm 重新安裝套件
```bash
pnpm install
```
📌 這一步會產生：
- `pnpm-lock.yaml`

## 4️⃣ 確認原本指令都能跑
```bash
pnpm dev
pnpm build
```
👉 如果能跑，代表轉換成功

## npm 與 pnpm 指令對照
| 指令功能 | npm               | pnpm           |
| ------- | ----------------- | -------------- |
| 套件安裝 | npm install       | pnpm i         |
| 套件安裝 | npm install pinia | pnpm add pinia |
| 啟動專案 | npm run dev       | pnpm dev       |
| 打包專案 | npm run build     | pnpm build     |
