# Pine Copilot for TradingView

This is a MV3 prototype extension that can be loaded directly into Chrome via "Load unpacked".

## Current Features
- Detects the current TradingView page
- Reads current chart context: symbol, timeframes, SMA/KDJ indicator names, partial alert text
- Reads current Pine editor content
- Calls OpenAI-compatible Chat Completions API to generate Pine
- One-click to write generated result back to the editor
- One-click to copy generated result

## Installation
1. Download and extract `pine-copilot-extension.zip`
2. Open `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extracted `pine-copilot-extension` folder
6. Go to a TradingView chart page, click the extension icon to open the side panel

## Usage
1. Open your chart and Pine editor in TradingView
2. Open the Pine Copilot side panel
3. Enter API Key, Base URL, Model
4. Click "Refresh Page"
5. Click "Read Script"
6. Enter your AI modification request in the input field
7. Click "AI Generate Pine"
8. After confirming the result, click "Write to Editor"

## Testing Tips
- Click "Read Script" first to confirm it can capture the current Pine code
- Then test with a short strategy request
- If "Write to Editor" doesn't work, use "Copy" to manually paste back to TradingView

## Known Limitations
- This is a prototype; if TradingView DOM changes, selectors may need adjustment
- Currently uses full-text read/overwrite; no partial diff patch
- Currently uses OpenAI-compatible Chat Completions; for production, recommend connecting to your own backend
- `host_permissions` is set broadly for prototyping; be sure to narrow it before release

# Pine Copilot for TradingView 中文說明

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
