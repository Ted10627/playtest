// 玩家進度：卡片解鎖、最高分與設定。純資料運算，不涉及儲存方式。
import { ALL_CARDS, SKINS, BACKGROUNDS } from '../config/cards.js';

export function newSave() {
  return {
    best: 0,
    clears: 0,
    cards: 0,                 // 已依序解鎖之卡片數（0–13，前 10 張為知識卡）
    tutorialSeen: false,
    skin: 'base',
    bg: 'field',
    speedOn: false,           // 限定卡 L3 特殊功能開關
    music: true,              // 背景音樂開關
    sfx: true,                // 音效開關
  };
}

// 結算：更新最高分；過關時依序解鎖下一張卡片
export function applyResult(save, { passed, score }) {
  const s = { ...save };
  const prevBest = s.best;
  s.best = Math.max(s.best, score);
  const newCards = [];
  if (passed) {
    s.clears += 1;
    if (s.cards < ALL_CARDS.length) {
      newCards.push(ALL_CARDS[s.cards]);
      s.cards += 1;
    }
  }
  return { save: s, newCards, newBest: s.best > prevBest };
}

export const isSkinUnlocked = (save, id) => SKINS.find(k => k.id === id).unlock(save);
export const isBgUnlocked = (save, id) => BACKGROUNDS.find(k => k.id === id).unlock(save);

// 從存檔推導本局參數調整
export function stepMsFor(save, baseStepMs) {
  return save.speedOn && save.cards >= 13 ? Math.round(baseStepMs * 0.8) : baseStepMs;
}

// 讀到舊版或損毀的存檔時，補齊欄位並校正數值
export function normalizeSave(raw) {
  const s = { ...newSave(), ...(raw && typeof raw === 'object' ? raw : {}) };
  s.cards = Math.min(ALL_CARDS.length, Math.max(0, s.cards | 0));
  if (!isSkinUnlocked(s, s.skin) ) s.skin = 'base';
  if (!isBgUnlocked(s, s.bg)) s.bg = 'field';
  return s;
}
