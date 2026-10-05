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

export function writeSave(save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    // 無法寫入時僅本次有效，不影響遊玩
  }
}
