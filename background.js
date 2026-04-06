chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    }
  } catch (err) {
    console.warn('Failed to open side panel:', err);
  }
});

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function sendToContent(type, payload = {}) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    throw new Error('找不到目前分頁');
  }
  return chrome.tabs.sendMessage(tab.id, { type, ...payload });
}

async function generatePine({ apiKey, baseUrl, model, userRequest, pageContext, currentScript }) {
  if (!apiKey) throw new Error('請先填入 API Key');
  if (!baseUrl) throw new Error('請先填入 Base URL');
  if (!model) throw new Error('請先填入 Model');

  const endpoint = baseUrl.replace(/\/$/, '') + '/chat/completions';
  const systemPrompt = [
    'You are a Pine Script expert.',
    'Generate valid Pine Script only.',
    'Prefer Pine Script v6 unless the current script clearly uses another version.',
    'Return JSON only with keys: title, pine_code, explanation, warnings.'
  ].join(' ');

  const userPrompt = [
    'User request:',
    userRequest || 'Please improve the current Pine script.',
    '',
    'Page context JSON:',
    JSON.stringify(pageContext || {}, null, 2),
    '',
    'Current Pine script:',
    currentScript || ''
  ].join('\n');

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 呼叫失敗 (${response.status}): ${text}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('模型沒有回傳內容');

  // 先剝掉 markdown code fence（```json ... ``` 或 ``` ... ```）
  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // JSON 解析仍失敗，嘗試從內容中抓 pine code block
    const codeMatch = stripped.match(/```(?:pine|pinescript)?\s*([\s\S]*?)```/i);
    return {
      title: 'Generated Pine Script',
      pine_code: codeMatch ? codeMatch[1].trim() : stripped,
      explanation: '模型回傳的內容無法解析為 JSON，已自動嘗試萃取程式碼。',
      warnings: ['Response was not valid JSON.']
    };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case 'GET_PAGE_CONTEXT': {
        const result = await sendToContent('GET_PAGE_CONTEXT');
        sendResponse({ ok: true, result });
        break;
      }
      case 'READ_PINE_EDITOR': {
        const tab = await getActiveTab();
        const injected = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: () => {
            function findTVEditor() {
              const widget = document.querySelector('.tv-script-widget');
              if (!widget) return null;
              const rk = Object.keys(widget).find(k => k.startsWith('__reactContainer'));
              if (!rk) return null;
              function walkFiber(fiber, depth) {
                if (!fiber || depth > 300) return null;
                try {
                  let s = fiber.memoizedState;
                  while (s) {
                    const v = s.memoizedState;
                    if (v?.current?._editor &&
                        typeof v.current._editor.getModel === 'function' &&
                        typeof v.current._editor.executeEdits === 'function') {
                      return v.current._editor;
                    }
                    s = s.next;
                  }
                } catch {}
                return walkFiber(fiber.child, depth + 1) || walkFiber(fiber.sibling, depth + 1);
              }
              return walkFiber(widget[rk], 0);
            }

            const editor = findTVEditor();
            if (!editor) return { found: false, source: 'none', code: '' };
            try {
              const code = editor.getModel().getValue();
              return { found: true, source: 'react-fiber._editor', code };
            } catch (e) {
              return { found: false, source: 'error', code: '', error: e.message };
            }
          }
        });
        sendResponse({ ok: true, result: injected[0]?.result ?? { found: false, source: 'inject-error', code: '' } });
        break;
      }
      case 'WRITE_PINE_EDITOR': {
        const tab = await getActiveTab();
        const injected = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          world: 'MAIN',
          func: (code) => {
            function findTVEditor() {
              const widget = document.querySelector('.tv-script-widget');
              if (!widget) return null;
              const rk = Object.keys(widget).find(k => k.startsWith('__reactContainer'));
              if (!rk) return null;
              function walkFiber(fiber, depth) {
                if (!fiber || depth > 300) return null;
                try {
                  let s = fiber.memoizedState;
                  while (s) {
                    const v = s.memoizedState;
                    if (v?.current?._editor &&
                        typeof v.current._editor.getModel === 'function' &&
                        typeof v.current._editor.executeEdits === 'function') {
                      return v.current._editor;
                    }
                    s = s.next;
                  }
                } catch {}
                return walkFiber(fiber.child, depth + 1) || walkFiber(fiber.sibling, depth + 1);
              }
              return walkFiber(widget[rk], 0);
            }

            const editor = findTVEditor();
            if (!editor) return { success: false, message: '找不到 TradingView Pine Editor（react-fiber 掃描失敗）' };
            try {
              const model = editor.getModel();
              editor.executeEdits('pine-copilot', [{
                range: model.getFullModelRange(),
                text: code,
                forceMoveMarkers: true
              }]);
              try { editor.focus(); } catch {}
              return { success: true, message: '已透過 react-fiber._editor.executeEdits 寫入' };
            } catch (e) {
              return { success: false, message: `寫入失敗: ${e.message}` };
            }
          },
          args: [message.code]
        });
        sendResponse({ ok: true, result: injected[0]?.result ?? { success: false, message: '腳本注入失敗' } });
        break;
      }
      case 'GENERATE_PINE': {
        const result = await generatePine(message.payload);
        sendResponse({ ok: true, result });
        break;
      }
      case 'SAVE_SETTINGS': {
        await chrome.storage.local.set({ pineCopilotSettings: message.payload });
        sendResponse({ ok: true });
        break;
      }
      case 'LOAD_SETTINGS': {
        const { pineCopilotSettings } = await chrome.storage.local.get('pineCopilotSettings');
        sendResponse({ ok: true, result: pineCopilotSettings || {} });
        break;
      }
      default:
        sendResponse({ ok: false, error: 'Unknown message type' });
    }
  })().catch((error) => {
    sendResponse({ ok: false, error: error?.message || String(error) });
  });
  return true;
});
