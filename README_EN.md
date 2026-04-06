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