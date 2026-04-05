const $ = (id) => document.getElementById(id);

let pageContext = null;
let currentScript = null;
let generatedCode = '';

function setStatus(message, isError = false) {
  const el = $('status');
  el.textContent = message;
  el.className = isError ? 'error' : 'ok';
}

function pretty(obj) {
  return JSON.stringify(obj, null, 2);
}

async function sendMessage(type, payload) {
  const res = await chrome.runtime.sendMessage({ type, payload, code: payload?.code });
  if (!res?.ok) throw new Error(res?.error || '未知錯誤');
  return res.result;
}

async function loadSettings() {
  const result = await sendMessage('LOAD_SETTINGS');
  $('apiKey').value = result.apiKey || '';
  $('baseUrl').value = result.baseUrl || 'https://api.openai.com/v1';
  $('model').value = result.model || 'gpt-4o-mini';
}

async function saveSettings() {
  const payload = {
    apiKey: $('apiKey').value.trim(),
    baseUrl: $('baseUrl').value.trim(),
    model: $('model').value.trim()
  };
  await sendMessage('SAVE_SETTINGS', payload);
  setStatus('設定已儲存');
}

async function refreshContext() {
  pageContext = await sendMessage('GET_PAGE_CONTEXT');
  $('contextBox').textContent = pretty(pageContext);
  setStatus('已重新抓取頁面');
}

async function readScript() {
  currentScript = await sendMessage('READ_PINE_EDITOR');
  $('contextBox').textContent = pretty({ pageContext, currentScript });
  setStatus(currentScript.found ? '已抓到 Pine 腳本' : '目前頁面找不到 Pine 編輯器', !currentScript.found);
}

async function generate() {
  const apiKey = $('apiKey').value.trim();
  const baseUrl = $('baseUrl').value.trim();
  const model = $('model').value.trim();
  const userRequest = $('request').value.trim();

  if (!pageContext) await refreshContext();
  if (!currentScript) await readScript();

  const result = await sendMessage('GENERATE_PINE', {
    apiKey,
    baseUrl,
    model,
    userRequest,
    pageContext,
    currentScript: currentScript?.code || ''
  });

  generatedCode = result.pine_code || '';
  $('resultBox').textContent = generatedCode;
  $('metaBox').innerHTML = `
    <div><strong>${result.title || 'Generated Pine Script'}</strong></div>
    <div>${(result.explanation || '').replace(/</g, '&lt;')}</div>
    <div>${Array.isArray(result.warnings) ? result.warnings.join('<br>') : ''}</div>
  `;
  setStatus('AI 已完成生成');
}

async function copyResult() {
  if (!generatedCode) throw new Error('目前沒有可複製的 Pine');
  await navigator.clipboard.writeText(generatedCode);
  setStatus('已複製到剪貼簿');
}

async function writeBack() {
  if (!generatedCode) throw new Error('目前沒有可寫回的 Pine');
  const result = await sendMessage('WRITE_PINE_EDITOR', { code: generatedCode });
  setStatus(result.message, !result.success);
}

window.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadSettings();
    $('saveSettings').addEventListener('click', () => saveSettings().catch(err => setStatus(err.message, true)));
    $('refreshContext').addEventListener('click', () => refreshContext().catch(err => setStatus(err.message, true)));
    $('readScript').addEventListener('click', () => readScript().catch(err => setStatus(err.message, true)));
    $('generate').addEventListener('click', () => generate().catch(err => setStatus(err.message, true)));
    $('copyResult').addEventListener('click', () => copyResult().catch(err => setStatus(err.message, true)));
    $('writeBack').addEventListener('click', () => writeBack().catch(err => setStatus(err.message, true)));
    await refreshContext();
  } catch (err) {
    setStatus(err.message, true);
  }
});
