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

function getEditorEl() {
  const selectors = [
    'textarea[aria-label*="Editor content"]',
    'textarea[aria-label*="editor content"]',
    'textarea.inputarea',
    'textarea'
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && typeof el.value === 'string') return el;
  }
  return null;
}

function readPineEditor() {
  const el = getEditorEl();
  const titleEl = [...document.querySelectorAll('div,span,h1,h2')].find(node => /@version|indicator\(|strategy\(/i.test(node.textContent || ''));
  return {
    found: !!el,
    title: document.title,
    code: el ? el.value : '',
    detectedFromPage: titleEl ? titleEl.textContent.slice(0, 200) : ''
  };
}

function writePineEditor(code) {
  const el = getEditorEl();
  if (!el) return { success: false, message: '找不到 Pine 編輯器 textarea' };

  el.focus();
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
  if (nativeSetter) {
    nativeSetter.call(el, code);
  } else {
    el.value = code;
  }
  el.dispatchEvent(new InputEvent('input', { bubbles: true, data: code, inputType: 'insertText' }));
  el.dispatchEvent(new Event('change', { bubbles: true }));

  return { success: true, message: '已嘗試寫入 Pine 編輯器' };
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
    hasPineEditor: !!getEditorEl()
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
