# Pine Copilot for TradingView

這是一個可直接用「載入未封裝項目」掛到 Chrome 的 MV3 原型外掛。

## 目前功能
- 偵測 TradingView 當前頁面
- 讀取目前圖表頁上下文：symbol、timeframes、SMA/KDJ 指標名稱、部分快訊文字
- 讀取目前 Pine 編輯器內容
- 呼叫 OpenAI 相容 Chat Completions API 生成 Pine
- 一鍵把生成結果寫回編輯器
- 一鍵複製生成結果

## 安裝
1. 下載並解壓縮 `pine-copilot-extension.zip`
2. 開啟 `chrome://extensions`
3. 打開右上角「開發人員模式」
4. 按「載入未封裝項目」
5. 選擇解壓縮後的 `pine-copilot-extension` 資料夾
6. 進到 TradingView 圖表頁，點外掛圖示打開 side panel

## 使用
1. 在 TradingView 打開你的圖表與 Pine 編輯器
2. 打開 Pine Copilot side panel
3. 填入 API Key、Base URL、Model
4. 按「重新抓頁面」
5. 按「讀腳本」
6. 在需求欄輸入你要 AI 修改的方向
7. 按「AI 生成 Pine」
8. 確認結果後按「寫回編輯器」

## 測試建議
- 先按「讀腳本」，確認能抓到目前 Pine
- 再用一小段簡短策略需求測試
- 若「寫回編輯器」沒成功，先用「複製」手動貼回 TradingView

## 已知限制
- 這是 prototype，TradingView DOM 若改版，selector 可能要調整
- 目前先走全文讀取 / 全文覆蓋，不做局部 diff patch
- 目前採 OpenAI 相容 Chat Completions；正式版建議改接你自己的後端
- `host_permissions` 為了原型開得較寬，正式發佈前務必縮小
