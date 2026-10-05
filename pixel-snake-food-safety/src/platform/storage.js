// 平台介接層：本機存檔。第一期離線存於瀏覽器，正式版連線後與後端合併同步。
import { normalizeSave } from '../logic/progress.js';

const KEY = 'fsps-save-v1';

export function loadSave() {
  try {
    return normalizeSave(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return normalizeSave(null); // 無痕模式或儲存被封鎖時仍可遊玩
  }
}

// 遊戲參數覆寫值（展示用參數面板；正式版由管理後台之遠端參數提供）
const PARAM_KEY = 'fsps-params-v1';

export function loadParamOverrides() {
  try { return JSON.parse(localStorage.getItem(PARAM_KEY)) || {}; } catch { return {}; }
}

export function writeParamOverrides(o) {
  try { localStorage.setItem(PARAM_KEY, JSON.stringify(o)); } catch { /* 無法寫入時不套用 */ }
}

export function writeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // 無法寫入時僅本次有效，不影響遊玩
  }
}
