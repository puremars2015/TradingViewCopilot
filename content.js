function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function getText() {
  return document.body?.innerText || '';
}

function findSymbol(text) {
  const m = text.match(/\b([A-Z]{2,10}[0-9!]{0,3})\b/);
  return m ? m[1] : null;
}

function findTimeframes(text) {
  const matches = text.match(/\b(?:1m|3m|5m|15m|30m|45m|60m|1h|2h|4h|1d|1w|1M|5M|15M|30M|1H|4H|1D)\b/g) || [];
  return uniq(matches.map(v => v.toLowerCase()));
}

function findIndicators(text) {
  const patterns = [
    /SMA\s*\d+/gi,
    /EMA\s*\d+/gi,
    /KDJ[_\sA-Z0-9-]*/gi,
    /RSI\s*\d*/gi,
    /MACD/gi
  ];
  const results = [];
  for (const pattern of patterns) {
    const matched = text.match(pattern) || [];
    results.push(...matched.map(s => s.trim()));
  }
  return uniq(results).slice(0, 20);
}

function findRecentAlerts(text) {
  const lines = text.split('\n').map(v => v.trim()).filter(Boolean);
  const jsonLike = lines.filter(line => line.includes('{') && line.includes('}') && /(signal|symbol|timeframe|price|kd)/i.test(line));
  return jsonLike.slice(0, 10);
}

// 取得 Monaco Editor instance（含有 Pine Script 內容的）
function getMonacoEditor() {
  try {
    const editors = window.monaco?.editor?.getEditors?.() || [];
    const pine = editors.find(e => {
      const v = e.getModel()?.getValue() || '';
      return /@version|indicator\(|strategy\(|library\(/i.test(v);
    });
    return pine || editors[0] || null;
  } catch {
    return null;
  }
}

// 取得 Monaco Editor 中符合 Pine Script 的 model
function getMonacoModel() {
  try {
    const editor = getMonacoEditor();
    if (editor) return editor.getModel();
    // fallback：直接找 models
    const models = window.monaco?.editor?.getModels?.() || [];
    const pine = models.find(m => {
      const v = m.getValue();
      return /@version|indicator\(|strategy\(|library\(/i.test(v);
    });
    return pine || models[0] || null;
  } catch {
    return null;
  }
}

// textarea fallback（Monaco 不可用時）
function getEditorTextarea() {
  const selectors = [
    'textarea[aria-label*="Editor content"]',
    'textarea[aria-label*="editor content"]',
    'textarea.inputarea'
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && typeof el.value === 'string') return el;
  }
  return null;
}

function readPineEditor() {
  // 優先使用 Monaco API
  const model = getMonacoModel();
  if (model) {
    const code = model.getValue();
    return {
      found: true,
      source: 'monaco',
      title: document.title,
      code
    };
  }

  // Fallback：textarea
  const el = getEditorTextarea();
  return {
    found: !!el,
    source: 'textarea',
    title: document.title,
    code: el ? el.value : ''
  };
}

function writePineEditor(code) {
  // 優先使用 Monaco editor instance 的 executeEdits（完整觸發 change 事件與 undo history）
  const editor = getMonacoEditor();
  if (editor) {
    const model = editor.getModel();
    const fullRange = model.getFullModelRange();
    editor.executeEdits('pine-copilot', [{
      range: fullRange,
      text: code,
      forceMoveMarkers: true
    }]);
    editor.focus();
    return { success: true, message: '已透過 Monaco executeEdits 寫入 Pine 編輯器' };
  }

  // Fallback：model.setValue（monaco 有 model 但無 editor instance）
  const model = getMonacoModel();
  if (model) {
    model.setValue(code);
    return { success: true, message: '已透過 Monaco model.setValue 寫入（editor instance 不可用）' };
  }

  // Fallback：textarea
  const el = getEditorTextarea();
  if (!el) return { success: false, message: '找不到 Pine 編輯器（Monaco 與 textarea 都失敗）' };

  el.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, code);
  } else {
    el.value = code;
  }
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: code, inputType: 'insertText' }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  return { success: true, message: '已透過 textarea fallback 寫入 Pine 編輯器' };
}

function getPageContext() {
  const text = getText();
  return {
    url: location.href,
    title: document.title,
    pageType: /tradingview/i.test(location.hostname) ? 'tradingview' : 'unknown',
    symbol: findSymbol(text),
    activeTimeframes: findTimeframes(text),
    visibleIndicators: findIndicators(text),
    recentAlerts: findRecentAlerts(text),
    hasPineEditor: !!(getMonacoModel() || getEditorTextarea())
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    switch (message.type) {
      case 'GET_PAGE_CONTEXT':
        sendResponse(getPageContext());
        break;
      case 'READ_PINE_EDITOR':
        sendResponse(readPineEditor());
        break;
      case 'WRITE_PINE_EDITOR':
        sendResponse(writePineEditor(message.code || ''));
        break;
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    sendResponse({ error: error?.message || String(error) });
  }
  return true;
});
